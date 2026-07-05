import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/salary-create-page.css'

const MODE_CREATE = 'create'
const MODE_PAY_EXISTING = 'pay-existing'

const initialSalary = {
  fk_user: '',
  label: 'Salaire',
  amount: '',
  datesp: '',
  dateep: '',
}

const initialPayment = {
  amount: '',
  datepaye: '',
  num_payment: 'ESPECE',
}

const CreateSalaryPaymentPage = () => {
  const [mode, setMode] = useState(MODE_CREATE)
  const [employees, setEmployees] = useState([])
  const [salary, setSalary] = useState(initialSalary)
  const [payments, setPayments] = useState([{ ...initialPayment }])
  const [employeeSalaries, setEmployeeSalaries] = useState([])
  const [selectedSalaryId, setSelectedSalaryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSalaries, setLoadingSalaries] = useState(false)
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

  const loadEmployeeSalaries = useCallback(async (employeeId) => {
    if (!employeeId) {
      setEmployeeSalaries([])
      setSelectedSalaryId('')
      return
    }

    setLoadingSalaries(true)
    setError('')

    try {
      const data = await SalaryService.getEmployeeSalariesWithPayments(employeeId)
      setEmployeeSalaries(data)
      setSelectedSalaryId('')
    } catch (err) {
      setEmployeeSalaries([])
      setSelectedSalaryId('')
      setError(err.message)
    } finally {
      setLoadingSalaries(false)
    }
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadEmployees()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmployees])

  useEffect(() => {
    if (mode !== MODE_PAY_EXISTING) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      loadEmployeeSalaries(salary.fk_user)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loadEmployeeSalaries, mode, salary.fk_user])

  const selectedSalary = useMemo(() => {
    return employeeSalaries.find((item) => {
      return Number(item.salaryId) === Number(selectedSalaryId)
    })
  }, [employeeSalaries, selectedSalaryId])

  const payableSalaries = useMemo(() => {
    return employeeSalaries.filter((item) => Number(item.remaining || 0) > 0)
  }, [employeeSalaries])

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setMessage('')
    setError('')
    setSelectedSalaryId('')
    setPayments([{ ...initialPayment }])

    if (nextMode === MODE_CREATE) {
      setEmployeeSalaries([])
    }
  }

  const handleSalaryChange = (event) => {
    const { name, value } = event.target

    setSalary((current) => ({
      ...current,
      [name]: value,
    }))

    if (name === 'fk_user') {
      setSelectedSalaryId('')
      setEmployeeSalaries([])
    }

    setMessage('')
    setError('')
  }

  const handlePaymentChange = (index, event) => {
    const { name, value } = event.target
    const newPayments = [...payments]

    newPayments[index] = {
      ...newPayments[index],
      [name]: value,
    }

    setPayments(newPayments)
    setMessage('')
    setError('')
  }

  const addPaymentLine = () => {
    setPayments([...payments, { ...initialPayment }])
  }

  const removePaymentLine = (index) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const getTotalPaid = () => {
    return SalaryService.getTotalPaid(payments)
  }

  const formatAmount = (amount) => {
    return `${Number(amount || 0).toLocaleString()} Ar`
  }

  const resetPayments = () => {
    setPayments([{ ...initialPayment }])
  }

  const resetForm = () => {
    setSalary(initialSalary)
    setEmployeeSalaries([])
    setSelectedSalaryId('')
    resetPayments()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setError('')

    try {
      if (mode === MODE_PAY_EXISTING) {
        const salaryId = await SalaryService.payExistingSalary(selectedSalary, payments)

        setMessage(`Paiement enregistre pour le salaire ID ${salaryId}.`)
        resetPayments()
        await loadEmployeeSalaries(salary.fk_user)
      } else {
        const salaryId = await SalaryService.createSalaryWithPayments(salary, payments)

        setMessage(`Salaire cree et paiement enregistre. ID salaire : ${salaryId}`)
        resetForm()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPaid = getTotalPaid()
  const salaryAmount =
    mode === MODE_PAY_EXISTING
      ? Number(selectedSalary?.amount || 0)
      : Number(salary.amount || 0)
  const alreadyPaid =
    mode === MODE_PAY_EXISTING ? Number(selectedSalary?.totalPaid || 0) : 0
  const remainingBeforePayment =
    mode === MODE_PAY_EXISTING
      ? Number(selectedSalary?.remaining || 0)
      : salaryAmount
  const resteAPayer = remainingBeforePayment - totalPaid
  const paymentStatus =
    resteAPayer < 0
      ? 'Montant paye superieur au reste'
      : resteAPayer === 0 && salaryAmount > 0
        ? 'Paye totalement'
        : 'Paiement partiel'
  const paymentStatusClass = resteAPayer < 0 ? 'status-danger' : ''

  return (
    <section className="salary-create-page">
      <div className="salary-create-header">
        <div>
          <p className="salary-create-kicker">Frontoffice</p>
          <h1>Creer ou payer un salaire</h1>
          <p>Creer un nouveau salaire ou ajouter un paiement sur un salaire existant.</p>
        </div>
      </div>

      <form className="salary-create-form" onSubmit={handleSubmit}>
        <section className="salary-form-section">
          <div className="section-title">
            <h2>Action</h2>
            <span>{mode === MODE_CREATE ? 'Nouveau salaire' : 'Salaire existant'}</span>
          </div>

          <div className="salary-mode-toggle">
            <button
              type="button"
              className={mode === MODE_CREATE ? 'active' : ''}
              onClick={() => handleModeChange(MODE_CREATE)}
            >
              Creer et payer un salaire
            </button>

            <button
              type="button"
              className={mode === MODE_PAY_EXISTING ? 'active' : ''}
              onClick={() => handleModeChange(MODE_PAY_EXISTING)}
            >
              Payer un salaire existant
            </button>
          </div>
        </section>

        <section className="salary-form-section">
          <div className="section-title">
            <h2>Informations du salaire</h2>
            <span>{mode === MODE_CREATE ? 'Fiche salaire' : 'Selection du salaire'}</span>
          </div>

          <div className="form-grid">
            <label>
              Salarie
              <select
                name="fk_user"
                value={salary.fk_user}
                onChange={handleSalaryChange}
              >
                <option value="">-- Choisir un salarie --</option>

                {employees.map((employee) => {
                  const employeeId = EmployeeService.getEmployeeId(employee)

                  return (
                    <option key={employeeId} value={employeeId}>
                      {EmployeeService.getEmployeeName(employee)} - {employee.login}
                    </option>
                  )
                })}
              </select>
            </label>

            {mode === MODE_PAY_EXISTING && (
              <label>
                Salaire existant
                <select
                  value={selectedSalaryId}
                  onChange={(event) => {
                    setSelectedSalaryId(event.target.value)
                    setMessage('')
                    setError('')
                  }}
                  disabled={!salary.fk_user || loadingSalaries}
                >
                  <option value="">
                    {loadingSalaries ? 'Chargement...' : '-- Choisir un salaire --'}
                  </option>

                  {payableSalaries.map((item) => (
                    <option key={item.salaryId} value={item.salaryId}>
                      {item.ref} - {SalaryService.formatDate(item.startDate)} au{' '}
                      {SalaryService.formatDate(item.endDate)} - reste{' '}
                      {formatAmount(item.remaining)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {mode === MODE_CREATE && (
              <>
                <label>
                  Libelle
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
                  Debut periode
                  <input
                    type="date"
                    name="datesp"
                    value={salary.datesp}
                    onChange={handleSalaryChange}
                  />
                </label>

                <label>
                  Fin periode
                  <input
                    type="date"
                    name="dateep"
                    value={salary.dateep}
                    onChange={handleSalaryChange}
                  />
                </label>
              </>
            )}
          </div>

          {mode === MODE_PAY_EXISTING && salary.fk_user && !loadingSalaries && payableSalaries.length === 0 && (
            <p className="salary-inline-message">
              Aucun salaire avec reste a payer pour ce salarie.
            </p>
          )}
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
                    Montant paye
                    <input
                      type="number"
                      name="amount"
                      value={payment.amount}
                      onChange={(event) => handlePaymentChange(index, event)}
                      placeholder="Ex : 200000"
                    />
                  </label>

                  <label>
                    Date de reglement
                    <input
                      type="date"
                      name="datepaye"
                      value={payment.datepaye}
                      onChange={(event) => handlePaymentChange(index, event)}
                    />
                  </label>

                  <label>
                    Mode de paiement
                    <input type="text" value="Especes" disabled />
                  </label>

                  <label>
                    Reference paiement
                    <input
                      type="text"
                      name="num_payment"
                      value={payment.num_payment}
                      onChange={(event) => handlePaymentChange(index, event)}
                      placeholder="Ex : Espece 001"
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
            <span>Montant salaire</span>
            <strong>{formatAmount(salaryAmount)}</strong>
          </div>

          <div>
            <span>Deja paye</span>
            <strong>{formatAmount(alreadyPaid)}</strong>
          </div>

          <div>
            <span>Nouveau paiement</span>
            <strong>{formatAmount(totalPaid)}</strong>
          </div>

          <div>
            <span>Reste a payer</span>
            <strong className={paymentStatusClass}>{formatAmount(resteAPayer)}</strong>
          </div>

          <div>
            <span>Statut</span>
            <strong className={paymentStatusClass}>{paymentStatus}</strong>
          </div>
        </section>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}

        <div className="salary-form-actions">
          <button type="submit" disabled={loading || loadingSalaries}>
            {loading
              ? 'Enregistrement...'
              : mode === MODE_PAY_EXISTING
                ? 'Enregistrer le paiement'
                : 'Creer et payer'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default CreateSalaryPaymentPage
