import { useCallback, useEffect, useMemo, useState } from 'react'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import '../../styles/salaries-list-page.css'

function EmployeePhoto({ employee }) {
  const [photoUrl, setPhotoUrl] = useState('')
  const name = EmployeeService.getEmployeeName(employee)

  useEffect(() => {
    let mounted = true

    EmployeeService.getEmployeePhotoDataUrl(employee)
      .then((url) => {
        if (mounted) {
          setPhotoUrl(url)
        }
      })
      .catch(() => {
        if (mounted) {
          setPhotoUrl('')
        }
      })

    return () => {
      mounted = false
    }
  }, [employee])

  if (!photoUrl) {
    return <div className="employee-photo-placeholder">-</div>
  }

  return (
    <img
      className="employee-photo"
      src={photoUrl}
      alt={name || 'Employé'}
    />
  )
}

const SalariesListPage = () => {
  const [employees, setEmployees] = useState([])
  const [searchRef, setSearchRef] = useState('')
  const [searchName, setSearchName] = useState('')
  const [searchPost, setSearchPost] = useState('')
  const [searchGender, setSearchGender] = useState('')
  const [searchLogin, setSearchLogin] = useState('')
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

  const filteredEmployees = EmployeeService.searchEmployees(employees, {
    searchRef,
    searchName,
    searchPost,
    searchGender,
    searchLogin,
  })

  const postOptions = useMemo(() => {
    const posts = employees
      .map((employee) => EmployeeService.getEmployeePoste(employee).trim())
      .filter(Boolean)

    return [...new Set(posts)].sort((firstPost, secondPost) =>
      firstPost.localeCompare(secondPost),
    )
  }, [employees])

  const resetSearch = () => {
    setSearchRef('')
    setSearchName('')
    setSearchPost('')
    setSearchGender('')
    setSearchLogin('')
  }

  return (
    <section className="salaries-page">
      <div className="salaries-header">
        <div>
          <p className="salaries-kicker">Frontoffice</p>
          <h1>Liste des salariés</h1>
          <p>Références, photos, noms, genres et identifiants des employés Dolibarr.</p>
        </div>

        <button type="button" onClick={loadEmployees} disabled={loading}>
          Actualiser
        </button>
      </div>

      <section className="salaries-filter">
        <div className="filter-title">
          <h2>Recherche multicritère</h2>
          <span>{filteredEmployees.length} résultat(s)</span>
        </div>

        <div className="filter-grid">
          <label>
            Référence
            <input
              type="text"
              value={searchRef}
              onChange={(event) => setSearchRef(event.target.value)}
              placeholder="Ex : 1"
            />
          </label>

          <label>
            Nom
            <input
              type="text"
              value={searchName}
              onChange={(event) => setSearchName(event.target.value)}
              placeholder="Ex : Rakoto"
            />
          </label>

          <label>
            Poste
            <select
              value={searchPost}
              onChange={(event) => setSearchPost(event.target.value)}
            >
              <option value="">Tous</option>
              {postOptions.map((post) => (
                <option key={post} value={post}>
                  {post}
                </option>
              ))}
            </select>
          </label>
        

          <label>
            Genre
            <select
              value={searchGender}
              onChange={(event) => setSearchGender(event.target.value)}
            >
              <option value="">Tous</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="autre">Autre</option>
            </select>
          </label>

          <label>
            Login / identifiant
            <input
              type="text"
              value={searchLogin}
              onChange={(event) => setSearchLogin(event.target.value)}
              placeholder="Ex : rakoto1"
            />
          </label>
        </div>

        <div className="filter-actions">
          <button type="button" className="secondary-button" onClick={resetSearch}>
            Réinitialiser
          </button>
        </div>
      </section>

      {loading && <p className="status-message">Chargement...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="salaries-table">
          <div className="table-title">
            <h2>Salariés</h2>
            <span>Données Dolibarr</span>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Réf.</th>
                  <th>Nom</th>
                  <th>Poste</th>
                  <th>Genre</th>
                  <th>Login / identifiant</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan="6">Aucun salarié trouvé.</td>
                  </tr>
                )}

                {filteredEmployees.map((employee) => (
                  <tr key={employee.id || EmployeeService.getEmployeeRef(employee)}>
                    <td>
                      <EmployeePhoto
                        key={EmployeeService.getEmployeeRef(employee)}
                        employee={employee}
                      />
                    </td>
                    <td>{EmployeeService.getEmployeeRef(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeeName(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeePoste(employee) || '-'}</td>
                    <td>{EmployeeService.getEmployeeGender(employee)}</td>
                    <td>{employee.login || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  )
}

export default SalariesListPage
