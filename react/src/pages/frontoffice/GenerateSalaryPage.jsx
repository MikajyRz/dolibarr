import { useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'

const currentDate = new Date()

const initialPayment = {
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  priorityPoste: '',
  amount: '',
}

const months = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

function GenerateSalaryPaymentPage() {
  const [employees, setEmployees] = useState([])
  const [payment, setPayment] = useState(initialPayment)
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await EmployeeService.getEmployees()
        setEmployees(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadEmployees()
  }, [])

  const postes = useMemo(() => {
    const values = employees
      .map((employee) => EmployeeService.getEmployeePoste(employee))
      .filter(Boolean)

    return [...new Set(values)].sort()
  }, [employees])

  const handlePaymentChange = (field, value) => {
    setPayment((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setError('')
  }

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString()} Ar`
  }

  const handlePay = async () => {
    setError('')
    setResult(null)

    const confirmed = window.confirm(
      `Voulez-vous payer les salaires de ${employees.length} salarié(s) selon l'ordre prévu ?`,
    )

    if (!confirmed) {
      return
    }

    setPaying(true)

    try {
      const data = await SalaryService.generatePaymentsByOrder({
        employees,
        month: payment.month,
        year: payment.year,
        priorityPoste: payment.priorityPoste,
        amount: payment.amount,
      })

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setPaying(false)
    }
  }

  return (
    <section>
      <div>
        <p>FrontOffice</p>
        <h1>Générer paiement</h1>
        {/* <p>
          Choisir le mois, l'année, le poste prioritaire et le montant disponible.
          Le paiement se fait d'abord par poste prioritaire, puis par date de début
          salaire la plus ancienne.
        </p> */}
      </div>

      {error && <p>{error}</p>}

      <section>
        <h2>Paramètres du paiement</h2>

        <div>
          <label>
            Mois
            <select
              value={payment.month}
              onChange={(event) => handlePaymentChange('month', event.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Année
            <input
              type="number"
              min="2000"
              value={payment.year}
              onChange={(event) => handlePaymentChange('year', event.target.value)}
              placeholder="Ex : 2026"
            />
          </label>

          <label>
            Poste prioritaire
            <select
              value={payment.priorityPoste}
              onChange={(event) => handlePaymentChange('priorityPoste', event.target.value)}
            >
              <option value="">-- Choisir le poste prioritaire --</option>

              {postes.map((poste) => (
                <option key={poste} value={poste}>
                  {poste}
                </option>
              ))}
            </select>
          </label>

          <label>
            Montant disponible
            <input
              type="number"
              min="0"
              value={payment.amount}
              onChange={(event) => handlePaymentChange('amount', event.target.value)}
              placeholder="Ex : 500000"
            />
          </label>
        </div>

        {/* <p>Employés concernés : {employees.length}</p> */}

        <button
          type="button"
          onClick={handlePay}
          disabled={paying || loading || employees.length === 0}
        >
          {paying ? 'Paiement en cours...' : 'Payer'}
        </button>
      </section>

      <section>
        <h2>Employés concernés</h2>

        {loading ? (
          <p>Chargement des employés...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Réf.</th>
                <th>Nom</th>
                <th>Poste</th>
                <th>Genre</th>
                <th>Heures / semaine</th>
              </tr>
            </thead>

            <tbody>
              {employees.map((employee) => (
                <tr key={EmployeeService.getEmployeeId(employee)}>
                  <td>{EmployeeService.getEmployeeRef(employee)}</td>
                  <td>{EmployeeService.getEmployeeName(employee)}</td>
                  <td>{EmployeeService.getEmployeePoste(employee) || '-'}</td>
                  <td>{EmployeeService.getEmployeeGender(employee)}</td>
                  <td>{EmployeeService.getEmployeeWeeklyHours(employee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {result && (
        <section>
          <h2>Résultat du paiement</h2>

          <p>Budget saisi : {formatAmount(result.budget)}</p>
          <p>Total payé : {formatAmount(result.totalPaid)}</p>
          <p>Reste du budget : {formatAmount(result.remainingBudget)}</p>

          {result.paid.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Employé</th>
                  <th>Poste</th>
                  <th>Période salaire</th>
                  <th>Montant payé</th>
                  <th>Type</th>
                </tr>
              </thead>

              <tbody>
                {result.paid.map((item) => (
                  <tr key={item.salaryId}>
                    <td>{item.employeeName}</td>
                    <td>{item.poste || '-'}</td>
                    <td>
                      {SalaryService.formatDate(item.startDate)} au{' '}
                      {SalaryService.formatDate(item.endDate)}
                    </td>
                    <td>{formatAmount(item.amountPaid)}</td>
                    <td>{item.isPartial ? 'Partiel' : 'Total'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {result.skipped.length > 0 && (
            <div>
              <h3>Non payé</h3>

              <ul>
                {result.skipped.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div>
              <h3>Erreurs</h3>

              <ul>
                {result.errors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </section>
  )
}

export default GenerateSalaryPaymentPage