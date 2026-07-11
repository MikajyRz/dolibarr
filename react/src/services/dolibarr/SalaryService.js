import { dolibarrClient } from './dolibarrClient'
import { EmployeeService } from './EmployeeService'

const CASH_PAYMENT_TYPE_ID = Number(import.meta.env.VITE_DOLIBARR_CASH_PAYMENT_TYPE_ID || import.meta.env.VITE_DOLIBARR_PAYMENT_TYPE_ID || 4)

const CASH_ACCOUNT_ID = Number(import.meta.env.VITE_DOLIBARR_CASH_ACCOUNT_ID || import.meta.env.VITE_DOLIBARR_BANK_ACCOUNT_ID || 1)

const toNumber = (value, fallback = 0) => Number(value || fallback)
const toText = (value, fallback = '') => String(value || fallback)

const validateEmployees = (employees) => {
  if (!employees.length) {
    throw new Error('Aucun employÃ© ne correspond au filtre.')
  }
}

const validateMonthYear = (month, year) => {
  const monthNumber = toNumber(month)
  const yearNumber = toNumber(year)

  if (!monthNumber || monthNumber < 1 || monthNumber > 12) {
    throw new Error('Veuillez choisir un mois valide.')
  }

  if (!yearNumber || yearNumber < 2000) {
    throw new Error('Veuillez saisir une annÃ©e valide.')
  }
}

const validatePositiveNumber = (value, message) => {
  const valueNumber = toNumber(value)

  if (!valueNumber || valueNumber <= 0) {
    throw new Error(message)
  }
}

const validateNotNegativeNumber = (value, message) => {
  if (toNumber(value) < 0) {
    throw new Error(message)
  }
}

const toTimestamp = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  return Math.floor(new Date(dateValue).getTime() / 1000)
}

const getObjectId = (item) => toNumber(item?.id || item?.rowid || item?.fk_user)

