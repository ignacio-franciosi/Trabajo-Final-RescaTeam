// E2E Auth
// Creates and cleans up test users

describe('Auth E2E Tests', () => {
  
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

  // Hooks
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.clearCookies()

    // Alias to track created users for cleanup
    cy.wrap([]).as('createdUsers')
  })

  afterEach(() => {
    cy.get('@createdUsers').then((users) => {
      if (!users.length) return

      cy.log(`Cleaning up ${users.length} user(s)`)

      users.forEach(({ userId, token }) => {
        if (userId && token) {
          cy.deleteUser(userId, token)
        }
      })
    })
  })

  // User Registration
  describe('User Registration', () => {
    it('should successfully register a new user', () => {
      const userData = generateTestUser()

      cy.visit('/register')

      cy.get('input[name="nombre"]').type(userData.nombre)
      cy.get('input[name="apellido"]').type(userData.apellido)
      cy.get('input[name="dni"]').type(userData.dni.toString())
      cy.get('input[name="email"]').type(userData.email)
      cy.get('input[name="password"]').type(userData.password)

      cy.contains('button', /registrarse/i).click()

      cy.url({ timeout: 10000 }).should('not.include', '/register')
      cy.window().its('localStorage.token').should('exist')
      cy.window().its('localStorage.user').should('exist')

      cy.window().then((win) => {
        const user = JSON.parse(win.localStorage.getItem('user'))
        const token = win.localStorage.getItem('token')

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: user.userId, token })
        })
      })
    })

    it('should show an error when the email already exists', () => {
      const userData = generateTestUser()

      cy.registerUserViaAPI({
        name: userData.nombre,
        surname: userData.apellido,
        dni: userData.dni,
        email: userData.email,
        password: userData.password,
        type: false,
        suspended: false,
      }).then((result) => {
        expect(result.success).to.be.true

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: result.userId, token: result.token })
        })

        cy.visit('/register')

        cy.get('input[name="nombre"]').type(userData.nombre)
        cy.get('input[name="apellido"]').type(userData.apellido)
        cy.get('input[name="dni"]').type(userData.dni.toString())
        cy.get('input[name="email"]').type(userData.email)
        cy.get('input[name="password"]').type(userData.password)

        cy.contains('button', /registrarse/i).click()
        cy.contains(/error|already exists|exists/i).should('be.visible')
      })
    })
  })

  // Login
  describe('Login', () => {
    it('should log in successfully with valid credentials', () => {
      const userData = generateTestUser()

      cy.registerUserViaAPI({
        name: userData.nombre,
        surname: userData.apellido,
        dni: userData.dni,
        email: userData.email,
        password: userData.password,
        type: false,
        suspended: false,
      }).then((result) => {
        expect(result.success).to.be.true

        cy.get('@createdUsers').then((users) => {
          users.push({ userId: result.userId, token: result.token })
        })

        cy.visit('/login')

        cy.get('input[type="email"]').type(userData.email)
        cy.get('input[type="password"]').type(userData.password)
        cy.contains('button', /ingresar/i).click()

        cy.url({ timeout: 10000 }).should('not.include', '/login')
        cy.window().its('localStorage.token').should('exist')
      })
    })

    it('should show an error with invalid credentials', () => {
      cy.visit('/login')

      cy.get('input[type="email"]').type('noexiste@test.com')
      cy.get('input[type="password"]').type('WrongPassword123')
      cy.contains('button', /ingresar/i).click()

      cy.contains(/error|invalid|credentials/i).should('be.visible')
      cy.window().its('localStorage.token').should('not.exist')
    })
  })

  // Logout
  describe('Logout', () => {
    it('should log out successfully', () => {
      const userData = generateTestUser()

      cy.registerUserViaAPI({
        name: userData.nombre,
        surname: userData.apellido,
        dni: userData.dni,
        email: userData.email,
        password: userData.password,
        type: false,
        suspended: false,
      }).then((result) => {
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
                JSON.stringify({ userId: login.userId })
              )
            },
          })

          cy.get('button[aria-haspopup="menu"]').first().click()
          cy.contains(/logout|cerrar sesión/i).click()

          cy.url().should('include', '/login')
          cy.window().its('localStorage.token').should('not.exist')
        })
      })
    })
  })
})