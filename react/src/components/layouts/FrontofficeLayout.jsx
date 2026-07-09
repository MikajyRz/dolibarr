import { Link, Outlet } from 'react-router-dom'
import '../../styles/frontoffice-layout.css'

const FrontofficeLayout = () => {
  return (
    <div className="frontoffice-shell">
      <aside className="frontoffice-sidebar">
        <h2>Frontoffice</h2>

        <nav>
          {/* <Link to="/frontoffice/salaries1">Liste des salariés J1</Link> */}
          <Link to="/frontoffice/salaries">Liste des salariés</Link>
          <Link to="/frontoffice/salaries/create">Créer un salaire</Link>
          <Link to="/frontoffice/salaries/bulk-create">Générer plusieurs salaires</Link>
          <Link to="/frontoffice/salaries/bulk-create-month">Générer salaires alea</Link>
        </nav>
      </aside>

      <main className="frontoffice-content">
        <Outlet />
      </main>
    </div>
  )
}

export default FrontofficeLayout
