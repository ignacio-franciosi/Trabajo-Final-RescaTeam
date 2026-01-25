describe('Chat E2E', () => {
  // =====================
  // Helpers
  // =====================
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

  let postId
  let user1Data

  // =====================
  // Hooks
  // =====================
  before(() => {
    cy.wrap([]).as('createdUsers')
    cy.wrap([]).as('createdPosts')
  })

  after(() => {
    // eliminar posts
    cy.get('@createdPosts').then((posts) => {
      if (!posts.length) return

      cy.get('@createdUsers').then((users) => {
        const owner = users[0]
        if (!owner?.token) return

        posts.forEach(({ postId }) => {
          cy.log(`Eliminando post ${postId}`)
          cy.deletePostViaAPI(postId, owner.token)
        })
      })
    })

    // eliminar usuarios
    cy.get('@createdUsers').then((users) => {
      users.forEach(({ userId, token }) => {
        cy.log(`Eliminando usuario ${userId}`)
        cy.deleteUser(userId, token)
      })
    })
  })

  // =====================
  // Test
  // =====================
  it('Usuario B inicia chat y Usuario A recibe el mensaje', () => {
    const postData = {
      postType: 'lost',
      postStatus: true,
      name: 'Post Chat Test',
      species: 'Perro',
      breed: 'Pichi',
      color: 'Negro',
      size: 'Mediana',
      sex: 'Hembra',
      description: 'Post para test de chat',
      zone: 'Centro',
    }

    // =====================
    // USER 1 (owner)
    // =====================
    user1Data = generateTestUser()

    cy.registerUserViaAPI({
      name: user1Data.nombre,
      surname: user1Data.apellido,
      dni: user1Data.dni,
      email: user1Data.email,
      password: user1Data.password,
      type: false,
      suspended: false,
    })
      .then((result1) => {
        expect(result1.success).to.be.true
        expect(result1.token).to.exist

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: result1.userId, token: result1.token })
        })

        // crear post (SOLO el owner)
        return cy.createPostViaAPI(postData, result1.token)
      })
      .then((response) => {
        // createPostViaAPI devuelve un objeto envuelto con postId extraído
        expect(response.status).to.eq(201)
        expect(response.postId).to.exist

        postId = response.postId

        cy.get('@createdPosts').then((posts) => {
          posts.push({ postId })
        })
      })

      // =====================
      // USER 2 (viewer)
      // =====================
      .then(() => {
        const user2Data = generateTestUser()

        return cy.registerUserViaAPI({
          name: user2Data.nombre,
          surname: user2Data.apellido,
          dni: user2Data.dni,
          email: user2Data.email,
          password: user2Data.password,
          type: false,
          suspended: false,
        })
      })
      .then((result2) => {
        cy.log(JSON.stringify(result2))
        console.log('REGISTER USER 2 RESULT', result2)
        expect(result2.success).to.be.true
        expect(result2.token).to.exist
        expect(postId).to.exist

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: result2.userId, token: result2.token })
        })

        // USER 2 inicia chat
        cy.visit(`/mascota/${postId}`)

        cy.contains('Post Chat Test', { timeout: 10000 }).should('be.visible')

        cy.get('[data-testid="start-chat-button"]', { timeout: 10000 })
          .should('be.visible')
          .and('not.be.disabled')
          .click()

        const msg = 'Hola! me interesa la mascota'
        cy.get('[data-testid="chat-input"]').type(msg)
        cy.get('[data-testid="chat-send"]').click()
        cy.contains(msg).should('be.visible')

        // =====================
        // USER 1 recibe mensaje
        // =====================
        return cy.loginUserViaAPI(user1Data.email, user1Data.password)
      })
      .then((login) => {
        expect(login.success).to.be.true

        cy.visit('/chat')

        cy.get('[data-testid="chat-item"]', { timeout: 10000 })
          .first()
          .click()

        cy.contains('Hola! me interesa la mascota', { timeout: 10000 })
          .should('be.visible')
      })
  })
})
