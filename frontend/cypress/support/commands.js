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

// Crea un post via API
Cypress.Commands.add(
  'createPostViaAPI',
  (
    {
      postType = 'adoption',
      postStatus = true,
      name,
      species,
      breed,
      color,
      size,
      sex,
      description,
      zone,
      healthStatus = 'Sano',
      date,
    },
    token
  ) => {
    return cy.fixture('test-image.png', 'binary').then((file) => {
      const blob = Cypress.Blob.binaryStringToBlob(file, 'image/png')

      const formData = new FormData()

      formData.append('postType', postType)
      formData.append('postStatus', String(postStatus))
      formData.append('name', name)
      formData.append('species', species)
      if (breed) formData.append('breed', breed)
      formData.append('color', color)
      formData.append('size', size)
      formData.append('sex', sex)
      formData.append('description', description)
      if (date) formData.append('date', date)
      formData.append('zone', zone)
      formData.append('healthStatus', healthStatus)
      formData.append('images', blob, 'perro.png')

      return cy.request({
        method: 'POST',
        url: `${API_POSTS_BASE_URL}/post`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        encoding: 'binary',
        failOnStatusCode: false,
      }).then((response) => {
        cy.log('POST /post response:')
        cy.log(JSON.stringify(response.body))

        return cy.wrap({
          success: response.status === 201 || response.status === 200,
          status: response.status,
          postId:
            response.body?.postId ||
            response.body?.id ||
            response.body?._id,
          body: response.body,
        })
      })
    })
  }
)


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
