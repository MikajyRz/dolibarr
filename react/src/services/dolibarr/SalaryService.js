import { dolibarrClient } from './dolibarrClient'
import { EmployeeService } from './EmployeeService'

const CASH_PAYMENT_TYPE_ID = Number(
  import.meta.env.VITE_DOLIBARR_CASH_PAYMENT_TYPE_ID ||
    import.meta.env.VITE_DOLIBARR_PAYMENT_TYPE_ID ||
    4,
)
const CASH_ACCOUNT_ID = Number(
  import.meta.env.VITE_DOLIBARR_CASH_ACCOUNT_ID ||
    import.meta.env.VITE_DOLIBARR_BANK_ACCOUNT_ID ||
    1,
)

const toTimestamp = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  return Math.floor(new Date(dateValue).getTime() / 1000)
}

const getObjectId = (item) => {
  return Number(item?.id || item?.rowid || item?.fk_user || 0)
}

const getDate = (dateValue) => {
  if (!dateValue || dateValue === '0') {
    return null
  }

  if (typeof dateValue === 'number' || /^\d+$/.test(String(dateValue))) {
    return new Date(Number(dateValue) * 1000)
  }

  return new Date(dateValue)
}

const getMonthKey = (dateValue) => {
  const date = getDate(dateValue)

  if (!date || Number.isNaN(date.getTime())) {
    return 'Non renseigné'
  }

  const month = date.getMonth() + 1
  const year = date.getFullYear()

  return `${year}-${String(month).padStart(2, '0')}`
}

const isInvalidPaymentEndpointError = (error) => {
  return String(error?.message || '').toLowerCase().includes('invalid value specified for `id`')
}

export const SalaryService = {
  getSalaries: async () => {
    const data = await dolibarrClient.get('/salaries', {
      limit: 10000,
      sortfield: 't.datep',
      sortorder: 'DESC',
    })

    return Array.isArray(data) ? data : []
  },

  getSalaryPayments: async () => {
    try {
      const data = await dolibarrClient.get('/salaries/getAllPayments', {
        limit: 10000,
        sortfield: 't.datep',
        sortorder: 'DESC',
      })

      return Array.isArray(data) ? data : []
    } catch (error) {
      if (isInvalidPaymentEndpointError(error)) {
        return []
      }

      throw error
    }
  },

  getSalaryAmount: (salary) => {
    return Number(salary?.amount || salary?.salary || salary?.total || 0)
  },

  getSalaryUserId: (salary) => {
    return Number(salary?.fk_user || salary?.user_id || salary?.entity || 0)
  },

  getPaymentAmount: (payment) => {
    return Number(payment?.amount || payment?.total || payment?.payment_amount || 0)
  },

  getPaymentDate: (payment) => {
    return (
      payment?.datepaye ||
      payment?.datep ||
      payment?.date_payment ||
      payment?.datec ||
      payment?.date
    )
  },

  getSalaryMonth: (salary) => {
    return getMonthKey(
      salary?.datep ||
        salary?.datev ||
        salary?.datec ||
        salary?.datesp ||
        salary?.dateep,
    )
  },

  getPaymentMonth: (payment) => {
    return getMonthKey(SalaryService.getPaymentDate(payment))
  },

  getSalaryAmountByGender: (salaries, employees) => {
    const result = {
      homme: 0,
      femme: 0,
      autre: 0,
    }
    const employeeById = new Map()

    employees.forEach((employee) => {
      const employeeId = getObjectId(employee)

      if (employeeId) {
        employeeById.set(employeeId, employee)
      }
    })

    salaries.forEach((salary) => {
      const employee = employeeById.get(SalaryService.getSalaryUserId(salary))
      const gender = EmployeeService.getEmployeeGender(employee || {})

      result[gender] += SalaryService.getSalaryAmount(salary)
    })

    return result
  },

  getSalaryAmountByMonth: (salaries) => {
    const result = {}

    salaries.forEach((salary) => {
      const month = SalaryService.getSalaryMonth(salary)
      const amount = SalaryService.getSalaryAmount(salary)

      result[month] = (result[month] || 0) + amount
    })

    return result
  },

  getPaymentAmountByMonth: (payments) => {
    const result = {}

    payments.forEach((payment) => {
      const month = SalaryService.getPaymentMonth(payment)
      const amount = SalaryService.getPaymentAmount(payment)

      result[month] = (result[month] || 0) + amount
    })

    return result
  },

  getTotalPaid: (payments) => {
    return payments.reduce((total, payment) => {
      return total + Number(payment.amount || 0)
    }, 0)
  },

  getValidPayments: (payments) => {
    return payments.filter((payment) => {
      return Number(payment.amount || 0) > 0
    })
  },

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
    }

    if (!CASH_PAYMENT_TYPE_ID) {
      throw new Error("L'ID du mode de paiement espèces est manquant.")
    }

    if (!CASH_ACCOUNT_ID) {
      throw new Error("L'ID du compte caisse est manquant.")
    }

    if (totalPaid > salaryAmount) {
      throw new Error('Le montant payé ne doit pas dépasser le salaire total.')
    }
  },

  getCreatedSalaryId: (data) => {
    if (typeof data === 'number' || typeof data === 'string') {
      return data
    }

    return data?.id || data?.rowid
  },

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

  paySalary: async (salaryId, payment) => {
    const payload = {
      chid: Number(salaryId),
      datepaye: toTimestamp(payment.datepaye),
      paiementtype: CASH_PAYMENT_TYPE_ID,
      accountid: CASH_ACCOUNT_ID,
      num_payment: payment.num_payment || 'ESPECE',
      amounts: {
        [salaryId]: Number(payment.amount),
      },
    }

    return dolibarrClient.post(`/salaries/${salaryId}/payments`, payload)
  },

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
