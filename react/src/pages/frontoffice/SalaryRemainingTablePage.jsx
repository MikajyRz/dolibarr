import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmployeeService } from '../../services/dolibarr/EmployeeService'
import { SalaryService } from '../../services/dolibarr/SalaryService'

const formatAmount = (amount) => {
  return `${Number(amount || 0).toLocaleString()} Ar`
}

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)

  return date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

const SalaryRemainingTablePage = () => {
  const [employees, setEmployees] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')

      try {
        const employeeList = await EmployeeService.getEmployees()
        const monthTotals = {}

        for (const employee of employeeList) {
          const employeeId = EmployeeService.getEmployeeId(employee)

          const salaryHistory =
            await SalaryService.getEmployeeSalariesWithPayments(employeeId)

          salaryHistory.forEach((item) => {
            const monthKey = SalaryService.getMonthKeyFromDate(
              item.startDate,
            )

            if (monthKey === 'Non renseigne') {
              return
            }

            if (!monthTotals[monthKey]) {
              monthTotals[monthKey] = {}
            }

            if (!monthTotals[monthKey][employeeId]) {
              monthTotals[monthKey][employeeId] = 0
            }

            monthTotals[monthKey][employeeId] += Number(
              item.remaining || 0,
            )
          })
        }

        const tableRows = Object.keys(monthTotals)
          .sort((firstMonth, secondMonth) => {
            return secondMonth.localeCompare(firstMonth)
          })
          .map((monthKey) => {
            return {
              monthKey,
              employeeTotals: monthTotals[monthKey],
            }
          })

        setEmployees(employeeList)
        setRows(tableRows)
      } catch (err) {
        setError(err.message)
        setEmployees([])
        setRows([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <section>
      <h1>Restes a payer par mois </h1>

      {loading && <p>Chargement...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <table>
          <thead>
            <tr>
              <th>Mois et annee</th>

              {employees.map((employee) => {
                const employeeId =
                  EmployeeService.getEmployeeId(employee)

                return (
                  <th key={employeeId}>
                    {EmployeeService.getEmployeeName(employee)}
                  </th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.monthKey}>
                <td>{formatMonth(row.monthKey)}</td>

                {employees.map((employee) => {
                  const employeeId =
                    EmployeeService.getEmployeeId(employee)

                  const hasSalary =
                    row.employeeTotals[employeeId] !== undefined

                  const remaining =
                    row.employeeTotals[employeeId] || 0

                  return (
                    <td key={employeeId}>
                      {hasSalary ? (
                        <Link
                          to={`/frontoffice/salaries/${employeeId}?month=${row.monthKey}`}
                        >
                          {formatAmount(remaining)}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={employees.length + 1}>
                  Aucun salaire trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default SalaryRemainingTablePage