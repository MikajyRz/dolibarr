import { Navigate, Route, Routes } from 'react-router-dom'

import BackofficeLayout from '../components/layouts/BackofficeLayout'
import FrontofficeLayout from '../components/layouts/FrontofficeLayout'
import BackofficeLogin from '../pages/backoffice/BackofficeLogin'

import DashboardPage from '../pages/backoffice/DashboardPage'
import ProductsPage from '../pages/backoffice/ProductsPage'
import ImportPage from '../pages/backoffice/ImportPage'

import SalariesListPage from '../pages/frontoffice/SalariesListPage'
import CreateSalaryPaymentPage from '../pages/frontoffice/CreateSalaryPaymentPage'

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
        <Route path="salaries" element={<SalariesListPage />} />
        <Route path="/frontoffice/salaries/create" element={<CreateSalaryPaymentPage />} />
      </Route>

      <Route path="/backoffice" element={<BackofficeLogin />} />

      <Route path="/backoffice" element={<ProtectedBackofficeRoute />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="import" element={<ImportPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/frontoffice/salaries" replace />} />
    </Routes>
  )
}

export default AppRouter
