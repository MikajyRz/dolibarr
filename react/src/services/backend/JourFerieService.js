import { backendClient } from './backendClient'

export const JourFerieService = {
  getAll: () => {
    return backendClient.get('/jours-feries')
  },

  getById: (id) => {
    return backendClient.get(`/jours-feries/${id}`)
  },

  create: (jourFerie) => {
    return backendClient.post('/jours-feries', jourFerie)
  },

  update: (id, jourFerie) => {
    return backendClient.put(`/jours-feries/${id}`, jourFerie)
  },

  delete: (id) => {
    return backendClient.delete(`/jours-feries/${id}`)
  },
}