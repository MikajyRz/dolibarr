import { dolibarrClient } from './dolibarrClient'

export const EmployeeService = {
  getEmployees: async () => {
    const data = await dolibarrClient.get('/users', {
      limit: 10000,
      sortfield: 't.lastname',
      sortorder: 'ASC',
    })

    return Array.isArray(data) ? data : []
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

  searchEmployees: (employees, filters) => {
    const searchRef = String(filters.searchRef || '').toLowerCase()
    const searchName = String(filters.searchName || '').toLowerCase()
    const searchGender = String(filters.searchGender || '').toLowerCase()
    const searchLogin = String(filters.searchLogin || '').toLowerCase()

    return employees.filter((employee) => {
      const ref = EmployeeService.getEmployeeRef(employee).toLowerCase()
      const name = EmployeeService.getEmployeeName(employee).toLowerCase()
      const gender = EmployeeService.getEmployeeGender(employee).toLowerCase()
      const login = String(employee?.login || '').toLowerCase()

      return (
        ref.includes(searchRef) &&
        name.includes(searchName) &&
        gender.includes(searchGender) &&
        login.includes(searchLogin)
      )
    })
  },
}
