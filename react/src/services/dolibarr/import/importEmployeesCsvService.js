import { parseCsvFile } from './importCsvReader'
import { cleanText, normalizeGender, parseAmount } from './importUtils'

function normalizeEmployeeRow(row) {
  const normalized = { ...row }
  const extraColumns = Array.isArray(row.__parsed_extra) ? row.__parsed_extra : []
  const hours = cleanText(row.heure_travail_semaine)
  const firstPosteValue = cleanText(row.poste)

  if (extraColumns.length > 0 && /^\d+$/.test(hours) && /^\d+$/.test(firstPosteValue)) {
    normalized.heure_travail_semaine = `${hours},${firstPosteValue}`
    normalized.poste = extraColumns.map((value) => cleanText(value)).join(',')
  }

  return normalized
}

export const ImportEmployeesCsvService = {
  read: async (file) => {
    const rows = await parseCsvFile(file, { allowFieldMismatch: true })

    return rows.map((row, index) => {
      const employeeRow = normalizeEmployeeRow(row)

      return {
        line: index + 2,
        ref_employe: cleanText(employeeRow.ref_employe),
        nom: cleanText(employeeRow.nom),
        genre: normalizeGender(employeeRow.genre),
        identifiant: cleanText(employeeRow.identifiant),
        mdp: cleanText(employeeRow.mdp),
        heure_travail_semaine: parseAmount(employeeRow.heure_travail_semaine),
        poste: cleanText(employeeRow.poste),
      }
    })
  },
}
