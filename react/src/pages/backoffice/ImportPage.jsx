import { useState } from 'react'
import { ImportCsvService } from '../../services/dolibarr/import/importCsvService'
import { ImportDolibarrService } from '../../services/dolibarr/import/importDolibarrService'
import { ImportImagesZipService } from '../../services/dolibarr/import/importImagesZipService'
import { ImportValidationService } from '../../services/dolibarr/import/importValidationService'
import '../../styles/import-page.css'

function ImportPage() {
  const [employeesFile, setEmployeesFile] = useState(null)
  const [salariesFile, setSalariesFile] = useState(null)
  const [imagesFile, setImagesFile] = useState(null)
  const [employees, setEmployees] = useState([])
  const [salaries, setSalaries] = useState([])
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState([])
  const [previewDone, setPreviewDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [importResult, setImportResult] = useState(null)

  const canPreview = Boolean(employeesFile || salariesFile || imagesFile)
  const canImport =
    previewDone &&
    errors.length === 0 &&
    (employees.length > 0 || salaries.length > 0 || images.length > 0)

  const resetPreview = () => {
    images.forEach((image) => {
      if (image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl)
      }
    })

    setEmployees([])
    setSalaries([])
    setImages([])
    setErrors([])
    setPreviewDone(false)
    setImportResult(null)
    setProgress('')
  }

  const handlePreview = async () => {
    if (!canPreview) {
      setErrors(['Veuillez sélectionner au moins un fichier à importer.'])
      return
    }

    setLoading(true)
    setProgress('Lecture des fichiers...')
    setImportResult(null)

    try {
      const parsedEmployees = employeesFile
        ? await ImportCsvService.readEmployeesCsv(employeesFile)
        : []
      const parsedSalaries = salariesFile
        ? await ImportCsvService.readSalariesCsv(salariesFile)
        : []
      const parsedImages = imagesFile
        ? await ImportImagesZipService.read(imagesFile)
        : []

      const validationErrors = [
        ...(employeesFile ? ImportValidationService.validateEmployees(parsedEmployees) : []),
        ...(salariesFile
          ? ImportValidationService.validateSalaries(parsedSalaries, parsedEmployees)
          : []),
        ...(imagesFile
          ? ImportValidationService.validateImages(parsedImages, parsedEmployees)
          : []),
      ]

      setEmployees(parsedEmployees)
      setSalaries(parsedSalaries)
      setImages(parsedImages)
      setErrors(validationErrors)
      setPreviewDone(true)
      setProgress(
        validationErrors.length === 0
          ? 'Prévisualisation terminée. Aucune erreur détectée.'
          : 'Prévisualisation terminée avec des erreurs.',
      )
    } catch (error) {
      setErrors([error.message])
      setPreviewDone(false)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!canImport) {
      return
    }

    setLoading(true)
    setProgress("Début de l'import vers Dolibarr...")
    setImportResult(null)

    try {
      const result = await ImportDolibarrService.importAll({
        employees,
        salaries,
        images,
        onProgress: setProgress,
      })

      setImportResult(result)
    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const totalPayments = salaries.reduce((total, salary) => {
    return total + salary.payments.length
  }, 0)

  const totalSalaryAmount = salaries.reduce((total, salary) => {
    return total + salary.montant
  }, 0)

  const totalPaidAmount = salaries.reduce((total, salary) => {
    return total + salary.total_paye
  }, 0)

  return (
    <section className="import-page">
      <div className="import-header">
        <div>
          <p className="import-kicker">Backoffice</p>
          <h1>Import des données</h1>
          <p>Importer les employés, les salaires, les paiements et les images dans Dolibarr.</p>
        </div>
      </div>

      <div className="import-upload-grid">
        <div className="import-upload-card">
          <label>Feuille 1 - Employés</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setEmployeesFile(event.target.files?.[0] || null)
              resetPreview()
            }}
          />
          <small>Colonnes : ref_employe, nom, genre, identifiant, mdp, heure_travail_semaine</small>
        </div>

        <div className="import-upload-card">
          <label>Feuille 2 - Salaires</label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => {
              setSalariesFile(event.target.files?.[0] || null)
              resetPreview()
            }}
          />
          <small>Colonnes : ref_salaire, ref_employe, date_debut, date_fin, montant, paiement</small>
        </div>

        <div className="import-upload-card">
          <label>ZIP des images</label>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => {
              setImagesFile(event.target.files?.[0] || null)
              resetPreview()
            }}
          />
          <small>Exemple : 1.png correspond à ref_employe = 1</small>
        </div>
      </div>

      <div className="import-actions">
        <button type="button" className="btn-outline" onClick={handlePreview} disabled={!canPreview || loading}>
          {loading ? 'Chargement...' : 'Prévisualiser'}
        </button>

        <button type="button" className="btn-primary" onClick={handleImport} disabled={!canImport || loading}>
          {loading ? 'Import en cours...' : 'Importer dans Dolibarr'}
        </button>
      </div>

      {progress && <p className="import-progress">{progress}</p>}

      {errors.length > 0 && (
        <div className="alert alert-danger">
          <strong>Erreurs détectées</strong>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {previewDone && (
        <div className="import-summary-grid">
          <div className="import-summary-card">
            <span>Employés</span>
            <strong>{employees.length}</strong>
          </div>

          <div className="import-summary-card">
            <span>Salaires</span>
            <strong>{salaries.length}</strong>
          </div>

          <div className="import-summary-card">
            <span>Paiements</span>
            <strong>{totalPayments}</strong>
          </div>

          <div className="import-summary-card">
            <span>Images</span>
            <strong>{images.length}</strong>
          </div>

          <div className="import-summary-card">
            <span>Montant total</span>
            <strong>{totalSalaryAmount.toLocaleString()} Ar</strong>
          </div>

          <div className="import-summary-card">
            <span>Total payé</span>
            <strong>{totalPaidAmount.toLocaleString()} Ar</strong>
          </div>
        </div>
      )}

      {employees.length > 0 && (
        <div className="import-preview-card">
          <h2>Aperçu des employés</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Nom</th>
                  <th>Genre</th>
                  <th>Identifiant</th>
                  <th>Heures / semaine</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.ref_employe}>
                    <td>{employee.ref_employe}</td>
                    <td>{employee.nom}</td>
                    <td>{employee.genre}</td>
                    <td>{employee.identifiant}</td>
                    <td>{employee.heure_travail_semaine}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {salaries.length > 0 && (
        <div className="import-preview-card">
          <h2>Aperçu des salaires</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Réf salaire</th>
                  <th>Réf employé</th>
                  <th>Début</th>
                  <th>Fin</th>
                  <th>Montant</th>
                  <th>Total payé</th>
                  <th>Reste</th>
                  <th>Nb paiements</th>
                </tr>
              </thead>

              <tbody>
                {salaries.map((salary) => (
                  <tr key={salary.ref_salaire}>
                    <td>{salary.ref_salaire}</td>
                    <td>{salary.ref_employe}</td>
                    <td>{salary.date_debut}</td>
                    <td>{salary.date_fin}</td>
                    <td>{salary.montant.toLocaleString()} Ar</td>
                    <td>{salary.total_paye.toLocaleString()} Ar</td>
                    <td>{salary.reste_a_payer.toLocaleString()} Ar</td>
                    <td>{salary.payments.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="import-preview-card">
          <h2>Aperçu des images</h2>

          <div className="image-preview-grid">
            {images.map((image) => (
              <div className="image-preview-card" key={image.filename}>
                <img src={image.previewUrl} alt={image.filename} />
                <strong>{image.filename}</strong>
                <span>Employé : {image.ref_employe}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {importResult && (
        <div className="import-report">
          <h2>Résultat de l'import</h2>

          <div className="import-report-section">
            <h3>Employés</h3>
            <ul>
              {importResult.employees.map((item, index) => (
                <li key={index}>{item.message}</li>
              ))}
            </ul>
          </div>

          <div className="import-report-section">
            <h3>Images</h3>
            <ul>
              {importResult.images.map((item, index) => (
                <li key={index}>{item.message}</li>
              ))}
            </ul>
          </div>

          <div className="import-report-section">
            <h3>Salaires et paiements</h3>
            <ul>
              {importResult.salaries.map((item, index) => (
                <li key={index}>
                  {item.message} Paiements créés : {item.paymentsCreated || 0}
                </li>
              ))}
            </ul>
          </div>

          {importResult.errors.length > 0 && (
            <div className="alert alert-danger">
              <strong>Erreurs pendant l'import</strong>
              <ul>
                {importResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default ImportPage
