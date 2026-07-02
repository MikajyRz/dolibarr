import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import '../../styles/salaries-list-page.css'

const SalariesListPage = () => {
  const [employees, setEmployees] = useState([])
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

  return (
    <section className="salaries-page">
      <div className="salaries-header">
        <div>
          <p className="salaries-kicker">Frontoffice</p>
          <h1>Liste des salaries</h1>
          <p>Liste complete des salaries Dolibarr, sans filtre.</p>
        </div>

        <button type="button" onClick={loadEmployees} disabled={loading}>
          Actualiser
        </button>
      </div>

      {loading && <p className="status-message">Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="salaries-table">
          <div className="table-title">
            <h2>Salaries</h2>
            <span>{employees.length} salarie(s)</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ref.</th>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Genre</th>
                  <th>Heures / semaine</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => {
                  const employeeId = EmployeeService.getEmployeeId(employee)

                  return (
                    <tr key={employeeId || EmployeeService.getEmployeeRef(employee)}>
                      <td>{EmployeeService.getEmployeeRef(employee) || '-'}</td>
                      <td>{EmployeeService.getEmployeeName(employee) || '-'}</td>
                      <td>{EmployeeService.getEmployeePoste(employee) || '-'}</td>
                      <td>{EmployeeService.getEmployeeGender(employee)}</td>
                      <td>{EmployeeService.getEmployeeWeeklyHours(employee)}</td>
                      <td>
                        {employeeId ? (
                          <Link
                            className="employee-detail-link"
                            to={`/frontoffice/salaries/${employeeId}`}
                          >
                            Voir detail
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  )
                })}

                {employees.length === 0 && (
                  <tr>
                    <td colSpan="6">Aucun salarie trouve.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}

export default SalariesListPage
