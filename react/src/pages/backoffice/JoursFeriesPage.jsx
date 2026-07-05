import { useEffect, useState } from 'react'
import { JourFerieService } from '../../services/backend/JourFerieService'
import '../../styles/jours-feries-page.css'

const initialForm = {
  nom: '',
  date: '',
}

function JoursFeriesPage() {
  const [joursFeries, setJoursFeries] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isEditing = Boolean(editingId)

  const loadJoursFeries = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await JourFerieService.getAll()
      setJoursFeries(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message)
      setJoursFeries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadJoursFeries()
  }, [])

  const handleChange = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
    setSuccess('')
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setError('')
  }

  const validateForm = () => {
    if (!form.nom.trim()) {
      throw new Error('Le nom du jour férié est obligatoire.')
    }

    if (!form.date) {
      throw new Error('La date du jour férié est obligatoire.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      validateForm()

      const payload = {
        nom: form.nom.trim(),
        date: form.date,
      }

      if (isEditing) {
        await JourFerieService.update(editingId, payload)
        setSuccess('Jour férié modifié avec succès.')
      } else {
        await JourFerieService.create(payload)
        setSuccess('Jour férié ajouté avec succès.')
      }

      resetForm()
      await loadJoursFeries()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (jourFerie) => {
    setEditingId(jourFerie.id)
    setForm({
      nom: jourFerie.nom || '',
      date: jourFerie.date || '',
    })

    setError('')
    setSuccess('')
  }

  const handleDelete = async (jourFerie) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le jour férié "${jourFerie.nom}" ?`,
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')

    try {
      await JourFerieService.delete(jourFerie.id)
      setSuccess('Jour férié supprimé avec succès.')

      if (editingId === jourFerie.id) {
        resetForm()
      }

      await loadJoursFeries()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="jours-feries-page">
      <div className="page-header">
        <div>
          <h1>Jours fériés</h1>
          <p>Créer, modifier et supprimer les jours fériés utilisés par le backend SQLite.</p>
        </div>

        <button type="button" onClick={loadJoursFeries} disabled={loading}>
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="jours-feries-grid">
        <form className="jours-feries-form" onSubmit={handleSubmit}>
          <h2>{isEditing ? 'Modifier un jour férié' : 'Ajouter un jour férié'}</h2>

          <div className="form-group">
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              type="text"
              value={form.nom}
              onChange={(event) => handleChange('nom', event.target.value)}
              placeholder="Ex : Fête de l'indépendance"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(event) => handleChange('date', event.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
            </button>

            {isEditing && (
              <button type="button" className="button-secondary" onClick={resetForm}>
                Annuler
              </button>
            )}
          </div>
        </form>

        <div className="jours-feries-list">
          <h2>Liste des jours fériés</h2>

          {loading ? (
            <p>Chargement des jours fériés...</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {joursFeries.length === 0 && (
                    <tr>
                      <td colSpan="4">Aucun jour férié enregistré.</td>
                    </tr>
                  )}

                  {joursFeries.map((jourFerie) => (
                    <tr key={jourFerie.id}>
                      <td>{jourFerie.id}</td>
                      <td>{jourFerie.nom}</td>
                      <td>{jourFerie.date}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => handleEdit(jourFerie)}
                          >
                            Modifier
                          </button>

                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => handleDelete(jourFerie)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default JoursFeriesPage
