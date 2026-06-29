import { useCallback, useEffect, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/salary-create-page.css'

const CreateSalaryPaymentPage = () => {
  const [employees, setEmployees] = useState([])

  const [salary, setSalary] = useState({
    fk_user: '',
    label: 'Salaire',
    amount: '',
    datesp: '',
    dateep: '',
  })

    const [payments, setPayments] = useState([
    {
        amount: '',
        datepaye: '',
        num_payment: 'ESPECE',
    },
    ])

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadEmployees = useCallback(async () => {
    try {
      const data = await EmployeeService.getEmployees()
      setEmployees(data)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployees()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmployees])

  const handleSalaryChange = (event) => {
    const { name, value } = event.target

    setSalary({
      ...salary,
      [name]: value,
    })
  }

  const handlePaymentChange = (index, event) => {
    const { name, value } = event.target

    const newPayments = [...payments]

    newPayments[index] = {
      ...newPayments[index],
      [name]: value,
    }

    setPayments(newPayments)
  }

  const addPaymentLine = () => {
    setPayments([
      ...payments,
      {
        amount: '',
        datepaye: '',
        num_payment: 'ESPECE',
      },
    ])
  }

  const removePaymentLine = (index) => {
    const newPayments = payments.filter((_, i) => i !== index)
    setPayments(newPayments)
  }

  const getTotalPaid = () => {
    return SalaryService.getTotalPaid(payments)
  }

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString()} Ar`
  }

  const resetForm = () => {
    setSalary({
      fk_user: '',
      label: 'Salaire',
      amount: '',
      datesp: '',
      dateep: '',
    })

    setPayments([
    {
        amount: '',
        datepaye: '',
        num_payment: 'ESPECE',
    },
    ])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const salaryId = await SalaryService.createSalaryWithPayments(
        salary,
        payments,
      )

      setMessage(`Salaire créé et paiement enregistré. ID salaire : ${salaryId}`)

      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = getTotalPaid()
  const resteAPayer = Number(salary.amount || 0) - totalPaid
  const paymentStatus =
    resteAPayer < 0
      ? 'Montant payé supérieur au salaire'
      : resteAPayer === 0
        ? 'Payé totalement'
        : 'Paiement partiel'
  const paymentStatusClass = resteAPayer < 0 ? 'status-danger' : ''

  return (
    <section className="salary-create-page">
      <div className="salary-create-header">
        <div>
          <p className="salary-create-kicker">Frontoffice</p>
          <h1>Créer et payer un salaire</h1>
          <p>Créer un salaire Dolibarr et le payer en une ou plusieurs fois.</p>
        </div>
      </div>

      <form className="salary-create-form" onSubmit={handleSubmit}>
        <section className="salary-form-section">
          <div className="section-title">
            <h2>Informations du salaire</h2>
            <span>Fiche salaire</span>
          </div>

          <div className="form-grid">
            <label>
              Salarié
              <select
                name="fk_user"
                value={salary.fk_user}
                onChange={handleSalaryChange}
              >
                <option value="">-- Choisir un salarié --</option>

                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.lastname} {employee.firstname} - {employee.login}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Libellé
              <input
                type="text"
                name="label"
                value={salary.label}
                onChange={handleSalaryChange}
                placeholder="Ex : Salaire juillet 2026"
              />
            </label>

            <label>
              Montant total
              <input
                type="number"
                name="amount"
                value={salary.amount}
                onChange={handleSalaryChange}
                placeholder="Ex : 500000"
              />
            </label>

            <label>
              Début période
              <input
                type="date"
                name="datesp"
                value={salary.datesp}
                onChange={handleSalaryChange}
              />
            </label>

            <label>
              Fin période
              <input
                type="date"
                name="dateep"
                value={salary.dateep}
                onChange={handleSalaryChange}
              />
            </label>
          </div>
        </section>

        <section className="salary-form-section">
          <div className="section-title">
            <h2>Paiements</h2>
            <span>{payments.length} ligne(s)</span>
          </div>

          <div className="payment-list">
            {payments.map((payment, index) => (
              <article className="payment-card" key={index}>
                <div className="payment-card-header">
                  <h3>Paiement {index + 1}</h3>

                  {payments.length > 1 && (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => removePaymentLine(index)}
                    >
                      Supprimer
                    </button>
                  )}
                </div>

                <div className="form-grid">
                  <label>
                    Montant payé
                    <input
                      type="number"
                      name="amount"
                      value={payment.amount}
                      onChange={(event) => handlePaymentChange(index, event)}
                      placeholder="Ex : 200000"
                    />
                  </label>

                  <label>
                    Date de règlement
                    <input
                      type="date"
                      name="datepaye"
                      value={payment.datepaye}
                      onChange={(event) => handlePaymentChange(index, event)}
                    />
                  </label>
    
                    <label>
                        Mode de paiement
                        <input type="text" value="Espèces" disabled />
                    </label>

                  <label>
                    Référence paiement
                    <input
                      type="text"
                      name="num_payment"
                      value={payment.num_payment}
                      onChange={(event) => handlePaymentChange(index, event)}
                      placeholder="Ex : Virement 001"
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={addPaymentLine}
          >
            Ajouter un paiement
          </button>
        </section>

        <section className="salary-summary">
          <div>
            <span>Montant total</span>
            <strong>{formatAmount(salary.amount)}</strong>
          </div>

          <div>
            <span>Total payé</span>
            <strong>{formatAmount(totalPaid)}</strong>
          </div>

          <div>
            <span>Reste à payer</span>
            <strong>{formatAmount(resteAPayer)}</strong>
          </div>

          <div>
            <span>Statut</span>
            <strong className={paymentStatusClass}>{paymentStatus}</strong>
          </div>
        </section>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="salary-form-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Créer et payer'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateSalaryPaymentPage
