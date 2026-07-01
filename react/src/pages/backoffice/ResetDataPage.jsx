import { useState } from 'react'
import { ResetDataService } from '../../services/dolibarr/reset/ResetDataService'
import '../../styles/reset-data-page.css'

function ResetDataPage() {
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canReset = !loading

  const handlePreview = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    setProgress('Analyse...')

    try {
      setPreview(await ResetDataService.preview())
      setProgress('')
    } catch (err) {
      setError(err.message)
      setProgress('')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!canReset) {
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setProgress('Réinitialisation...')

    try {
      const resetResult = await ResetDataService.resetAll({
        onProgress: setProgress,
      })

      setResult(resetResult)
      setPreview(await ResetDataService.preview())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="reset-page">
      <div className="reset-header">
        <div>
          <p className="reset-kicker">Backoffice</p>
          <h1>Réinitialisation</h1>
          <p>Paiements si disponibles, salaires, photos, puis utilisateurs sauf rowid=1.</p>
        </div>
      </div>

      <div className="reset-card">
        <button type="button" className="btn-outline" onClick={handlePreview} disabled={loading}>
          Analyser
        </button>

        {preview && (
          <div className="reset-counts">
            <span>Paiements listés : {preview.paymentsCount}</span>
            <span>Salaires : {preview.salariesCount}</span>
            <span>Utilisateurs à supprimer : {preview.deletableUsersCount}</span>
            <span>Conservés : {preview.keptUsersCount}</span>
          </div>
        )}

        <button type="button" className="danger-button" onClick={handleReset} disabled={!canReset}>
          {loading ? 'Traitement...' : 'Réinitialiser'}
        </button>
      </div>

      {progress && <p className="reset-progress">{progress}</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="reset-card">
          <h2>Résultat</h2>

          <div className="reset-counts">
            <span>Paiements supprimés : {result.summary.paymentsDeleted}</span>
            <span>Salaires supprimés : {result.summary.salariesDeleted}</span>
            <span>Photos supprimées : {result.summary.photosDeleted}</span>
            <span>Photos partielles : {result.summary.photosPartial}</span>
            <span>Utilisateurs supprimés : {result.summary.usersDeleted}</span>
            <span>Utilisateurs conservés : {result.summary.usersKept}</span>
          </div>

          {result.errors.length > 0 && (
            <div className="reset-errors">
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

export default ResetDataPage
