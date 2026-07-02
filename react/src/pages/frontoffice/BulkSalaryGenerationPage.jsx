import { useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import '../../styles/bulk-salary-generation-page.css'

const initialFilters = {
  poste: '',
  genre: '',
  minHours: '',
  maxHours: '',
}

const initialSalary = {
  datesp: '',
  dateep: '',
  amount: '',
}

function BulkSalaryGenerationPage() {
  const [employees, setEmployees] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [salary, setSalary] = useState(initialSalary)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const loadEmployees = async () => {
      setLoading(true)
      setError('')

      try {
        const data = await EmployeeService.getEmployees()
        setEmployees(data)
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

  const filteredEmployees = useMemo(() => {
    return EmployeeService.filterEmployeesForSalaryGeneration(employees, filters)
  }, [employees, filters])

  const totalAmount = filteredEmployees.length * Number(salary.amount || 0)

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setError('')
  }

  const handleSalaryChange = (field, value) => {
    setSalary((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setError('')
  }

  const handleGenerateSalary = async () => {
    setGenerating(true)
    setError('')
    setResult(null)

    try {
      const data = await SalaryService.generateSalariesForEmployees({
        employees: filteredEmployees,
        datesp: salary.datesp,
        dateep: salary.dateep,
        amount: salary.amount,
      })

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section className="bulk-salary-page">
      <div className="bulk-salary-header">
        <div>
          <p className="bulk-salary-kicker">FrontOffice</p>
          <h1>Générer les salaires</h1>
          <span>
            Filtrer les employés puis générer le salaire pour tous les employés correspondant au filtre.
          </span>
        </div>
      </div>

      {error && (
        <div className="bulk-salary-alert bulk-salary-alert-danger">
          {error}
        </div>
      )}

      <div className="bulk-salary-card">
        <h2>Filtres employés</h2>

        <div className="bulk-salary-form-grid">
          <div className="bulk-salary-form-group">
            <label>Poste</label>
            <select
              value={filters.poste}
              onChange={(event) => handleFilterChange('poste', event.target.value)}
            >
              <option value="">Tous les postes</option>

              {postes.map((poste) => (
                <option key={poste} value={poste}>
                  {poste}
                </option>
              ))}
            </select>
          </div>

          <div className="bulk-salary-form-group">
            <label>Genre</label>
            <select
              value={filters.genre}
              onChange={(event) => handleFilterChange('genre', event.target.value)}
            >
              <option value="">Tous les genres</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </div>

          <div className="bulk-salary-form-group">
            <label>Heure de travail min</label>
            <input
              type="number"
              min="0"
              value={filters.minHours}
              onChange={(event) => handleFilterChange('minHours', event.target.value)}
              placeholder="Ex : 30"
            />
          </div>

          <div className="bulk-salary-form-group">
            <label>Heure de travail max</label>
            <input
              type="number"
              min="0"
              value={filters.maxHours}
              onChange={(event) => handleFilterChange('maxHours', event.target.value)}
              placeholder="Ex : 40"
            />
          </div>
        </div>
      </div>

      <div className="bulk-salary-card">
        <h2>Informations du salaire</h2>

        <div className="bulk-salary-form-grid">
          <div className="bulk-salary-form-group">
            <label>Date début</label>
            <input
              type="date"
              value={salary.datesp}
              onChange={(event) => handleSalaryChange('datesp', event.target.value)}
            />
          </div>

          <div className="bulk-salary-form-group">
            <label>Date fin</label>
            <input
              type="date"
              value={salary.dateep}
              onChange={(event) => handleSalaryChange('dateep', event.target.value)}
            />
          </div>

          <div className="bulk-salary-form-group">
            <label>Montant</label>
            <input
              type="number"
              min="0"
              value={salary.amount}
              onChange={(event) => handleSalaryChange('amount', event.target.value)}
              placeholder="Ex : 300000"
            />
          </div>
        </div>

        <div className="bulk-salary-summary">
          <div>
            <span>Employés concernés</span>
            <strong>{filteredEmployees.length}</strong>
          </div>

          <div>
            <span>Montant total</span>
            <strong>{totalAmount.toLocaleString()} Ar</strong>
          </div>
        </div>

        <button
          type="button"
          className="bulk-salary-primary-button"
          onClick={handleGenerateSalary}
          disabled={generating || filteredEmployees.length === 0}
        >
          {generating ? 'Génération en cours...' : 'Générer salaire'}
        </button>
      </div>

      <div className="bulk-salary-card">
        <h2>Employés concernés par le filtre</h2>

        {loading ? (
          <p className="bulk-salary-status">Chargement des employés...</p>
        ) : (
          <div className="table-container">
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
                {filteredEmployees.map((employee) => (
                  <tr key={EmployeeService.getEmployeeId(employee)}>
                    <td>{EmployeeService.getEmployeeRef(employee)}</td>
                    <td>{EmployeeService.getEmployeeName(employee)}</td>
                    <td>{EmployeeService.getEmployeePoste(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeeGender(employee)}</td>
                    <td>{EmployeeService.getEmployeeWeeklyHours(employee)}</td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      Aucun employé ne correspond au filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {result && (
        <div className="bulk-salary-card">
          <h2>Résultat de génération</h2>

          <p>
            Salaires créés : <strong>{result.created.length}</strong>
          </p>

          {result.created.length > 0 && (
            <ul>
              {result.created.map((item, index) => (
                <li key={index}>{item.message}</li>
              ))}
            </ul>
          )}

          {result.errors.length > 0 && (
            <div className="bulk-salary-alert bulk-salary-alert-danger">
              <strong>Erreurs</strong>
              <ul>
                {result.errors.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default BulkSalaryGenerationPage
