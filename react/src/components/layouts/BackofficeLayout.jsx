import { NavLink, Outlet } from 'react-router-dom'

const menuItems = [
  { to: '/backoffice/dashboard', label: 'Dashboard' },
  { to: '/backoffice/products', label: 'Produits' },
  { to: '/backoffice/warehouses', label: 'Entrepôts' },
  { to: '/backoffice/stock-movements', label: 'Mouvements stock' },
  { to: '/backoffice/users', label: 'Utilisateurs' },
  { to: '/backoffice/holidays', label: 'Congés' },
  { to: '/backoffice/expense-reports', label: 'Notes de frais' },
  { to: '/backoffice/salaries', label: 'Salaires' },
]

function BackofficeLayout() {
  return (
    <div className="backoffice-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">D</span>
          <div>
            <h1>NewApp</h1>
            <span>Connecteur Dolibarr</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation backoffice">
          {menuItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Backoffice</p>
            <h2>Gestion Dolibarr</h2>
          </div>
          <button type="button">Synchroniser</button>
        </header>

        <Outlet />
      </main>
    </div>
  )
}

export default BackofficeLayout
