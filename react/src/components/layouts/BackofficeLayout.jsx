import { Link, Outlet, useNavigate } from 'react-router-dom'
import { backofficeAuthService } from '../../services/backofficeAuthService'
import '../../styles/backoffice-layout.css'

function BackofficeLayout() {
  const navigate = useNavigate()

  const handleLogout = () => {
    backofficeAuthService.logout()
    navigate('/backoffice')
  }

  return (
    <div className="backoffice-shell">
      <aside className="sidebar">
        <h2>NewApp Dolibarr</h2>

        <nav>
          <Link to="/backoffice/dashboard">Dashboard</Link>
          <Link to="/backoffice/products">Produits</Link>
          <Link to="/backoffice/import">Import</Link>
          <Link to="/backoffice/reset">Réinitialisation</Link>
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          Déconnexion
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}

export default BackofficeLayout
