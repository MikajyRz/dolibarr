import { useEffect, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import '../../styles/dashboard-page.css'

const DashboardPage = () => {
  const [salaryByGender, setSalaryByGender] = useState({
    homme: 0,
    femme: 0,
    autre: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const employees = await EmployeeService.getEmployees()
      const result = EmployeeService.getSalaryAmountByGender(employees)

      setSalaryByGender(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const total =
    salaryByGender.homme + salaryByGender.femme + salaryByGender.autre

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString()} Ar`
  }

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Backoffice</p>
          <h1>Dashboard</h1>
          <p>Montant total des salaires par genre.</p>
        </div>

        <button type="button" onClick={loadDashboard} disabled={loading}>
          Actualiser
        </button>
      </div>

      {loading && <p className="status-message">Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <span>Hommes</span>
              <strong>{formatAmount(salaryByGender.homme)}</strong>
            </div>

            <div className="dashboard-card">
              <span>Femmes</span>
              <strong>{formatAmount(salaryByGender.femme)}</strong>
            </div>

            <div className="dashboard-card">
              <span>Autres / non renseigné</span>
              <strong>{formatAmount(salaryByGender.autre)}</strong>
            </div>

            <div className="dashboard-card total">
              <span>Total général</span>
              <strong>{formatAmount(total)}</strong>
            </div>
          </div>

          <div className="dashboard-table">
            <h2>Détail par genre</h2>

            <table>
              <thead>
                <tr>
                  <th>Genre</th>
                  <th>Montant total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Hommes</td>
                  <td>{formatAmount(salaryByGender.homme)}</td>
                </tr>

                <tr>
                  <td>Femmes</td>
                  <td>{formatAmount(salaryByGender.femme)}</td>
                </tr>

                <tr>
                  <td>Autres / non renseigné</td>
                  <td>{formatAmount(salaryByGender.autre)}</td>
                </tr>

                <tr>
                  <td>
                    <strong>Total général</strong>
                  </td>
                  <td>
                    <strong>{formatAmount(total)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

export default DashboardPage