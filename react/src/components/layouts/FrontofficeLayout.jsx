import { Link, Outlet } from 'react-router-dom'
import '../../styles/frontoffice-layout.css'

const FrontofficeLayout = () => {
  return (
    <div className="frontoffice-shell">
      <aside className="frontoffice-sidebar">
        <h2>Frontoffice</h2>

        <nav>
          <Link to="/frontoffice/salaries">Liste des salariés</Link>
        </nav>
      </aside>

      <main className="frontoffice-content">
        <Outlet />
      </main>
    </div>
  )
}

export default FrontofficeLayout