const getDate = (dateValue) => {
  if (!dateValue || dateValue === '0') {
    return null
  }

  if (typeof dateValue === 'number' || /^\d+$/.test(toText(dateValue))) {
    return new Date(toNumber(dateValue) * 1000)
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

  return `${year}-${toText(month).padStart(2, '0')}`
}

const getDateFromSalaryLabel = (salary, index) => {
  const text = toText(salary?.label || salary?.ref || salary?.ref_salary)

  const dates = text.match(/\d{4}-\d{2}-\d{2}/g)

  if (!dates || !dates[index]) {
    return null
  }

  return dates[index]
}


const isInvalidPaymentEndpointError = (error) => {
  return toText(error?.message)
    .toLowerCase()
    .includes('invalid value specified for `id`')
}

const isUnavailableEndpointError = (error) => {
  const message = toText(error?.message).toLowerCase()

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

  const padDatePart = (value) => {
    return toText(value).padStart(2, '0')
  }

const buildDateValue = (year, month, day) => {
  return `${year}-${padDatePart(month)}-${padDatePart(day)}`
}

const toDateValue = (dateValue) => {
  const date = getDate(dateValue)

  if (!date || Number.isNaN(date.getTime())) {
    return ''
  }

  return buildDateValue(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const addDaysToDateValue = (dateValue, days) => {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + days)

  return buildDateValue(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

const isDateInInterval = (dateValue, startDate, endDate) => {
  return dateValue >= startDate && dateValue <= endDate
}

//6 recoit date et retourne jour 0=dim, 6=
const getDayOfWeek = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`)
  return date.getDay()
}

const isSaturdayDate = (dateValue) => {
  return getDayOfWeek(dateValue) === 6
}

const isSundayDate = (dateValue) => {
  return getDayOfWeek(dateValue) === 0
}

//7
const getDatesInInterval = (startDate, endDate) => {
  const dates = []
  let currentDate = startDate

  while (currentDate <= endDate) {
    dates.push(currentDate)
    currentDate = addDaysToDateValue(currentDate, 1)
  }

  return dates
}

// const countDaysInInterval = (startDate, endDate) => {
//   let count = 0
//   let currentDate = startDate

//   while (currentDate <= endDate) {
//     count += 1
//     currentDate = addDaysToDateValue(currentDate, 1)
//   }

//   return count
// }

const getMonthStartDate = (month, year) => {
  return buildDateValue(year, month, 1)
}

const getMonthEndDate = (month, year) => {
  const lastDay = new Date(toNumber(year), toNumber(month), 0).getDate()

  return buildDateValue(year, month, lastDay)
}

const getMonthDays = (month, year) => {
  const lastDay = new Date(toNumber(year), toNumber(month), 0).getDate()
  const days = []

  for (let day = 1; day <= lastDay; day += 1) {
    days.push(buildDateValue(year, month, day))
  }

  return days
}

const getDateOverlap = (startDateValue, endDateValue, limitStartDate, limitEndDate) => {
  const startDate = toDateValue(startDateValue)
  const endDate = toDateValue(endDateValue)

  if (!startDate || !endDate) {
    return null
  }

  if (startDate > limitEndDate || endDate < limitStartDate) {
    return null
  }

  return {
    startDate: startDate < limitStartDate ? limitStartDate : startDate,
    endDate: endDate > limitEndDate ? limitEndDate : endDate,
  }
}

// Transformer en intervalles continus
const groupDatesIntoIntervals = (dates) => {
  if (!dates.length) {
    return []
  }

  const intervals = []
  let startDate = dates[0]
  let endDate = dates[0]

  for (let index = 1; index < dates.length; index += 1) {
    const currentDate = dates[index]
    const nextExpectedDate = addDaysToDateValue(endDate, 1)

    if (currentDate === nextExpectedDate) {
      endDate = currentDate
    } else {
      intervals.push({ startDate, endDate })
      startDate = currentDate
      endDate = currentDate
    }
  }

  intervals.push({ startDate, endDate })

  return intervals
}

//1
const calculateMonthlySalaryAmount = ({ dates, dailySalary, holidayDates, holidayPercent, includeSaturday, includeSunday, weekendPercent }) => {
  let amount = 0
  let holidayCount = 0
  let saturdayCount = 0
  let sundayCount = 0
  let weekendCount = 0
  let holidayWeekendCount = 0

  dates.forEach((dateValue) => {
    // const isAbsentDay = absenceDates.has(dateValue)

    // if (isAbsentDay) {
        // absenceCount += 1
        // return
    // }
  
    const isHolidayDay = holidayDates.has(dateValue)
    const isSaturdayDay = includeSaturday && isSaturdayDate(dateValue)
    const isSundayDay = includeSunday && isSundayDate(dateValue)
    const isWeekendDay = isSaturdayDay || isSundayDay

    let percent = 0

    if (isHolidayDay) {
      percent = holidayPercent
      holidayCount += 1
    }

    if (isSaturdayDay) {
      percent = Math.max(percent, weekendPercent)
      saturdayCount += 1
      weekendCount += 1
    }

    if (isSundayDay) {
      percent = Math.max(percent, weekendPercent)
      sundayCount += 1
      weekendCount += 1
    }

    if (isHolidayDay && isWeekendDay) {
      holidayWeekendCount += 1
    }

    amount += dailySalary + (dailySalary * percent) / 100
  })

  return {
    amount: Math.round(amount),
    holidayCount,
    saturdayCount,
    sundayCount,
    weekendCount,
    holidayWeekendCount,
  }
}
// Prepare info du mois
const getMonthlySalaryContext = ({ month, year, dailySalary, holidayPercent, holidays, weekendPercent, includeSaturday, includeSunday }) => {
  const monthNumber = toNumber(month)
  const yearNumber = toNumber(year)
  const monthStartDate = getMonthStartDate(monthNumber, yearNumber)
  const monthEndDate = getMonthEndDate(monthNumber, yearNumber)
  const monthHolidays = holidays.filter((holiday) => holiday.date >= monthStartDate && holiday.date <= monthEndDate)

  return {
    monthStartDate,
    monthEndDate,
    monthDays: getMonthDays(monthNumber, yearNumber),
    dailySalary: toNumber(dailySalary),
    holidayPercent: toNumber(holidayPercent),
    weekendPercent: toNumber(weekendPercent),
    includeSaturday: Boolean(includeSaturday),
    includeSunday: Boolean(includeSunday),
    holidayDates: new Set(monthHolidays.map((holiday) => holiday.date)),
  }
}
// cherche periode existant
const getEmployeeSalaryIntervals = ({ salaries, employeeId, monthStartDate, monthEndDate }) => {
  return salaries
    .filter((salary) => SalaryService.getSalaryUserId(salary) === employeeId)
    .map((salary) => getDateOverlap(SalaryService.getSalaryStartDate(salary), SalaryService.getSalaryEndDate(salary), monthStartDate, monthEndDate))
    .filter(Boolean)
}

// Garde jours qui ne sont pas dans les periodes existantes(trouve les jours qui manque)
const getIntervalsToGenerate = ({ monthDays, existingIntervals }) => {
  const daysToGenerate = monthDays.filter((day) => {
    return !existingIntervals.some((interval) => isDateInInterval(day, interval.startDate, interval.endDate))
  })

  return groupDatesIntoIntervals(daysToGenerate)
}

const createMonthlySalaryForInterval = async ({ employeeId, employeeName, interval, context }) => {
  const intervalDates = getDatesInInterval(interval.startDate, interval.endDate)
  const salaryCalculation = calculateMonthlySalaryAmount({ dates: intervalDates, dailySalary: context.dailySalary, holidayDates: context.holidayDates, holidayPercent: context.holidayPercent, includeSaturday: context.includeSaturday, includeSunday: context.includeSunday, weekendPercent: context.weekendPercent })
  const salaryId = await SalaryService.createSalary({ fk_user: employeeId, label: `Salaire ${employeeName} - ${interval.startDate} au ${interval.endDate}`, amount: salaryCalculation.amount, datesp: interval.startDate, dateep: interval.endDate })

  return {
    employeeId,
    employeeName,
    salaryId,
    startDate: interval.startDate,
    endDate: interval.endDate,
    daysCount: intervalDates.length,
    ...salaryCalculation,
    message: `${employeeName} : salaire généré du ${interval.startDate} au ${interval.endDate} (${salaryCalculation.amount.toLocaleString()} Ar).`,
  }
}

const buildEmployeeById = (employees) => {
  const employeeById = new Map()

  employees.forEach((employee) => {
    const employeeId = EmployeeService.getEmployeeId(employee)

    if (employeeId) {
      employeeById.set(employeeId, employee)
    }
  })

  return employeeById
}

const addPaidAmount = (paidBySalaryId, salaryId, paid) => {
  if (salaryId && paid > 0) {
    paidBySalaryId.set(salaryId, (paidBySalaryId.get(salaryId) || 0) + paid)
  }
}

const buildPaidBySalaryId = (payments) => {
  const paidBySalaryId = new Map()

  payments.forEach((payment) => {
    if (payment?.amounts && typeof payment.amounts === 'object' && !Array.isArray(payment.amounts)) {
      Object.entries(payment.amounts).forEach(([salaryId, amount]) => addPaidAmount(paidBySalaryId, toNumber(salaryId), toNumber(amount)))
      return
    }

    addPaidAmount(paidBySalaryId, SalaryService.getPaymentSalaryId(payment), SalaryService.getPaymentAmount(payment))
  })

  return paidBySalaryId
}

const buildSalaryToPayItem = ({ salary, employeeById, paidBySalaryId, priority }) => {
  const salaryId = SalaryService.getSalaryId(salary)
  const employeeId = SalaryService.getSalaryUserId(salary)
  const employee = employeeById.get(employeeId)
  const amount = SalaryService.getSalaryAmount(salary)
  const totalPaid = paidBySalaryId.get(salaryId) || 0
  const poste = EmployeeService.getEmployeePoste(employee || {})

  return {
    salary,
    salaryId,
    employeeId,
    employee,
    employeeName: EmployeeService.getEmployeeName(employee || {}) || `Employé ${employeeId}`,
    poste,
    startDate: toDateValue(SalaryService.getSalaryStartDate(salary)),
    endDate: toDateValue(SalaryService.getSalaryEndDate(salary)),
    amount,
    totalPaid,
    remaining: amount - totalPaid,
    isPriority: toText(poste).toLowerCase() === priority,
  }
}

const isPayableSalaryInMonth = ({ item, monthStartDate, monthEndDate }) => {
  return item.salaryId && item.employee && item.startDate && item.startDate >= monthStartDate && item.startDate <= monthEndDate && item.remaining > 0
}

const sortSalaryToPayItems = (a, b) => {
  if (a.isPriority !== b.isPriority) {
    return a.isPriority ? -1 : 1
  }

  if (a.startDate !== b.startDate) {
    return a.startDate.localeCompare(b.startDate)
  }

  return a.employeeName.localeCompare(b.employeeName)
}

const createPaymentResult = (amount) => ({ budget: toNumber(amount), totalPaid: 0, remainingBudget: toNumber(amount), paid: [], skipped: [], errors: [] })

const getTodayDateValue = () => {
  const today = new Date()
  return buildDateValue(today.getFullYear(), today.getMonth() + 1, today.getDate())
}

const paySalaryItem = async ({ item, amountToPay, paymentDate }) => {
  await SalaryService.paySalary(item.salaryId, { amount: amountToPay, datepaye: paymentDate, num_payment: 'ESPECE' })

  return {
    salaryId: item.salaryId,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    poste: item.poste,
    startDate: item.startDate,
    endDate: item.endDate,
    amountPaid: amountToPay,
    remainingBeforePayment: item.remaining,
    isPartial: amountToPay < item.remaining,
  }
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
    return toNumber(salary?.amount || salary?.salary || salary?.total)
  },

  getSalaryUserId: (salary) => {
    return toNumber(salary?.fk_user || salary?.user_id || salary?.entity)
  },

  getSalaryId: (salary) => {
    return toNumber(salary?.id || salary?.rowid || salary?.chid)
  },

  getSalaryRef: (salary) => {
    return toText(salary?.ref || salary?.ref_salary || salary?.ref_ext || salary?.label || salary?.id, '-')
  },

getSalaryStartDate: (salary) => {
  return (
    salary?.datesp ||
    salary?.date_start ||
    salary?.date_debut ||
    salary?.period_start ||
    salary?.periode_debut ||
    getDateFromSalaryLabel(salary, 0) ||
    null
  )
},

getSalaryEndDate: (salary) => {
  return (
    salary?.dateep ||
    salary?.date_end ||
    salary?.date_fin ||
    salary?.period_end ||
    salary?.periode_fin ||
    getDateFromSalaryLabel(salary, 1) ||
    null
  )
},

  getPaymentSalaryId: (payment) => {
    if (
      payment?.amounts &&
      typeof payment.amounts === 'object' &&
      !Array.isArray(payment.amounts)
    ) {
      const salaryIds = Object.keys(payment.amounts)

      if (salaryIds.length === 1) {
        return toNumber(salaryIds[0])
      }
    }

    return toNumber(payment?.fk_salary || payment?.salary_id || payment?.fk_salarydet || payment?.salaryid || payment?.chid || payment?.fk_salary_payment || payment?.fk_salary_paiement || payment?.fk_object || payment?.id_salary)
  },

  formatDate: (dateValue) => {
    const date = getDate(dateValue)

    if (!date || Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString('fr-FR')
  },

formatSalaryPeriod: (startDate, endDate) => {
  const start = SalaryService.formatDate(startDate)
  const end = SalaryService.formatDate(endDate)

  if (start === '-' && end === '-') {
    return '-'
  }

  if (start !== '-' && end === '-') {
    return start
  }

  if (start === '-' && end !== '-') {
    return end
  }

  if (start === end) {
    return start
  }

  return `${start} au ${end}`
},

  getEmployeeSalariesWithPayments: async (employeeId) => {
    const [salaries, payments] = await Promise.all([SalaryService.getSalaries(), SalaryService.getSalaryPayments()])

    const employeeSalaries = salaries.filter((salary) => {
      return SalaryService.getSalaryUserId(salary) === toNumber(employeeId)
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
    return toNumber(payment?.amount || payment?.total || payment?.payment_amount)
  },

  getPaymentAmountForSalary: (payment, salaryId) => {
    if (
      payment?.amounts &&
      typeof payment.amounts === 'object' &&
      !Array.isArray(payment.amounts)
    ) {
      const amount = toNumber(payment.amounts[salaryId] || payment.amounts[toText(salaryId)])

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

  getMonthKeyFromDate: (dateValue) => {
    return getMonthKey(dateValue)
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
      return total + toNumber(payment.amount)
    }, 0)
  },

  getValidPayments: (payments) => {
    return payments.filter((payment) => {
      return toNumber(payment.amount) > 0
    })
  },

  validateSalaryPayment: (salary, payments) => {
    const validPayments = SalaryService.getValidPayments(payments)
    const totalPaid = SalaryService.getTotalPaid(validPayments)
    const salaryAmount = toNumber(salary.amount)

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
    const remainingAmount = toNumber(salaryHistory?.remaining)

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

    if (!amount || toNumber(amount) <= 0) {
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
      fk_user: toNumber(salary.fk_user),
      label: salary.label,
      amount: toNumber(salary.amount),
      datesp: toTimestamp(salary.datesp),
      dateep: toTimestamp(salary.dateep),
    }

    const data = await dolibarrClient.post('/salaries', payload)

    return SalaryService.getCreatedSalaryId(data)
  },

  paySalary: async (salaryId, payment) => {
    const payload = {
      chid: toNumber(salaryId),
      fk_salary: toNumber(salaryId),
      datepaye: toTimestamp(payment.datepaye),
      paiementtype: CASH_PAYMENT_TYPE_ID,
      fk_typepayment: CASH_PAYMENT_TYPE_ID,
      type_payment: CASH_PAYMENT_TYPE_ID,
      paymenttype: CASH_PAYMENT_TYPE_ID,
      accountid: CASH_ACCOUNT_ID,
      fk_account: CASH_ACCOUNT_ID,
      num_payment: payment.num_payment || 'ESPECE',
      amounts: {
        [salaryId]: toNumber(payment.amount),
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
    SalaryService.validateSalaryGeneration({ employees, datesp, dateep, amount })

    const result = {
      created: [],
      errors: [],
    }

    for (const employee of employees) {
      const employeeId = EmployeeService.getEmployeeId(employee)
      const employeeName = EmployeeService.getEmployeeName(employee) || `Employé ${employeeId}`

      try {
        const salaryId = await SalaryService.createSalary({ fk_user: employeeId, label: `Salaire ${employeeName}`, amount: toNumber(amount), datesp, dateep })

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

  validateMonthlySalaryGeneration: ({ employees, month, year, dailySalary, holidayPercent, includeSaturday, includeSunday, weekendPercent }) => {
    validateEmployees(employees)
    validateMonthYear(month, year)
    validatePositiveNumber(dailySalary, 'Veuillez saisir un salaire par jour valide.')
    validateNotNegativeNumber(holidayPercent, 'Le pourcentage de majoration ne doit pas être négatif.')

    if (includeSaturday || includeSunday) {
      validateNotNegativeNumber(weekendPercent, 'Le pourcentage de majoration weekend ne doit pas être négatif.')
    }
  },

  generateMonthlySalariesForEmployees: async ({ employees, month, year, dailySalary, holidayPercent, holidays, weekendPercent, includeSaturday, includeSunday }) => {
    SalaryService.validateMonthlySalaryGeneration({ employees, month, year, dailySalary, holidayPercent, weekendPercent, includeSaturday, includeSunday })

    const context = getMonthlySalaryContext({ month, year, dailySalary, holidayPercent, holidays, weekendPercent, includeSaturday, includeSunday })
    const salaries = await SalaryService.getSalaries()

    const result = { created: [], skipped: [], errors: [] }

    for (const employee of employees) {
      const employeeId = EmployeeService.getEmployeeId(employee)
      const employeeName = EmployeeService.getEmployeeName(employee) || `Employé ${employeeId}`

      try {
        const existingIntervals = getEmployeeSalaryIntervals({ salaries, employeeId, monthStartDate: context.monthStartDate, monthEndDate: context.monthEndDate })
        const intervalsToGenerate = getIntervalsToGenerate({ monthDays: context.monthDays, existingIntervals })

        if (!intervalsToGenerate.length) {
          result.skipped.push(`${employeeName} : tout le mois a déjà un salaire.`)
          continue
        }

        for (const interval of intervalsToGenerate) {
          result.created.push(await createMonthlySalaryForInterval({ employeeId, employeeName, interval, context }))
        }
      } catch (error) {
        result.errors.push(`${employeeName} : ${error.message}`)
      }
    }

    return result
  },

  validateSalaryPaymentGeneration: ({ employees, month, year, amount, priorityPoste }) => {
    validateEmployees(employees)
    validateMonthYear(month, year)

    if (!priorityPoste) {
      throw new Error('Veuillez choisir le poste prioritaire.')
    }

    validatePositiveNumber(amount, 'Veuillez saisir un montant de paiement valide.')
  },

  getSalariesToPayByOrder: async ({ employees, month, year, priorityPoste }) => {
    const monthNumber = toNumber(month)
    const yearNumber = toNumber(year)
    const priority = toText(priorityPoste).toLowerCase()
    const monthStartDate = getMonthStartDate(monthNumber, yearNumber)
    const monthEndDate = getMonthEndDate(monthNumber, yearNumber)

    const employeeById = buildEmployeeById(employees)
    const [salaries, payments] = await Promise.all([SalaryService.getSalaries(), SalaryService.getSalaryPayments()])
    const paidBySalaryId = buildPaidBySalaryId(payments)

    const salariesToPay = salaries
      .map((salary) => buildSalaryToPayItem({ salary, employeeById, paidBySalaryId, priority }))
      .filter((item) => isPayableSalaryInMonth({ item, monthStartDate, monthEndDate }))

    return salariesToPay.sort(sortSalaryToPayItems)
  },

  generatePaymentsByOrder: async ({ employees, month, year, priorityPoste, amount }) => {
    SalaryService.validateSalaryPaymentGeneration({ employees, month, year, amount, priorityPoste })

    const salariesToPay = await SalaryService.getSalariesToPayByOrder({ employees, month, year, priorityPoste })

    if (!salariesToPay.length) {
      throw new Error('Aucun salaire avec reste à payer pour ce mois et ces filtres.')
    }

    let remainingBudget = toNumber(amount)
    const result = createPaymentResult(amount)
    const paymentDate = getTodayDateValue()

    for (const item of salariesToPay) {
      if (remainingBudget <= 0) {
        result.skipped.push(`${item.employeeName} : budget terminé, salaire non payé.`)
        continue
      }

      const amountToPay = Math.min(item.remaining, remainingBudget)

      try {
        const paidItem = await paySalaryItem({ item, amountToPay, paymentDate })

        remainingBudget -= amountToPay
        result.totalPaid += amountToPay
        result.paid.push(paidItem)
      } catch (error) {
        result.errors.push(`${item.employeeName} : ${error.message}`)
      }
    }

    result.remainingBudget = remainingBudget

    return result
  }
}
