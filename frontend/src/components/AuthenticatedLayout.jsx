import DashboardLayout from './DashboardLayout'

function AuthenticatedLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>
}

export default AuthenticatedLayout
