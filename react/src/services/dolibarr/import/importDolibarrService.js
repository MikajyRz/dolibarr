import { dolibarrClient } from '../dolibarrClient'
import { getDolibarrId, isoDateToTimestamp } from './importUtils'

const CASH_PAYMENT_TYPE_ID = Number(
  import.meta.env.VITE_DOLIBARR_CASH_PAYMENT_TYPE_ID || 4,
)
const CASH_ACCOUNT_ID = Number(
  import.meta.env.VITE_DOLIBARR_CASH_ACCOUNT_ID || 1,
)

function getUserRef(user) {
  return String(
    user?.ref_employee ||
      user?.ref_ext ||
      user?.array_options?.options_ref_employe ||
      user?.array_options?.ref_employe ||
      '',
  )
}

function getUserLogin(user) {
  return String(user?.login || '')
}

function getSalaryRef(salary) {
  return String(salary?.ref || salary?.ref_ext || salary?.ref_salary || '')
}

function buildEmployeePayload(employee, withPassword = true) {
  const payload = {
    login: employee.identifiant,
    lastname: employee.nom,
    firstname: '',
    ref_employee: employee.ref_employe,
    ref_ext: employee.ref_employe,
    gender: employee.genre,
    job: employee.poste,
    weeklyhours: Number(employee.heure_travail_semaine || 0),
    employee: 1,
    admin: 0,
    statut: 1,
    status: 1,
  }

  if (withPassword) {
    payload.pass = employee.mdp
  }

  return payload
}

function buildSalaryPayload(salary, fkUser) {
  const dateStart = isoDateToTimestamp(salary.date_debut)
  const dateEnd = isoDateToTimestamp(salary.date_fin)
  const amount = Number(salary.montant || 0)

  return {
    ref: salary.ref_salaire,
    ref_salary: salary.ref_salaire,
    ref_ext: salary.ref_salaire,
    label: `Salaire ${salary.ref_salaire}`,
    fk_user: Number(fkUser),
    salary: amount,
    amount,
    datesp: dateStart,
    dateep: dateEnd,
    datep: dateEnd || dateStart,
    datev: dateEnd || dateStart,
    fk_typepayment: CASH_PAYMENT_TYPE_ID,
    fk_account: CASH_ACCOUNT_ID,
    num_payment: 'ESPECE',
    paye: 0,
  }
}

function buildPaymentPayload(payment, salaryId, salary, fkUser) {
  const paymentDate =
    isoDateToTimestamp(payment.date) ||
    isoDateToTimestamp(salary.date_fin) ||
    isoDateToTimestamp(salary.date_debut)

  return {
    chid: Number(salaryId),
    fk_salary: Number(salaryId),
    fk_user: Number(fkUser),
    paiementtype: CASH_PAYMENT_TYPE_ID,
    datepaye: paymentDate,
    accountid: CASH_ACCOUNT_ID,
    num_payment: 'ESPECE',
    amounts: {
      [salaryId]: Number(payment.amount),
    },
  }
}

async function getAllUsers() {
  const users = await dolibarrClient.get('/users', {
    limit: 10000,
    sortfield: 't.rowid',
    sortorder: 'ASC',
  })

  return Array.isArray(users) ? users : []
}

async function getAllSalaries() {
  const salaries = await dolibarrClient.get('/salaries', {
    limit: 10000,
    sortfield: 't.rowid',
    sortorder: 'ASC',
  })

  return Array.isArray(salaries) ? salaries : []
}

async function uploadEmployeeImage(image, userId) {
  for (const file of image.files) {
    await dolibarrClient.post('/documents/upload', {
      filename: file.filename,
      modulepart: 'user',
      subdir: `${userId}/${file.subdir}`,
      filecontent: file.base64,
      fileencoding: 'base64',
      overwriteifexists: 1,
      createdirifnotexists: 1,
    })
  }

  await dolibarrClient.put(`/users/${userId}`, {
    photo: 'photo.jpg',
  })
}

function findExistingUser(users, employee) {
  return users.find((user) => {
    return (
      getUserRef(user) === employee.ref_employe ||
      getUserLogin(user).toLowerCase() === employee.identifiant.toLowerCase()
    )
  })
}

async function createOrUpdateEmployee(employee, existingUsers) {
  const existingUser = findExistingUser(existingUsers, employee)

  if (existingUser) {
    const userId = getDolibarrId(existingUser)

    await dolibarrClient.put(`/users/${userId}`, buildEmployeePayload(employee, false))

    return {
      status: 'updated',
      ref_employe: employee.ref_employe,
      dolibarrId: userId,
      message: `Employé ${employee.ref_employe} mis à jour.`,
    }
  }

  const created = await dolibarrClient.post('/users', buildEmployeePayload(employee))
  const createdId = getDolibarrId(created)

  return {
    status: 'created',
    ref_employe: employee.ref_employe,
    dolibarrId: createdId,
    message: `Employé ${employee.ref_employe} créé.`,
  }
}

