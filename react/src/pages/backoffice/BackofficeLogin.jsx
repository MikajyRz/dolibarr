import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { backofficeAuthService } from '../../services/backofficeAuthService'
import '../../styles/backoffice-login.css'

const BackofficeLogin = () => {
  const navigate = useNavigate()

  const [code, setCode] = useState(import.meta.env.VITE_BACKOFFICE_CODE || '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (backofficeAuthService.isAuthenticated()) {
    return <Navigate to="/backoffice/dashboard" replace />
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      setError('')

      await backofficeAuthService.login(code.trim())

      navigate('/backoffice/dashboard')
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="backoffice-login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Backoffice</h1>
        <p>Entrez le code unique pour accéder au backoffice.</p>

        <label>
          Code unique
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Entrer'}
        </button>
      </form>
    </main>
  )
}

export default BackofficeLogin
