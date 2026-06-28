const BACKOFFICE_AUTH_KEY = 'backoffice_auth'

export const backofficeAuthService = {
  // Connecter l'utilisateur
  login: async (code) => {
    const validCode = import.meta.env.VITE_BACKOFFICE_CODE

    if (code !== validCode) {
      throw new Error('Code backoffice incorrect')
    }

    localStorage.setItem(BACKOFFICE_AUTH_KEY, 'true')

    return true
  },

  logout: () => {
    localStorage.removeItem(BACKOFFICE_AUTH_KEY)
  },

  // Verifie si connecte ou non
  isAuthenticated: () => {
    return localStorage.getItem(BACKOFFICE_AUTH_KEY) === 'true'
  },
}