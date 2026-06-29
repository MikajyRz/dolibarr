import { dolibarrClient } from './dolibarrClient'

function getId(item) {
  return Number(item?.id || item?.rowid || item?.pid || item?.fk_payment || 0)
}

async function getAllUsers() {
  const users = await dolibarrClient.get('/users', {
    limit: 10000,
    sortfield: 't.rowid',
    sortorder: 'DESC',
  })

  return Array.isArray(users) ? users : []
}

async function getAllSalaries() {
  const salaries = await dolibarrClient.get('/salaries', {
    limit: 10000,
    sortfield: 't.rowid',
    sortorder: 'DESC',
  })

  return Array.isArray(salaries) ? salaries : []
}

async function getAllSalaryPayments() {
  const payments = await dolibarrClient.get('/salaries/payments', {
    limit: 10000,
    sortfield: 't.rowid',
    sortorder: 'DESC',
  })

  return Array.isArray(payments) ? payments : []
}

async function tryDelete(endpoint) {
  try {
    await dolibarrClient.delete(endpoint)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: error.message,
    }
  }
}

async function deleteSalaryPayment(payment) {
  const paymentId = getId(payment)

  if (!paymentId) {
    return { status: 'skipped', message: 'Paiement sans ID.' }
  }

  const result = await tryDelete(`/salaries/${paymentId}/payments`)

  if (result.ok) {
    return {
      status: 'deleted',
      message: `Paiement ${paymentId} supprimé.`,
    }
  }

  return {
    status: 'error',
    message: `Paiement ${paymentId} non supprimé : ${result.message}`,
  }
}

async function deleteSalary(salary) {
  const salaryId = getId(salary)

  if (!salaryId) {
    return { status: 'skipped', message: 'Salaire sans ID.' }
  }

  const result = await tryDelete(`/salaries/${salaryId}`)

  if (result.ok) {
    return {
      status: 'deleted',
      message: `Salaire ${salaryId} supprimé.`,
    }
  }

  return {
    status: 'error',
    message: `Salaire ${salaryId} non supprimé : ${result.message}`,
  }
}

async function deleteUser(user) {
  const userId = getId(user)

  if (!userId) {
    return { status: 'skipped', message: 'Utilisateur sans ID.' }
  }

  if (userId === 1) {
    return {
      status: 'kept',
      message: 'Utilisateur Dolibarr rowid=1 conservé.',
    }
  }

  const result = await tryDelete(`/users/${userId}`)

  if (result.ok) {
    return {
      status: 'deleted',
      message: `Utilisateur ${userId} supprimé.`,
    }
  }

  return {
    status: 'error',
    message: `Utilisateur ${userId} non supprimé : ${result.message}`,
  }
}

function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length
}

function getErrors(items) {
  return items.filter((item) => item.status === 'error').map((item) => item.message)
}

function buildSummary(result) {
  return {
    paymentsDeleted: countByStatus(result.payments, 'deleted'),
    paymentsErrors: countByStatus(result.payments, 'error'),
    salariesDeleted: countByStatus(result.salaries, 'deleted'),
    salariesErrors: countByStatus(result.salaries, 'error'),
    usersDeleted: countByStatus(result.users, 'deleted'),
    usersKept: countByStatus(result.users, 'kept'),
    usersErrors: countByStatus(result.users, 'error'),
  }
}

export const ResetDataService = {
  preview: async () => {
    const [users, salaries, payments] = await Promise.all([
      getAllUsers(),
      getAllSalaries(),
      getAllSalaryPayments(),
    ])
    const deletableUsers = users.filter((user) => getId(user) !== 1)

    return {
      paymentsCount: payments.length,
      salariesCount: salaries.length,
      deletableUsersCount: deletableUsers.length,
      keptUsersCount: users.length - deletableUsers.length,
    }
  },

  resetAll: async ({ onProgress } = {}) => {
    const result = {
      payments: [],
      salaries: [],
      users: [],
      errors: [],
      summary: {},
    }

    const payments = await getAllSalaryPayments()

    for (let index = 0; index < payments.length; index += 1) {
      onProgress?.(`Suppression paiement ${index + 1}/${payments.length}`)
      result.payments.push(await deleteSalaryPayment(payments[index]))
    }

    const salaries = await getAllSalaries()

    for (let index = 0; index < salaries.length; index += 1) {
      onProgress?.(`Suppression salaire ${index + 1}/${salaries.length}`)
      result.salaries.push(await deleteSalary(salaries[index]))
    }

    const remainingSalaries = await getAllSalaries()

    for (let index = 0; index < remainingSalaries.length; index += 1) {
      onProgress?.(`Nouvelle tentative salaire ${index + 1}/${remainingSalaries.length}`)
      result.salaries.push(await deleteSalary(remainingSalaries[index]))
    }

    const users = await getAllUsers()

    for (let index = 0; index < users.length; index += 1) {
      const userId = getId(users[index])

      onProgress?.(`Suppression utilisateur ${index + 1}/${users.length} : ${userId}`)
      result.users.push(await deleteUser(users[index]))
    }

    result.summary = buildSummary(result)
    result.errors = [
      ...getErrors(result.payments),
      ...getErrors(result.salaries),
      ...getErrors(result.users),
    ]

    onProgress?.('Réinitialisation terminée.')

    return result
  },
}
