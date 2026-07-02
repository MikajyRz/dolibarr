import { parseCsvFile } from './importCsvReader'
import { cleanText, normalizeGender, parseAmount } from './importUtils'

export const ImportEmployeesCsvService = {
  read: async (file) => {
    const rows = await parseCsvFile(file)

    return rows.map((row, index) => {
      return {
        line: index + 2,
        ref_employe: cleanText(row.ref_employe),
        nom: cleanText(row.nom),
        genre: normalizeGender(row.genre),
        identifiant: cleanText(row.identifiant),
        mdp: cleanText(row.mdp),
        heure_travail_semaine: parseAmount(row.heure_travail_semaine),
        poste: cleanText(row.poste),
      }
    })
  },
}