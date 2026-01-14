// Cypress Custom Commands

const API_BASE_URL = 'http://localhost:8080'
const API_POSTS_BASE_URL = 'http://localhost:8090'


// Elimina un usuario por API
Cypress.Commands.add('deleteUser', (userId, token) => {
  cy.log(`Eliminando usuario ${userId}`)

  return cy
    .request({
      method: 'DELETE',
      url: `${API_BASE_URL}/user/${userId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) {
        cy.log(`Usuario ${userId} eliminado`)
      } else {
        cy.log(`No se pudo eliminar usuario ${userId} (status ${response.status})`)
        cy.log(`DELETE status: ${response.status}`)
        cy.log(JSON.stringify(response.body))
      }

      return cy.wrap(response)
    })
})

// Registra un usuario vía API
Cypress.Commands.add('registerUserViaAPI', (userData) => {
  return cy
    .request({
      method: 'POST',
      url: `${API_BASE_URL}/register`,
      body: userData,
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200 || response.status === 201) {
        return cy.wrap({
          success: true,
          userId: response.body.id_user,
          token: response.body.token,
        })
      }

      return cy.wrap({
        success: false,
        status: response.status,
        message: response.body?.error || response.body?.message,
      })
    })
})

// Login vía API
Cypress.Commands.add('loginUserViaAPI', (email, password) => {
  return cy
    .request({
      method: 'POST',
      url: `${API_BASE_URL}/login`,
      body: { email, password },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) {
        return cy.wrap({
          success: true,
          userId: response.body.id_user,
          token: response.body.token,
        })
      }

      return cy.wrap({
        success: false,
        message: response.body?.error || response.body?.message,
      })
    })
})

// Elimina un post vía API
Cypress.Commands.add('deletePostViaAPI', (postId, token) => {
  cy.log(`Eliminando post ${postId}`)

  return cy
    .request({
      method: 'DELETE',
      url: `${API_POSTS_BASE_URL}/post/${postId}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      failOnStatusCode: false,
    })
    .then((response) => {
      if (response.status === 200) {
        cy.log(`Post ${postId} eliminado`)
      } else {
        cy.log(`No se pudo eliminar post ${postId} (status ${response.status})`)
      }
      return cy.wrap(response)
    })
})
