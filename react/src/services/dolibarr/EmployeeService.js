import { dolibarrClient } from './dolibarrClient'

export const EmployeeService = {
  // Récupérer la liste des salariés depuis Dolibarr
  getEmployees: async () => {
    const data = await dolibarrClient.get('/users', {
      limit: 100,
      sortfield: 't.lastname',
      sortorder: 'ASC',
    })

    return data
  },

  // Filtrer la liste des salariés
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

  // Récupérer le salaire d'un salarié
  getEmployeeSalary: (employee) => {
    return Number(employee.salary || 0)
  },

  // Récupérer le genre d'un salarié
  getEmployeeGender: (employee) => {
    const gender = employee.gender || ''

    if (gender === 'man') {
      return 'homme'
    }

    if (gender === 'woman') {
      return 'femme'
    }

    return 'autre'
  },

  // Calculer le montant total des salaires par genre
  getSalaryAmountByGender: (employees) => {
    const result = {
      homme: 0,
      femme: 0,
      autre: 0,
    }

    employees.forEach((employee) => {
      const salary = EmployeeService.getEmployeeSalary(employee)
      const gender = EmployeeService.getEmployeeGender(employee)

      result[gender] += salary
    })

    return result
  },
}