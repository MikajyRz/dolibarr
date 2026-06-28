import { dolibarrClient } from './dolibarrClient'

export const EmployeeService = {
  // Recuperer liste salarie
  getEmployees: async () => {
    const data = await dolibarrClient.get('/users', {
      limit: 100,
      sortfield: 't.lastname',
      sortorder: 'ASC',
    })

    return data
  },

  // Filtrer la liste des salaries
  searchEmployees: (employees, filters) => {
    const searchName = filters.searchName.toLowerCase()
    const searchEmail = filters.searchEmail.toLowerCase()
    const searchLogin = filters.searchLogin.toLowerCase()

    return employees.filter((employee) => {
      const fullName = `${employee.lastname || ''} ${employee.firstname || ''}`.toLowerCase()
      const email = `${employee.email || ''}`.toLowerCase()
      const login = `${employee.login || ''}`.toLowerCase()

      return (
        fullName.includes(searchName) &&
        email.includes(searchEmail) &&
        login.includes(searchLogin)
      )
    })
  },
}