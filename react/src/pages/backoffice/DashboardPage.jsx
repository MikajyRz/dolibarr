import { useCallback, useEffect, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/dashboard-page.css'

const DashboardPage = () => {
  const [salaryByGender, setSalaryByGender] = useState({
    homme: 0,
    femme: 0,
    autre: 0,
  })
  const [salaryByMonth, setSalaryByMonth] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [employees, salaries, payments] = await Promise.all([
        EmployeeService.getEmployees(),
        SalaryService.getSalaries(),
        SalaryService.getSalaryPayments(),
      ])

      setSalaryByGender(SalaryService.getSalaryAmountByGender(salaries, employees))
      setSalaryByMonth(
        payments.length > 0
          ? SalaryService.getPaymentAmountByMonth(payments)
          : SalaryService.getSalaryAmountByMonth(salaries),
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadDashboard()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadDashboard])

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString()} Ar`
  }

  const totalByGender =
    salaryByGender.homme + salaryByGender.femme + salaryByGender.autre

  const salaryMonths = Object.entries(salaryByMonth).sort((a, b) => {
    return a[0].localeCompare(b[0])
  })

  const totalByMonth = salaryMonths.reduce((total, item) => {
    return total + item[1]
  }, 0)

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-kicker">Backoffice</p>
          <h1>Dashboard</h1>
          <p>Montant des salaires par genre et paiements par mois.</p>
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
              <span>Total par genre</span>
              <strong>{formatAmount(totalByGender)}</strong>
            </div>
          </div>

          <div className="dashboard-table">
            <div className="dashboard-table-header">
              <h2>Montant de salaire par genre</h2>
              <span>Données salaires + employés</span>
            </div>

            <div className="table-container">
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
                      <strong>{formatAmount(totalByGender)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-table">
            <div className="dashboard-table-header">
              <div>
                <h2>Montant payé par mois</h2>
                <p>Date de paiement utilisée comme référence.</p>
              </div>
              <span>Données paiements</span>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Mois</th>
                    <th>Montant total</th>
                  </tr>
                </thead>

                <tbody>
                  {salaryMonths.length === 0 && (
                    <tr>
                      <td colSpan="2">Aucun paiement de salaire trouvé.</td>
                    </tr>
                  )}

                  {salaryMonths.map(([month, amount]) => (
                    <tr key={month}>
                      <td>{month}</td>
                      <td>{formatAmount(amount)}</td>
                    </tr>
                  ))}

                  {salaryMonths.length > 0 && (
                    <tr>
                      <td>
                        <strong>Total général</strong>
                      </td>
                      <td>
                        <strong>{formatAmount(totalByMonth)}</strong>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

export default DashboardPage
