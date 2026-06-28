const BASE_URL = import.meta.env.VITE_DOLIBARR_API_URL || '/dolibarr-api'
const API_KEY = import.meta.env.VITE_DOLIBARR_API_KEY

// Transformer objet js en parametre URL
const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}

// Fonction principale
const request = async (endpoint, options = {}) => {
  const queryString = buildQueryString(options.params)
  const url = `${BASE_URL}${endpoint}${queryString}`

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      DOLAPIKEY: API_KEY,
      ...options.headers,
    },
    body: options.body,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        data?.error ||
        'Erreur API Dolibarr',
    )
  }

  return data
}

// Objet
export const dolibarrClient = {
  get: (endpoint, params = {}) => {
    return request(endpoint, {
      method: 'GET',
      params,
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