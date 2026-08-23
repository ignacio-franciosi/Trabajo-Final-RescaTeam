// E2E Posts
// Tests for post creation, edition and deletion

describe('Posts E2E Tests', () => {

  // Helpers
  const generateTestUser = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)

    return {
      nombre: `Test${timestamp}`,
      apellido: `User${random}`,
      dni: parseInt(`${timestamp}${random}`.slice(-8)),
      email: `test${timestamp}${random}@cypress.test`,
      password: 'TestPassword123',
    }
  }

  const createPostViaUI = ({ name, description }) => {
    cy.intercept('POST', '**/post').as('createPost')

    cy.visit('/publicar/adopcion')

    cy.get('input[name="name"]').type(name)
    cy.get('select[name="species"]').select('perro')
    cy.get('input[name="age"]').type('2')
    cy.get('input[name="color"]').type('Negro')
    cy.get('select[name="size"]').select('mediano')
    cy.get('select[name="sex"]').select('hembra')
    cy.get('textarea[name="description"]').type(description)

    cy.contains('label', /zona|barrio/i)
      .parent()
      .within(() => {
        cy.get('[role="combobox"]')
          .click()
          .type('Centro{enter}')
        })

    cy.get('#adoption-file-input')
      .selectFile('cypress/fixtures/test-image.png', { force: true })

    
    //cy.log('Form filled, about to submit')
    //cy.get('form').then(($form) => {
    //  cy.log('Form found:', $form.length)
    //})

    cy.get('[data-testid="submit-post"]')
      .should('be.visible')
      .should('not.be.disabled')
      .click()

    cy.wait('@createPost').then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 201])

      const postId = response.body.postId
      expect(postId).to.exist

      cy.get('@createdPosts').then((posts) => {
        posts.push({ postId })
      })
    })

    cy.url({ timeout: 10000 }).should('include', '/mis-publicaciones')
    cy.contains(name).should('be.visible')
  }

  const setupUser = () => {
    const userData = generateTestUser()

    return cy
      .registerUserViaAPI({
        name: userData.nombre,
        surname: userData.apellido,
        dni: userData.dni,
        email: userData.email,
        password: userData.password,
        type: false,
        suspended: false,
      })
      .then((result) => {
        expect(result.success).to.be.true

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: result.userId, token: result.token })
        })

        cy.loginUserViaAPI(userData.email, userData.password).then((login) => {
          expect(login.success).to.be.true

          cy.visit('/', {
            onBeforeLoad(win) {
              win.localStorage.setItem('token', login.token)
              win.localStorage.setItem(
                'user',
                JSON.stringify({
                  userId: login.userId,
                  type: false,
                  suspended: false,
                })
              )
            },
          })
        })
      })
  }

  // Hooks
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()

    cy.wrap([]).as('createdUsers')
    cy.wrap([]).as('createdPosts')
  })

  afterEach(() => {
    // Clean posts first
    cy.get('@createdPosts').then((posts) => {
      if (!posts.length) return

      cy.get('@createdUsers').then((users) => {
        const user = users[0]
        if (!user?.token) return

        posts.forEach(({ postId }) => {
          cy.deletePostViaAPI(postId, user.token)
        })
      })
    })

    // Clean users
    cy.get('@createdUsers').then((users) => {
      users.forEach(({ userId, token }) => {
        cy.deleteUser(userId, token)
      })
    })
  })

  // Tests
  describe('Create Post', () => {
    it('should create an adoption post successfully', () => {
      setupUser()
      createPostViaUI({
        name: 'Luna',
        description: 'Very friendly dog',
      })
    })
  })

  describe('Edit Post', () => {
    it('should edit an existing post', () => {
      setupUser()

      const postName = `Edit Test ${Date.now()}`
      createPostViaUI({
        name: postName,
        description: 'Original description',
      })

      cy.contains(postName)
        .closest('[data-testid="post-card"]')
        .parent()
        .within(() => {
          cy.contains('button', /editar/i).click()
        })

      cy.get('input[name="name"]').clear().type(`${postName} Updated`)
      cy.get('textarea[name="description"]')
        .clear()
        .type('Updated description')

      cy.contains('button', /actualizar|guardar/i).click()
      cy.url({ timeout: 10000 }).should('include', '/mis-publicaciones')
      cy.contains(`${postName} Updated`).should('be.visible')
    })
  })

  describe('Delete Post', () => {
    it('should delete a post successfully', () => {
      setupUser()

      const postName = `Delete Test ${Date.now()}`
      createPostViaUI({
        name: postName,
        description: 'Post to be deleted',
      })

      cy.contains(postName)
        .closest('[data-testid="post-card"]')
        .parent()
        .within(() => {
          cy.contains('button', /eliminar/i).click({ force: true })
        })

      // Esperar a que el modal aparezca y buscar el botón dentro del modal
      cy.contains(/¿estás seguro/i).should('be.visible')
      // Buscar el botón rojo "Eliminar" dentro del contenedor del modal
      cy.get('.fixed.inset-0')
        .within(() => {
          cy.contains('button', /eliminar/i).should('be.visible').click()
        })

      cy.contains(postName).should('not.exist')
    })
  })
})
