const stats = [
  { label: 'Produits suivis', value: '128', status: 'Catalogue' },
  { label: 'Entrepôts', value: '6', status: 'Stock actif' },
  { label: 'Mouvements', value: '342', status: 'Ce mois' },
  { label: 'Utilisateurs', value: '24', status: 'Accès ERP' },
]

const rows = [
  ['REF-001', 'Produit standard', 'Disponible', '1 250'],
  ['REF-014', 'Kit installation', 'Stock faible', '32'],
  ['REF-087', 'Service maintenance', 'Actif', '-'],
]

function DashboardPage() {
  return (
    <section className="dashboard-page">
      <div className="page-title">
        <div>
          <h3>Tableau de bord</h3>
          <p>Vue synthétique des données synchronisées depuis Dolibarr.</p>
        </div>
        <button type="button" className="secondary-button">
          Exporter
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.status}</span>
            <strong>{stat.value}</strong>
            <p>{stat.label}</p>
          </article>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <h4>Derniers éléments</h4>
          <span>Synchronisation récente</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Libellé</th>
                <th>Statut</th>
                <th>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

export default DashboardPage