function buildEmployeeMap(users) {
  const employeeMap = new Map()

  users.forEach((user) => {
    const ref = getUserRef(user)
    const id = getDolibarrId(user)

    if (ref && id) {
      employeeMap.set(ref, id)
    }
  })

  return employeeMap
}

function addImportedEmployeesToMap(employeeMap, importedEmployees) {
  importedEmployees.forEach((employee) => {
    if (employee.ref_employe && employee.dolibarrId) {
      employeeMap.set(employee.ref_employe, employee.dolibarrId)
    }
  })
}

function findExistingSalary(salaries, salary) {
  return salaries.find((item) => {
    return getSalaryRef(item) === salary.ref_salaire
  })
}

async function paySalary(salaryId, salary, fkUser) {
  let paymentsCreated = 0

  for (const payment of salary.payments) {
    if (Number(payment.amount) > 0) {
      await dolibarrClient.post(
        `/salaries/${salaryId}/payments`,
        buildPaymentPayload(payment, salaryId, salary, fkUser),
      )

      paymentsCreated += 1
    }
  }

  return paymentsCreated
}

async function updateSalaryPaidStatus(salaryId, salary) {
  const amount = Number(salary.montant || 0)
  const totalPaid = Number(salary.total_paye || 0)

  await dolibarrClient.put(`/salaries/${salaryId}`, {
    paye: amount > 0 && totalPaid >= amount ? 1 : 0,
  })
}

async function createSalaryIfNotExists(salary, employeeMap, existingSalaries) {
  const existingSalary = findExistingSalary(existingSalaries, salary)

  if (existingSalary) {
    return {
      status: 'skipped',
      ref_salaire: salary.ref_salaire,
      dolibarrId: getDolibarrId(existingSalary),
      message: `Salaire ${salary.ref_salaire} existe déjà, ignoré.`,
      paymentsCreated: 0,
    }
  }

  const employeeId = employeeMap.get(salary.ref_employe)

  if (!employeeId) {
    throw new Error(`Impossible de trouver l'employé ${salary.ref_employe} dans Dolibarr.`)
  }

  const created = await dolibarrClient.post('/salaries', buildSalaryPayload(salary, employeeId))
  const salaryId = getDolibarrId(created)
  const paymentsCreated = await paySalary(salaryId, salary, employeeId)

  await updateSalaryPaidStatus(salaryId, salary)

  return {
    status: 'created',
    ref_salaire: salary.ref_salaire,
    dolibarrId: salaryId,
    message: `Salaire ${salary.ref_salaire} créé.`,
    paymentsCreated,
  }
}

export const ImportDolibarrService = {
  importAll: async ({ employees, salaries, images = [], onProgress }) => {
    const result = {
      employees: [],
      images: [],
      salaries: [],
      errors: [],
    }

    const existingUsers = await getAllUsers()

    for (let index = 0; index < employees.length; index += 1) {
      const employee = employees[index]

      try {
        onProgress?.(`Import employé ${index + 1}/${employees.length} : ${employee.ref_employe}`)
        result.employees.push(await createOrUpdateEmployee(employee, existingUsers))
      } catch (error) {
        result.errors.push(`Employé ${employee.ref_employe} : ${error.message}`)
      }
    }

    const refreshedUsers = await getAllUsers()
    const employeeMap = buildEmployeeMap(refreshedUsers)

    addImportedEmployeesToMap(employeeMap, result.employees)

    for (let index = 0; index < images.length; index += 1) {
      const image = images[index]

      try {
        onProgress?.(`Upload image ${index + 1}/${images.length} : ${image.filename}`)
        const employeeId = employeeMap.get(image.ref_employe)

        if (!employeeId) {
          throw new Error(`Impossible de trouver l'employé ${image.ref_employe}.`)
        }

        await uploadEmployeeImage(image, employeeId)

        result.images.push({
          status: 'uploaded',
          ref_employe: image.ref_employe,
          filename: image.filename,
          message: `Photo employé ${image.ref_employe} uploadée.`,
        })
      } catch (error) {
        result.errors.push(`Image ${image.filename} : ${error.message}`)
      }
    }

    const existingSalaries = await getAllSalaries()

    for (let index = 0; index < salaries.length; index += 1) {
      const salary = salaries[index]

      try {
        onProgress?.(`Import salaire ${index + 1}/${salaries.length} : ${salary.ref_salaire}`)
        result.salaries.push(
          await createSalaryIfNotExists(salary, employeeMap, existingSalaries),
        )
      } catch (error) {
        result.errors.push(`Salaire ${salary.ref_salaire} : ${error.message}`)
      }
    }

    onProgress?.('Import terminé.')

    return result
  },
}
