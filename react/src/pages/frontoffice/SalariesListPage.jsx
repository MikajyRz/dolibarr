import { useEffect, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import '../../styles/salaries-list-page.css'

const SalariesListPage = () => {
  const [employees, setEmployees] = useState([])

  const [searchName, setSearchName] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchLogin, setSearchLogin] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadEmployees = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await EmployeeService.getEmployees()
      setEmployees(data)
    } catch (err) {
      setError(err.message)
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEmployees()
  }, [])

  const filteredEmployees = EmployeeService.searchEmployees(employees, {
    searchName,
    searchEmail,
    searchLogin,
  })

  const resetSearch = () => {
    setSearchName('')
    setSearchEmail('')
    setSearchLogin('')
  }

  return (
    <section className="salaries-page">
      <div className="salaries-header">
        <div>
          <p className="salaries-kicker">Frontoffice</p>
          <h1>Liste des salariés</h1>
          <p>Utilisateurs et salariés récupérés depuis Dolibarr.</p>
        </div>

        <button type="button" onClick={loadEmployees} disabled={loading}>
          Actualiser
        </button>
      </div>

      <section className="salaries-filter">
        <div className="filter-title">
          <h2>Recherche multi critère</h2>
          <span>{filteredEmployees.length} résultat(s)</span>
        </div>

        <div className="filter-grid">
          <label>
            Nom ou prénom
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Ex : Rakoto"
            />
          </label>

          <label>
            Email
            <input
              type="text"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Ex : test@gmail.com"
            />
          </label>

          <label>
            Login
            <input
              type="text"
              value={searchLogin}
              onChange={(e) => setSearchLogin(e.target.value)}
              placeholder="Ex : admin"
            />
          </label>
        </div>

        <div className="filter-actions">
          <button type="button" className="secondary-button" onClick={resetSearch}>
            Réinitialiser
          </button>
        </div>
      </section>

      {loading && <p className="status-message">Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="salaries-table">
          <div className="table-title">
            <h2>Salariés</h2>
            <span>Données Dolibarr</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Login</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Statut</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6">Aucun salarié trouvé.</td>
                  </tr>
                )}

                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.id || '-'}</td>
                    <td>{employee.login || '-'}</td>
                    <td>{employee.lastname || '-'}</td>
                    <td>{employee.firstname || '-'}</td>
                    <td>{employee.email || '-'}</td>
                    <td>{employee.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}

export default SalariesListPage
