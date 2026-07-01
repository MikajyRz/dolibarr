import { parseCsvFile } from './importCsvReader'
import {
  cleanText,
  parseAmount,
  parseCsvDateToIso,
  parsePayments,
  sumPayments,
} from './importUtils'

export const ImportSalariesCsvService = {
  read: async (file) => {
    const rows = await parseCsvFile(file)

    return rows.map((row, index) => {
      const payments = parsePayments(row.paiement)
      const amount = parseAmount(row.montant)
      const totalPaid = sumPayments(payments)

      return {
        line: index + 2,
        ref_salaire: cleanText(row.ref_salaire),
        ref_employe: cleanText(row.ref_employe),
        date_debut: parseCsvDateToIso(row.date_debut),
        date_fin: parseCsvDateToIso(row.date_fin),
        montant: amount,
        payments,
        total_paye: totalPaid,
        reste_a_payer: amount - totalPaid,
      }
    })
  },
}
