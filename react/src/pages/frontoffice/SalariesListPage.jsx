import { useCallback, useEffect, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import '../../styles/salaries-list-page.css'

const SalariesListPage = () => {
  const [employees, setEmployees] = useState([])
  const [searchRef, setSearchRef] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchGender, setSearchGender] = useState('')
  const [searchLogin, setSearchLogin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadEmployees = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployees()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmployees])

  const filteredEmployees = EmployeeService.searchEmployees(employees, {
    searchRef,
    searchName,
    searchGender,
    searchLogin,
  })

  const resetSearch = () => {
    setSearchRef('')
    setSearchName('')
    setSearchGender('')
    setSearchLogin('')
  }

  return (
    <section className="salaries-page">
      <div className="salaries-header">
        <div>
          <p className="salaries-kicker">Frontoffice</p>
          <h1>Liste des salariés</h1>
          <p>Références, noms, genres et identifiants des employés Dolibarr.</p>
        </div>

        <button type="button" onClick={loadEmployees} disabled={loading}>
          Actualiser
        </button>
      </div>

      <section className="salaries-filter">
        <div className="filter-title">
          <h2>Recherche multicritère</h2>
          <span>{filteredEmployees.length} résultat(s)</span>
        </div>

        <div className="filter-grid">
          <label>
            Référence
            <input
              type="text"
              value={searchRef}
              onChange={(event) => setSearchRef(event.target.value)}
              placeholder="Ex : 1"
            />
          </label>

          <label>
            Nom
            <input
              type="text"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              placeholder="Ex : Rakoto"
            />
          </label>

          <label>
            Genre
            <select
              value={searchGender}
              onChange={(event) => setSearchGender(event.target.value)}
            >
              <option value="">Tous</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label>
            Login / identifiant
            <input
              type="text"
              value={searchLogin}
              onChange={(event) => setSearchLogin(event.target.value)}
              placeholder="Ex : rakoto1"
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
                  <th>Réf.</th>
                  <th>Nom</th>
                  <th>Genre</th>
                  <th>Login / identifiant</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="4">Aucun salarié trouvé.</td>
                  </tr>
                )}

                {filteredEmployees.map((employee) => (
                  <tr key={employee.id || EmployeeService.getEmployeeRef(employee)}>
                    <td>{EmployeeService.getEmployeeRef(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeeName(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeeGender(employee)}</td>
                    <td>{employee.login || '-'}</td>
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
