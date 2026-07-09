import { useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'
import { JourFerieService } from '../../services/backend/JourFerieService'
import '../../styles/bulk-salary-generation-page.css'


const currentDate = new Date()

const toArray = (value) => Array.isArray(value) ? value : []
const hasInvalidHourRange = ({ minHours, maxHours }) => minHours !== '' && maxHours !== '' && Number(minHours) > Number(maxHours)

const initialFilters = {
  poste: '',
  genre: '',
  minHours: '',
  maxHours: '',
}

const initialGeneration = {
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  dailySalary: '',
  holidayPercent: '0',
  weekendPercent: '0',
  includeSaturday: false,
  includeSunday: false,
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

function MonthlySalaryGenerationPage() {
  const [employees, setEmployees] = useState([])
  const [holidays, setHolidays] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [generation, setGeneration] = useState(initialGeneration)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    const loadData = async () => {
        setLoading(true)
        setError('')

        try {
            const [employeesData, holidaysData] = await Promise.all([EmployeeService.getEmployees(), JourFerieService.getAll()])

            setEmployees(toArray(employeesData))
            setHolidays(toArray(holidaysData))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }
    
    loadData()
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

  const monthHolidays = useMemo(() => {
    const monthKey = `${generation.year}-${String(generation.month).padStart(2, '0')}`

    return holidays.filter((holiday) => {
      return String(holiday.date || '').startsWith(monthKey)
    })
  }, [holidays, generation.month, generation.year])

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setError('')
  }

  const handleGenerationChange = (field, value) => {
    setGeneration((current) => ({
      ...current,
      [field]: value,
    }))

    setResult(null)
    setError('')
  }

  const handleGenerate = async () => {
    setError('')
    setResult(null)

    if (hasInvalidHourRange(filters)) {
      setError("L'heure minimum ne doit pas dépasser l'heure maximum.")
      return
    }

    const confirmed = window.confirm(`Voulez-vous générer les salaires pour ${filteredEmployees.length} salarié(s) ?`)

    if (!confirmed) {
      return
    }

    setGenerating(true)

    try {
      const data = await SalaryService.generateMonthlySalariesForEmployees({ employees: filteredEmployees, month: generation.month, year: generation.year, dailySalary: generation.dailySalary, holidayPercent: generation.holidayPercent, weekendPercent: generation.weekendPercent, includeSaturday: generation.includeSaturday, includeSunday: generation.includeSunday, holidays })

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
          <h1>Générer salaire mensuel</h1>
          <span>
            Générer les salaires d’un mois en excluant les périodes déjà payées.
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
        <h2>Paramètres du salaire</h2>

        <div className="bulk-salary-form-grid">
          <div className="bulk-salary-form-group">
            <label>Mois</label>
            <select
              value={generation.month}
              onChange={(event) => handleGenerationChange('month', event.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bulk-salary-form-group">
            <label>Année</label>
            <input
              type="number"
              min="2000"
              value={generation.year}
              onChange={(event) => handleGenerationChange('year', event.target.value)}
              placeholder="Ex : 2026"
            />
          </div>

          <div className="bulk-salary-form-group">
            <label>Salaire par jour</label>
            <input
              type="number"
              min="0"
              value={generation.dailySalary}
              onChange={(event) => handleGenerationChange('dailySalary', event.target.value)}
              placeholder="Ex : 10000"
            />
          </div>

          <div className="bulk-salary-form-group">
            <label>Majoration jour férié (%)</label>
            <input
              type="number"
              min="0"
              value={generation.holidayPercent}
              onChange={(event) => handleGenerationChange('holidayPercent', event.target.value)}
              placeholder="Ex : 50"
            />          
          </div>
  
<div className="bulk-salary-form-group">
  <label>
    <input
      type="checkbox"
      checked={generation.includeSaturday}
      onChange={(event) =>
        handleGenerationChange('includeSaturday', event.target.checked)
      }
    />
    Samedi
  </label>

  <label>
    <input
      type="checkbox"
      checked={generation.includeSunday}
      onChange={(event) =>
        handleGenerationChange('includeSunday', event.target.checked)
      }
    />
    Dimanche
  </label>

  {(generation.includeSaturday || generation.includeSunday) && (
    <>
      <label>Majoration weekend (%)</label>
      <input
        type="number"
        min="0"
        value={generation.weekendPercent}
        onChange={(event) =>
          handleGenerationChange('weekendPercent', event.target.value)
        }
        placeholder="Ex : 50"
      />
    </>
  )}
</div>
        </div>

        <div className="bulk-salary-summary">
          <div>
            <span>Employés concernés</span>
            <strong>{filteredEmployees.length}</strong>
          </div>

          <div>
            <span>Jours fériés du mois</span>
            <strong>{monthHolidays.length}</strong>
          </div>
        </div>

        {monthHolidays.length > 0 && (
          <ul>
            {monthHolidays.map((holiday) => (
              <li key={holiday.id}>
                {holiday.date} : {holiday.nom}
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className="bulk-salary-primary-button"
          onClick={handleGenerate}
          disabled={generating || filteredEmployees.length === 0}
        >
          {generating ? 'Génération en cours...' : 'Générer salaire mensuel'}
        </button>
      </div>

      <div className="bulk-salary-card">
        <h2>Employés concernés par le filtre</h2>

        {loading ? (
          <p className="bulk-salary-status">Chargement...</p>
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
          <h2>Résultat</h2>

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

          {result.skipped.length > 0 && (
            <>
              <p>
                Salariés ignorés : <strong>{result.skipped.length}</strong>
              </p>

              <ul>
                {result.skipped.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </>
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

export default MonthlySalaryGenerationPage
