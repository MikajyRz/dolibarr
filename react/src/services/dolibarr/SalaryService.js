import { dolibarrClient } from './dolibarrClient'

export const SalaryService = {
  // Récupérer les règlements de salaire
  getSalaries: async () => {
    const data = await dolibarrClient.get('/salaries', {
      limit: 100,
      sortfield: 't.datep',
      sortorder: 'DESC',
    })

    return data
  },

  // Récupérer le montant d'un règlement salaire
  getSalaryAmount: (salary) => {
    return Number(salary.amount || salary.salary || 0)
  },

  // Récupérer le mois à partir de la date de règlement
  getSalaryMonth: (salary) => {
    const dateValue =
        salary.datep ||
        salary.datev ||
        salary.datec ||
        salary.datesp ||
        salary.dateep

    if (!dateValue || dateValue === '0') {
        return 'Non renseigné'
    }

    const date =
        String(dateValue).length === 10 && !String(dateValue).includes('-')
        ? new Date(Number(dateValue) * 1000)
        : new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
        return 'Non renseigné'
    }

    const month = date.getMonth() + 1
    const year = date.getFullYear()

    return `${year}-${String(month).padStart(2, '0')}`
    },

  // Calculer le montant total des salaires par mois
  getSalaryAmountByMonth: (salaries) => {
    const result = {}

    salaries.forEach((salary) => {
      const month = SalaryService.getSalaryMonth(salary)
      const amount = SalaryService.getSalaryAmount(salary)

      if (!result[month]) {
        result[month] = 0
      }

      result[month] += amount
    })

    return result
  },
}