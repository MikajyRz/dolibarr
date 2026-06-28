const BASE_URL = import.meta.env.VITE_BACKEND_API_URL || '/backend-api'

const request = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    body: options.body,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error || 'Erreur API Backend')
  }

  return data
}

export const backendClient = {
  get: (endpoint) => {
    return request(endpoint, {
      method: 'GET',
    })
  },

  post: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  },

  put: (endpoint, body = {}) => {
    return request(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  },

  delete: (endpoint) => {
    return request(endpoint, {
      method: 'DELETE',
    })
  },
}