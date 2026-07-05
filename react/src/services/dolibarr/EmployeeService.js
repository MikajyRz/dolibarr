import { dolibarrClient } from './dolibarrClient'

const isSuperAdminUser = (user) => {
  const login = String(user?.login || '').trim().toLowerCase()
  const lastname = String(user?.lastname || '').trim().toLowerCase()
  const firstname = String(user?.firstname || '').trim().toLowerCase()
  const fullName = `${firstname} ${lastname}`.trim()
  const reversedFullName = `${lastname} ${firstname}`.trim()
  const isAdmin = Number(user?.admin || 0) === 1

  return (
    isAdmin ||
    login === 'superadmin' ||
    login === 'admin' ||
    lastname.includes('superadmin') ||
    firstname.includes('superadmin') ||
    fullName.includes('superadmin') ||
    reversedFullName.includes('superadmin')
  )
}

export const EmployeeService = {
  getEmployees: async () => {
    const data = await dolibarrClient.get('/users', {
      limit: 10000,
      sortfield: 't.lastname',
      sortorder: 'ASC',
      sqlfilters: '(t.employee:=:1)',
    })

    return Array.isArray(data)
      ? data.filter((user) => {
          return Number(user?.employee || 0) === 1 && !isSuperAdminUser(user)
        })
      : []
  },

  getEmployeeById: async (id) => {
    const data = await dolibarrClient.get(`/users/${id}`)

    return data || null
  },

  getEmployeeRef: (employee) => {
    return String(
      employee?.ref_employee ||
        employee?.ref_ext ||
        employee?.array_options?.options_ref_employe ||
        employee?.array_options?.ref_employe ||
        employee?.id ||
        '',
    )
  },

  getEmployeeName: (employee) => {
    return `${employee?.lastname || ''} ${employee?.firstname || ''}`.trim()
  },

  getEmployeePoste: (employee) => {
    return String(employee?.job || '').trim()
  },

  getEmployeeWeeklyHours: (employee) => {
    return Number(
      employee?.weeklyhours ||
        employee?.weekly_hours ||
        employee?.array_options?.options_heure_travail_semaine ||
        employee?.array_options?.heure_travail_semaine ||
        0,
    )
  },

  getEmployeeGender: (employee) => {
    const gender = String(employee?.gender || '').toLowerCase()

    if (gender === 'man' || gender === 'homme' || gender === 'm') {
      return 'homme'
    }

    if (gender === 'woman' || gender === 'femme' || gender === 'f') {
      return 'femme'
    }

    return 'autre'
  },

  getEmployeeId: (employee) => {
    return Number(employee?.id || employee?.rowid || 0)
  },

  getEmployeePhotoDataUrl: async (employee) => {
    const employeeId = EmployeeService.getEmployeeId(employee)

    if (!employeeId || !employee?.photo) {
      return ''
    }

    const document = await dolibarrClient.get('/documents/download', {
      modulepart: 'user',
      original_file: `${employeeId}/photos/${employee.photo}`,
    })

    const content = document?.content || ''
    const contentType = document?.['content-type'] || 'image/jpeg'

    return content ? `data:${contentType};base64,${content}` : ''
  },

  searchEmployees: (employees, filters) => {
    const searchRef = String(filters.searchRef || '').toLowerCase()
    const searchName = String(filters.searchName || '').toLowerCase()
    const searchPost = String(filters.searchPost || '').toLowerCase()
    const searchGender = String(filters.searchGender || '').toLowerCase()
    const searchLogin = String(filters.searchLogin || '').toLowerCase()

    return employees.filter((employee) => {
      const ref = EmployeeService.getEmployeeRef(employee).toLowerCase()
      const name = EmployeeService.getEmployeeName(employee).toLowerCase()
      const post = EmployeeService.getEmployeePoste(employee).toLowerCase()
      const gender = EmployeeService.getEmployeeGender(employee).toLowerCase()
      const login = String(employee?.login || '').toLowerCase()

      return (
        ref.includes(searchRef) &&
        name.includes(searchName) &&
        post.includes(searchPost) &&
        gender.includes(searchGender) &&
        login.includes(searchLogin)
      )
    })
  },

  filterEmployeesForSalaryGeneration: (employees, filters) => {
    const poste = String(filters.poste || '').toLowerCase()
    const genre = String(filters.genre || '').toLowerCase()
    const minHours = filters.minHours !== '' ? Number(filters.minHours) : null
    const maxHours = filters.maxHours !== '' ? Number(filters.maxHours) : null

    return employees.filter((employee) => {
      const employeePoste = EmployeeService.getEmployeePoste(employee).toLowerCase()
      const employeeGenre = EmployeeService.getEmployeeGender(employee).toLowerCase()
      const weeklyHours = EmployeeService.getEmployeeWeeklyHours(employee)

      if (poste && employeePoste !== poste) {
        return false
      }

      if (genre && employeeGenre !== genre) {
        return false
      }

      if (minHours !== null && weeklyHours < minHours) {
        return false
      }

      if (maxHours !== null && weeklyHours > maxHours) {
        return false
      }

      return true
    })
  },
}
