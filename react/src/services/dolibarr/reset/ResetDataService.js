import { dolibarrClient } from '../dolibarrClient'
import { backendClient } from '../../backend/backendClient'

function getId(item) {
  return Number(item?.id || item?.rowid || item?.pid || item?.fk_payment || 0)
}

function unique(items) {
  return [...new Set(items.filter(Boolean))]
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

async function getUserDocuments(userId) {
  try {
    const documents = await dolibarrClient.get('/documents', {
      modulepart: 'user',
      id: userId,
    })

    return Array.isArray(documents) ? documents : []
  } catch {
    return []
  }
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

async function tryDeleteDocument(originalFile) {
  try {
    await dolibarrClient.delete('/documents', {
      modulepart: 'user',
      original_file: originalFile,
    })

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      message: error.message,
    }
  }
}

function getDocumentPath(document, userId) {
  const path = String(
    document?.original_file ||
      document?.relativename ||
      document?.relativepath ||
      document?.fullname ||
      document?.name ||
      '',
  ).replaceAll('\\', '/')

  if (!path) {
    return ''
  }

  if (path.startsWith(`${userId}/`)) {
    return path
  }

  const userPathIndex = path.indexOf(`/${userId}/`)

  if (userPathIndex >= 0) {
    return path.slice(userPathIndex + 1)
  }

  return `${userId}/${path.replace(/^\/+/, '')}`
}

function getUserPhotoPaths(user, documents = []) {
  const userId = getId(user)
  const photo = user?.photo
  const documentPaths = documents
    .map((document) => getDocumentPath(document, userId))
    .filter((path) => path.startsWith(`${userId}/photos/`))

  return unique([
    photo && `${userId}/photos/${photo}`,
    photo && `${userId}/photos/thumbs/photo_small.jpg`,
    photo && `${userId}/photos/thumbs/photo_mini.jpg`,
    ...documentPaths,
  ])
}

async function deleteUserPhotos(user) {
  const userId = getId(user)

  if (!userId) {
    return { status: 'skipped', message: 'Photos utilisateur sans ID.' }
  }

  const documents = await getUserDocuments(userId)
  const photoPaths = getUserPhotoPaths(user, documents)
  const errors = []
  let deletedCount = 0

  if (photoPaths.length === 0) {
    return {
      status: 'skipped',
      message: `Aucune photo utilisateur ${userId} à supprimer.`,
    }
  }

  for (const photoPath of photoPaths) {
    const result = await tryDeleteDocument(photoPath)

    if (result.ok) {
      deletedCount += 1
    } else {
      errors.push(`${photoPath} : ${result.message}`)
    }
  }

  if (errors.length > 0 && deletedCount === 0) {
    return {
      status: 'error',
      message: `Photos utilisateur ${userId} non supprimées : ${errors.join(' | ')}`,
    }
  }

  if (errors.length > 0) {
    return {
      status: 'partial',
      message: `Photos utilisateur ${userId} partiellement supprimées : ${errors.join(' | ')}`,
    }
  }

  return {
    status: 'deleted',
    message: `Photos utilisateur ${userId} supprimées (${deletedCount}).`,
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
    photosDeleted: countByStatus(result.photos, 'deleted'),
    photosPartial: countByStatus(result.photos, 'partial'),
    photosErrors: countByStatus(result.photos, 'error'),
    usersDeleted: countByStatus(result.users, 'deleted'),
    usersKept: countByStatus(result.users, 'kept'),
    usersErrors: countByStatus(result.users, 'error'),

    sqliteTotalDeleted: result.sqlite?.totalDeleted || 0,
    sqliteTables: result.sqlite?.tables || [],
  }
}

async function getSqlitePreview() {
  try {
    return await backendClient.get('/reset-sqlite/preview')
  } catch (error) {
    return {
      total: 0,
      tables: [],
      error: error.message,
    }
  }
}

async function resetSqliteTables() {
  try {
    return await backendClient.delete('/reset-sqlite')
  } catch (error) {
    return {
      totalDeleted: 0,
      tables: [],
      error: error.message,
    }
  }
}

export const ResetDataService = {
  preview: async () => {
    const [users, salaries, payments, sqlitePreview] = await Promise.all([
      getAllUsers(),
      getAllSalaries(),
      getAllSalaryPayments(),
      getSqlitePreview(),
    ])

    const deletableUsers = users.filter((user) => getId(user) !== 1)

    return {
      paymentsCount: payments.length,
      salariesCount: salaries.length,
      deletableUsersCount: deletableUsers.length,
      keptUsersCount: users.length - deletableUsers.length,
      sqlitePreview,
    }
  },

  resetAll: async ({ onProgress } = {}) => {
    const result = {
      payments: [],
      salaries: [],
      photos: [],
      users: [],
      sqlite: null,
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

      if (userId !== 1) {
        onProgress?.(`Suppression photos utilisateur ${index + 1}/${users.length} : ${userId}`)
        result.photos.push(await deleteUserPhotos(users[index]))
      }

      onProgress?.(`Suppression utilisateur ${index + 1}/${users.length} : ${userId}`)
      result.users.push(await deleteUser(users[index]))

      onProgress?.('Réinitialisation des tables SQLite...')
      result.sqlite = await resetSqliteTables()
    }

    result.summary = buildSummary(result)
    result.errors = [
      ...getErrors(result.payments),
      ...getErrors(result.salaries),
      ...getErrors(result.photos),
      ...getErrors(result.users),
    ]

    onProgress?.('Réinitialisation terminée.')

    return result
  },
}
