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
  return String(error?.message || '')
    .toLowerCase()
    .includes('invalid value specified for `id`')
}

const isUnavailableEndpointError = (error) => {
  const message = String(error?.message || '').toLowerCase()

  return (
    isInvalidPaymentEndpointError(error) ||
    message.includes('bad request') ||
    message.includes('not found') ||
    message.includes('unknown api') ||
    message.includes('400') ||
    message.includes('404')
  )
}

const normalizeList = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (Array.isArray(data?.data)) {
    return data.data
  }

  if (Array.isArray(data?.records)) {
    return data.records
  }

  if (Array.isArray(data?.rows)) {
    return data.rows
  }

  return []
}

export const SalaryService = {
  getSalaries: async () => {
    const data = await dolibarrClient.get('/salaries', {
      limit: 10000,
      sortfield: 't.datep',
      sortorder: 'DESC',
    })

    return normalizeList(data)
  },

  getSalaryPayments: async () => {
    const params = {
      limit: 10000,
      sortfield: 't.datep',
      sortorder: 'DESC',
    }

    try {
      const data = await dolibarrClient.get('/salaries/payments', params)

      return normalizeList(data)
    } catch (error) {
      if (!isUnavailableEndpointError(error)) {
        throw error
      }
    }

    try {
      const data = await dolibarrClient.get('/salaries/getAllPayments', params)

      return normalizeList(data)
    } catch (error) {
      if (!isUnavailableEndpointError(error)) {
        throw error
      }

      return []
    }
  },

  getSalaryAmount: (salary) => {
    return Number(salary?.amount || salary?.salary || salary?.total || 0)
  },

  getSalaryUserId: (salary) => {
    return Number(salary?.fk_user || salary?.user_id || salary?.entity || 0)
  },

  getSalaryId: (salary) => {
    return Number(salary?.id || salary?.rowid || salary?.chid || 0)
  },

  getSalaryRef: (salary) => {
    return String(
      salary?.ref ||
        salary?.ref_salary ||
        salary?.ref_ext ||
        salary?.label ||
        salary?.id ||
        '-',
    )
  },

  getSalaryStartDate: (salary) => {
    return salary?.datesp || salary?.date_start || salary?.date_debut || salary?.datep || null
  },

  getSalaryEndDate: (salary) => {
    return salary?.dateep || salary?.date_end || salary?.date_fin || salary?.datev || null
  },

  getPaymentSalaryId: (payment) => {
    if (
      payment?.amounts &&
      typeof payment.amounts === 'object' &&
      !Array.isArray(payment.amounts)
    ) {
      const salaryIds = Object.keys(payment.amounts)

      if (salaryIds.length === 1) {
        return Number(salaryIds[0])
      }
    }

    return Number(
      payment?.fk_salary ||
        payment?.salary_id ||
        payment?.fk_salarydet ||
        payment?.salaryid ||
        payment?.chid ||
        payment?.fk_salary_payment ||
        payment?.fk_salary_paiement ||
        payment?.fk_object ||
        payment?.id_salary ||
        0,
    )
  },

  formatDate: (dateValue) => {
    const date = getDate(dateValue)

    if (!date || Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('fr-FR')
  },

  getEmployeeSalariesWithPayments: async (employeeId) => {
    const [salaries, payments] = await Promise.all([
      SalaryService.getSalaries(),
      SalaryService.getSalaryPayments(),
    ])

    const employeeSalaries = salaries.filter((salary) => {
      return SalaryService.getSalaryUserId(salary) === Number(employeeId)
    })

    return employeeSalaries.map((salary) => {
      const salaryId = SalaryService.getSalaryId(salary)

      const salaryPayments = payments.filter((payment) => {
        return SalaryService.getPaymentSalaryId(payment) === salaryId
      })

      const totalPaid = salaryPayments.reduce((total, payment) => {
        return total + SalaryService.getPaymentAmountForSalary(payment, salaryId)
      }, 0)

      const amount = SalaryService.getSalaryAmount(salary)

      return {
        salary,
        payments: salaryPayments,
        salaryId,
        ref: SalaryService.getSalaryRef(salary),
        startDate: SalaryService.getSalaryStartDate(salary),
        endDate: SalaryService.getSalaryEndDate(salary),
        amount,
        totalPaid,
        remaining: amount - totalPaid,
      }
    })
  },
  

  getPaymentAmount: (payment) => {
    return Number(payment?.amount || payment?.total || payment?.payment_amount || 0)
  },

  getPaymentAmountForSalary: (payment, salaryId) => {
    if (
      payment?.amounts &&
      typeof payment.amounts === 'object' &&
      !Array.isArray(payment.amounts)
    ) {
      const amount = Number(payment.amounts[salaryId] || payment.amounts[String(salaryId)] || 0)

      if (amount > 0) {
        return amount
      }
    }

    return SalaryService.getPaymentAmount(payment)
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
    return getMonthKey(SalaryService.getSalaryStartDate(salary))
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

  validateExistingSalaryPayment: (salaryHistory, payments) => {
    const validPayments = SalaryService.getValidPayments(payments)
    const totalPaid = SalaryService.getTotalPaid(validPayments)
    const remainingAmount = Number(salaryHistory?.remaining || 0)

    if (!salaryHistory?.salaryId) {
      throw new Error('Veuillez choisir un salaire existant.')
    }

    if (remainingAmount <= 0) {
      throw new Error('Ce salaire est déjà totalement payé.')
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

    if (totalPaid > remainingAmount) {
      throw new Error('Le montant payé ne doit pas dépasser le reste à payer.')
    }
  },

  validateSalaryGeneration: ({ employees, datesp, dateep, amount }) => {
    if (!employees.length) {
      throw new Error('Aucun employé ne correspond au filtre.')
    }

    if (!datesp) {
      throw new Error('Veuillez saisir la date de début.')
    }

    if (!dateep) {
      throw new Error('Veuillez saisir la date de fin.')
    }

    if (new Date(datesp) > new Date(dateep)) {
      throw new Error('La date de début ne doit pas dépasser la date de fin.')
    }

    if (!amount || Number(amount) <= 0) {
      throw new Error('Veuillez saisir un montant valide.')
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
      fk_salary: Number(salaryId),
      datepaye: toTimestamp(payment.datepaye),
      paiementtype: CASH_PAYMENT_TYPE_ID,
      fk_typepayment: CASH_PAYMENT_TYPE_ID,
      type_payment: CASH_PAYMENT_TYPE_ID,
      paymenttype: CASH_PAYMENT_TYPE_ID,
      accountid: CASH_ACCOUNT_ID,
      fk_account: CASH_ACCOUNT_ID,
      num_payment: payment.num_payment || 'ESPECE',
      amounts: {
        [salaryId]: Number(payment.amount),
      },
    }

    try {
      return await dolibarrClient.post(`/salaries/${salaryId}/payments`, payload)
    } catch (error) {
      if (!isUnavailableEndpointError(error)) {
        throw error
      }

      return dolibarrClient.post(`/salaries/addPayment/${salaryId}`, payload)
    }
  },

  payExistingSalary: async (salaryHistory, payments) => {
    SalaryService.validateExistingSalaryPayment(salaryHistory, payments)

    const validPayments = SalaryService.getValidPayments(payments)

    for (const payment of validPayments) {
      await SalaryService.paySalary(salaryHistory.salaryId, payment)
    }

    return salaryHistory.salaryId
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

  generateSalariesForEmployees: async ({ employees, datesp, dateep, amount }) => {
    SalaryService.validateSalaryGeneration({
      employees,
      datesp,
      dateep,
      amount,
    })

    const result = {
      created: [],
      errors: [],
    }

    for (const employee of employees) {
      const employeeId = EmployeeService.getEmployeeId(employee)
      const employeeName = EmployeeService.getEmployeeName(employee) || `Employé ${employeeId}`

      try {
        const salaryId = await SalaryService.createSalary({
          fk_user: employeeId,
          label: `Salaire ${employeeName}`,
          amount: Number(amount),
          datesp,
          dateep,
        })

        result.created.push({
          employeeId,
          employeeName,
          salaryId,
          message: `Salaire généré pour ${employeeName}.`,
        })
      } catch (error) {
        result.errors.push(`${employeeName} : ${error.message}`)
      }
    }

    return result
  },
}
