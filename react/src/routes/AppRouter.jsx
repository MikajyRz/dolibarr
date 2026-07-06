import { Navigate, Route, Routes } from 'react-router-dom'

import BackofficeLayout from '../components/layouts/BackofficeLayout'
import FrontofficeLayout from '../components/layouts/FrontofficeLayout'
import BackofficeLogin from '../pages/backoffice/BackofficeLogin'

import DashboardPage from '../pages/backoffice/DashboardPage'
import ImportPage from '../pages/backoffice/ImportPage'
import ResetDataPage from '../pages/backoffice/ResetDataPage'
import JoursFeriesPage from '../pages/backoffice/JoursFeriesPage'

import SalariesListPage1 from '../pages/frontoffice/SalariesListPage1'
import SalariesListPage from '../pages/frontoffice/SalariesListPage'
import CreateSalaryPaymentPage from '../pages/frontoffice/CreateSalaryPaymentPage'
import BulkSalaryGenerationPage from '../pages/frontoffice/BulkSalaryGenerationPage'
import MonthlySalaryGenerationPage from '../pages/frontoffice/MonthlySalaryGenerationPage'
import EmployeeDetailsPage from '../pages/frontoffice/EmployeeDetailsPage'

import { backofficeAuthService } from '../services/backofficeAuthService'

const ProtectedBackofficeRoute = () => {
  if (!backofficeAuthService.isAuthenticated()) {
    return <Navigate to="/backoffice" replace />
  }

  return <BackofficeLayout />
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/frontoffice/salaries" replace />} />

      <Route path="/frontoffice" element={<FrontofficeLayout />}>
        <Route index element={<Navigate to="/frontoffice/salaries" replace />} />
        <Route path="salaries1" element={<SalariesListPage1 />} />
        <Route path="salaries" element={<SalariesListPage />} />
        <Route path="/frontoffice/salaries/create" element={<CreateSalaryPaymentPage />} />
        <Route path="salaries/bulk-create" element={<BulkSalaryGenerationPage />} />
        <Route path="salaries/bulk-create-month" element={<MonthlySalaryGenerationPage />} />
        <Route path="salaries/:id" element={<EmployeeDetailsPage />} />
      </Route>

      <Route path="/backoffice" element={<BackofficeLogin />} />

      <Route path="/backoffice" element={<ProtectedBackofficeRoute />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="import" element={<ImportPage />} />
        <Route path="reset" element={<ResetDataPage />} />
        <Route path="jours-feries" element={<JoursFeriesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/frontoffice/salaries" replace />} />
    </Routes>
  )
}

export default AppRouter
