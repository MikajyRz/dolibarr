import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/employee-details-page.css'

const formatAmount = (amount) => `${Number(amount || 0).toLocaleString()} Ar`

const getPaymentMode = (payment) => {
  return (
    payment?.type_payment ||
    payment?.paiementtype ||
    payment?.payment_type ||
    payment?.payment_label ||
    '-'
  )
}

const EmployeeDetailsPage = () => {
  const { id } = useParams()
  const [employee, setEmployee] = useState(null)
  const [salaryHistory, setSalaryHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadEmployeeDetails = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [employeeData, history] = await Promise.all([
        EmployeeService.getEmployeeById(id),
        SalaryService.getEmployeeSalariesWithPayments(id),
      ])

      setEmployee(employeeData)
      setSalaryHistory(history)
    } catch (err) {
      setError(err.message)
      setEmployee(null)
      setSalaryHistory([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployeeDetails()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmployeeDetails])

  const totalSalaryAmount = salaryHistory.reduce((total, item) => {
    return total + item.amount
  }, 0)

  const totalPaidAmount = salaryHistory.reduce((total, item) => {
    return total + item.totalPaid
  }, 0)

  const totalRemainingAmount = salaryHistory.reduce((total, item) => {
    return total + item.remaining
  }, 0)

  return (
    <section className="employee-details-page">
      <div className="employee-details-header">
        <div>
          <p className="employee-details-kicker">Frontoffice</p>
          <h1>{EmployeeService.getEmployeeName(employee) || 'Detail salarie'}</h1>
          <p>Informations du salarie, historique des salaires et paiements.</p>
        </div>

        <Link className="employee-back-link" to="/frontoffice/salaries">
          Retour liste
        </Link>
      </div>

      {loading && <p className="status-message">Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="employee-details-card">
            <div className="employee-details-title">
              <h2>Informations du salarie</h2>
              <span>ID Dolibarr {EmployeeService.getEmployeeId(employee) || '-'}</span>
            </div>

            <div className="employee-info-grid">
              <div>
                <span>Reference</span>
                <strong>{EmployeeService.getEmployeeRef(employee) || '-'}</strong>
              </div>

              <div>
                <span>Nom complet</span>
                <strong>{EmployeeService.getEmployeeName(employee) || '-'}</strong>
              </div>

              <div>
                <span>Poste</span>
                <strong>{EmployeeService.getEmployeePoste(employee) || '-'}</strong>
              </div>

              <div>
                <span>Genre</span>
                <strong>{EmployeeService.getEmployeeGender(employee)}</strong>
              </div>

              <div>
                <span>Heures / semaine</span>
                <strong>{EmployeeService.getEmployeeWeeklyHours(employee)}</strong>
              </div>

              <div>
                <span>Login</span>
                <strong>{employee?.login || '-'}</strong>
              </div>
            </div>
          </section>

          <section className="employee-details-summary">
            <div>
              <span>Nombre de salaires</span>
              <strong>{salaryHistory.length}</strong>
            </div>

            <div>
              <span>Total salaires</span>
              <strong>{formatAmount(totalSalaryAmount)}</strong>
            </div>

            <div>
              <span>Total paye</span>
              <strong>{formatAmount(totalPaidAmount)}</strong>
            </div>

            <div>
              <span>Reste a payer</span>
              <strong className={totalRemainingAmount > 0 ? 'amount-danger' : ''}>
                {formatAmount(totalRemainingAmount)}
              </strong>
            </div>
          </section>

          <section className="employee-details-card">
            <div className="employee-details-title">
              <h2>Historique des salaires et paiements</h2>
              <span>{salaryHistory.length} ligne(s)</span>
            </div>

            <div className="table-container employee-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Ref. salaire</th>
                    <th>Periode</th>
                    <th>Montant salaire</th>
                    <th>Total paye</th>
                    <th>Reste a payer</th>
                    <th>Paiements</th>
                  </tr>
                </thead>

                <tbody>
                  {salaryHistory.map((item) => (
                    <tr key={item.salaryId}>
                      <td>{item.ref}</td>
                      <td>
                        {SalaryService.formatDate(item.startDate)} au{' '}
                        {SalaryService.formatDate(item.endDate)}
                      </td>
                      <td>{formatAmount(item.amount)}</td>
                      <td>{formatAmount(item.totalPaid)}</td>
                      <td>{formatAmount(item.remaining)}</td>
                      <td>
                        {item.payments.length > 0 ? (
                          <table className="payment-history-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Montant</th>
                                <th>Mode</th>
                                <th>Numero</th>
                              </tr>
                            </thead>

                            <tbody>
                              {item.payments.map((payment, index) => (
                                <tr key={payment.id || payment.rowid || index}>
                                  <td>
                                    {SalaryService.formatDate(
                                      SalaryService.getPaymentDate(payment),
                                    )}
                                  </td>
                                  <td>
                                    {formatAmount(
                                      SalaryService.getPaymentAmountForSalary(
                                        payment,
                                        item.salaryId,
                                      ),
                                    )}
                                  </td>
                                  <td>{getPaymentMode(payment)}</td>
                                  <td>{payment.num_payment || payment.ref || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <span className="empty-payment">Aucun paiement</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {salaryHistory.length === 0 && (
                    <tr>
                      <td colSpan="6">Aucun salaire trouve pour ce salarie.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  )
}

export default EmployeeDetailsPage
