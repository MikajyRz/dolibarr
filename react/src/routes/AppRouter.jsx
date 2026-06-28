import { Navigate, Route, Routes } from 'react-router-dom'
import BackofficeLayout from '../components/layouts/BackofficeLayout'
import DashboardPage from '../pages/backoffice/DashboardPage'
import ProductsPage from '../pages/backoffice/ProductsPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/backoffice/dashboard" replace />} />

      <Route path="/backoffice" element={<BackofficeLayout />}>
        <Route index element={<Navigate to="/backoffice/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="*" element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/backoffice/dashboard" replace />} />
    </Routes>
  )
}

export default AppRouter
