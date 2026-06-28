import { dolibarrClient } from './dolibarrClient'

const toTimestamp = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  return Math.floor(new Date(dateValue).getTime() / 1000)
}

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

  // Calculer le total payé
  getTotalPaid: (payments) => {
    return payments.reduce((total, payment) => {
      return total + Number(payment.amount || 0)
    }, 0)
  },

  // Garder seulement les lignes de paiement valides
  getValidPayments: (payments) => {
    return payments.filter((payment) => {
      return Number(payment.amount || 0) > 0
    })
  },

  // Vérifier les données avant envoi vers Dolibarr
  validateSalaryPayment: (salary, payments) => {
    const validPayments = SalaryService.getValidPayments(payments)
    const totalPaid = SalaryService.getTotalPaid(validPayments)
    const salaryAmount = Number(salary.amount || 0)

    if (!salary.fk_user) {
      throw new Error('Veuillez choisir un salarié.')
    }

    if (!salaryAmount || salaryAmount <= 0) {
      throw new Error('Veuillez saisir un montant de salaire valide.')
    }

    if (!salary.datesp) {
      throw new Error('Veuillez saisir la date de début de période.')
    }

    if (!salary.dateep) {
      throw new Error('Veuillez saisir la date de fin de période.')
    }

    if (validPayments.length === 0) {
      throw new Error('Veuillez ajouter au moins un paiement.')
    }

    for (const payment of validPayments) {
      if (!payment.datepaye) {
        throw new Error('Chaque paiement doit avoir une date de règlement.')
      }

      if (!payment.paiementtype) {
        throw new Error('Chaque paiement doit avoir un mode de paiement.')
      }

      if (!payment.accountid) {
        throw new Error('Chaque paiement doit avoir un compte bancaire.')
      }
    }

    if (totalPaid > salaryAmount) {
      throw new Error('Le montant payé ne doit pas dépasser le salaire total.')
    }
  },

  // Récupérer l'id retourné par Dolibarr après création
  getCreatedSalaryId: (data) => {
    if (typeof data === 'number' || typeof data === 'string') {
      return data
    }

    return data?.id || data?.rowid
  },

  // Créer un salaire
  createSalary: async (salary) => {
    const payload = {
      fk_user: Number(salary.fk_user),
      label: salary.label,
      amount: Number(salary.amount),
      datesp: toTimestamp(salary.datesp),
      dateep: toTimestamp(salary.dateep),
    }

    const data = await dolibarrClient.post('/salaries', payload)

    return SalaryService.getCreatedSalaryId(data)
  },

  // Payer un salaire
  paySalary: async (salaryId, payment) => {
    const payload = {
      chid: Number(salaryId),
      datepaye: toTimestamp(payment.datepaye),
      paiementtype: Number(payment.paiementtype),
      accountid: Number(payment.accountid),
      num_payment: payment.num_payment || '',
      amounts: {
        [salaryId]: Number(payment.amount),
      },
    }

    const data = await dolibarrClient.post(`/salaries/${salaryId}/payments`, payload)

    return data
  },

  // Créer un salaire puis le payer en plusieurs fois
  createSalaryWithPayments: async (salary, payments) => {
    SalaryService.validateSalaryPayment(salary, payments)

    const salaryId = await SalaryService.createSalary(salary)
    const validPayments = SalaryService.getValidPayments(payments)

    for (const payment of validPayments) {
      await SalaryService.paySalary(salaryId, payment)
    }

    return salaryId
  },
}