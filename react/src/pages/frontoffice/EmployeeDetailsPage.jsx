import { useCallback, useEffect, useState } from 'react'
import {
  Link,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/employee-details-page.css'

const formatAmount = (amount) => {
  return `${Number(amount || 0).toLocaleString()} Ar`
}

const formatMonth = (monthKey) => {
  if (!monthKey) {
    return ''
  }

  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

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
  const [searchParams] = useSearchParams()
  const selectedMonth = searchParams.get('month')

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

  const displayedSalaryHistory = selectedMonth
    ? salaryHistory.filter((item) => {
        return (
          SalaryService.getMonthKeyFromDate(item.startDate) ===
          selectedMonth
        )
      })
    : salaryHistory

  const totalSalaryAmount = displayedSalaryHistory.reduce(
    (total, item) => {
      return total + Number(item.amount || 0)
    },
    0,
  )

  const totalPaidAmount = displayedSalaryHistory.reduce(
    (total, item) => {
      return total + Number(item.totalPaid || 0)
    },
    0,
  )

  const totalRemainingAmount = displayedSalaryHistory.reduce(
    (total, item) => {
      return total + Number(item.remaining || 0)
    },
    0,
  )

  const backLink = selectedMonth
    ? '/frontoffice/salaries/remaining'
    : '/frontoffice/salaries'

  const backText = selectedMonth
    ? 'Retour aux restes à payer'
    : 'Retour liste'

  return (
    <section className="employee-details-page">
      <div className="employee-details-header">
        <div>
          <p className="employee-details-kicker">
            Frontoffice
          </p>

          <h1>
            {EmployeeService.getEmployeeName(employee) ||
              'Détail salarié'}
          </h1>

          <p>
            Informations du salarié, historique des salaires et
            paiements.
          </p>

          {selectedMonth && (
            <p>
              Mois sélectionné : {formatMonth(selectedMonth)}
            </p>
          )}
        </div>

        <Link className="employee-back-link" to={backLink}>
          {backText}
        </Link>
      </div>

      {loading && (
        <p className="status-message">Chargement...</p>
      )}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="employee-details-card">
            <div className="employee-details-title">
              <h2>Informations du salarié</h2>

              <span>
                ID Dolibarr{' '}
                {EmployeeService.getEmployeeId(employee) || '-'}
              </span>
            </div>

            <div className="employee-info-grid">
              <div>
                <span>Référence</span>

                <strong>
                  {EmployeeService.getEmployeeRef(employee) || '-'}
                </strong>
              </div>

              <div>
                <span>Nom complet</span>

                <strong>
                  {EmployeeService.getEmployeeName(employee) || '-'}
                </strong>
              </div>

              <div>
                <span>Poste</span>

                <strong>
                  {EmployeeService.getEmployeePoste(employee) || '-'}
                </strong>
              </div>

              <div>
                <span>Genre</span>

                <strong>
                  {EmployeeService.getEmployeeGender(employee)}
                </strong>
              </div>

              <div>
                <span>Heures / semaine</span>

                <strong>
                  {EmployeeService.getEmployeeWeeklyHours(employee)}
                </strong>
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

              <strong>{displayedSalaryHistory.length}</strong>
            </div>

            <div>
              <span>Total salaires</span>

              <strong>
                {formatAmount(totalSalaryAmount)}
              </strong>
            </div>

            <div>
              <span>Total payé</span>

              <strong>
                {formatAmount(totalPaidAmount)}
              </strong>
            </div>

            <div>
              <span>Reste à payer</span>

              <strong
                className={
                  totalRemainingAmount > 0
                    ? 'amount-danger'
                    : ''
                }
              >
                {formatAmount(totalRemainingAmount)}
              </strong>
            </div>
          </section>

          <section className="employee-details-card">
            <div className="employee-details-title">
              <h2>
                Historique des salaires et paiements
              </h2>

              <span>
                {displayedSalaryHistory.length} ligne(s)
              </span>
            </div>

            <div className="table-container employee-history-table">
              <table>
                <thead>
                  <tr>
                    <th>Réf. salaire</th>
                    <th>Période</th>
                    <th>Montant salaire</th>
                    <th>Total payé</th>
                    <th>Reste à payer</th>
                    <th>Paiements</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedSalaryHistory.map((item) => (
                    <tr key={item.salaryId}>
                      <td>{item.ref}</td>

                      <td>
                        {SalaryService.formatSalaryPeriod(
                          item.startDate,
                          item.endDate,
                        )}
                      </td>

                      <td>
                        {formatAmount(item.amount)}
                      </td>

                      <td>
                        {formatAmount(item.totalPaid)}
                      </td>

                      <td>
                        {formatAmount(item.remaining)}
                      </td>

                      <td>
                        {item.payments.length > 0 ? (
                          <table className="payment-history-table">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Montant</th>
                                <th>Mode</th>
                                <th>Numéro</th>
                              </tr>
                            </thead>

                            <tbody>
                              {item.payments.map(
                                (payment, index) => (
                                  <tr
                                    key={
                                      payment.id ||
                                      payment.rowid ||
                                      index
                                    }
                                  >
                                    <td>
                                      {SalaryService.formatDate(
                                        SalaryService.getPaymentDate(
                                          payment,
                                        ),
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

                                    <td>
                                      {getPaymentMode(payment)}
                                    </td>

                                    <td>
                                      {payment.num_payment ||
                                        payment.ref ||
                                        '-'}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        ) : (
                          <span className="empty-payment">
                            Aucun paiement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {displayedSalaryHistory.length === 0 && (
                    <tr>
                      <td colSpan="6">
                        Aucun salaire trouvé pour cet employé
                        {selectedMonth
                          ? ` en ${formatMonth(selectedMonth)}.`
                          : '.'}
                      </td>
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