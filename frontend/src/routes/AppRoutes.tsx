import React, { useState } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import { HomePage } from '../pages/Home/HomePage'
import { LoginPage, ForgotPasswordPage, ResetPasswordPage, type PortalType } from '../pages/Auth'
import {
  OwnerDashboardPage,
  EmployeesPage,
  AddEmployeePage,
  EmployeeDetailsPage,
  AttendancePage,
  ShiftsPage,
  LeavePage,
  DepartmentsPage,
  UniformsPage,
  ReportsPage,
  NotificationsPage,
  SubscriptionPage,
  SettingsPage,
  OwnerDeskPage,
} from '../pages/Owner'
import { EmployeeDashboardPage } from '../pages/Employee'
import {
  SuperAdminDashboardPage,
  SuperAdminSubscriptionsPage,
  SuperAdminTelemetryPage,
} from '../pages/SuperAdmin'
import { DashboardLayout } from '../layouts/DashboardLayout'
import { EmployeeLayout } from '../layouts/EmployeeLayout'
import { SuperAdminLayout } from '../layouts/SuperAdminLayout'
import type { Employee } from '../types/employee'

/**
 * Role-based protected route wrapper
 */
const ProtectedRoute: React.FC<{
  children: React.ReactNode
  allowedRoles?: string[]
}> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('wf360_token')
  const userStr = localStorage.getItem('wf360_user')

  // If no auth token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }

  // Validate role if roles are specified
  if (allowedRoles && userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user?.role && !allowedRoles.includes(user.role)) {
        if (user.role === 'employee') return <Navigate to="/employee" replace />
        if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />
        return <Navigate to="/owner" replace />
      }
    } catch {
      return <Navigate to="/login" replace />
    }
  }

  return <>{children}</>
}

export const AppRoutes: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(() => {
    try {
      const saved = sessionStorage.getItem('wf360_selected_employee')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore storage errors
    }
    return null
  })
  const [employeeTab, setEmployeeTab] = useState('home')

  // Synchronize active sidebar route dynamically from current location pathname
  const pathAfterOwner = location.pathname.replace('/owner/', '').replace('/owner', '')
  const currentRoute = pathAfterOwner.split('/')[0] || 'dashboard'

  const pathAfterSuperAdmin = location.pathname.replace('/superadmin/', '').replace('/superadmin', '')
  const superAdminRoute = pathAfterSuperAdmin.split('/')[0] || 'tenants'

  const handleSuperAdminNav = (routeId: string) => {
    if (routeId === 'tenants') {
      navigate('/superadmin')
    } else {
      navigate(`/superadmin/${routeId}`)
    }
  }

  const handleLoginSuccess = (portal: PortalType) => {
    if (portal === 'owner') {
      navigate('/owner/dashboard')
    } else if (portal === 'employee') {
      navigate('/employee')
    } else {
      navigate('/superadmin')
    }
  }

  const handleOwnerNav = (routeId: string) => {
    navigate(`/owner/${routeId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('wf360_token')
    localStorage.removeItem('wf360_user')
    navigate('/login')
  }

  return (
    <Routes>
      {/* Public Landing Page */}
      <Route
        path="/"
        element={
          <HomePage
            onNavigateToLogin={() => navigate('/login')}
            onNavigateToOwnerDashboard={() => navigate('/owner/dashboard')}
          />
        }
      />

      {/* Authentication Pages */}
      <Route
        path="/login"
        element={
          <LoginPage
            onSuccessLogin={handleLoginSuccess}
            onForgotPasswordClick={() => navigate('/forgot-password')}
            onBackToHomeClick={() => navigate('/')}
          />
        }
      />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage onBackToLogin={() => navigate('/login')} />}
      />
      <Route
        path="/reset-password"
        element={
          <ResetPasswordPage
            onSuccessReset={() => navigate('/login')}
            onBackToLogin={() => navigate('/login')}
          />
        }
      />

      {/* Organization Owner Portal Routes */}
      <Route
        path="/owner/*"
        element={
          <ProtectedRoute allowedRoles={['owner', 'manager', 'superadmin']}>
            <DashboardLayout
              currentRoute={currentRoute}
              onRouteChange={handleOwnerNav}
              onLogout={handleLogout}
            >
              <Routes>
                <Route
                  path=""
                  element={
                    <OwnerDashboardPage
                      onNavigateToEmployees={() => handleOwnerNav('employees')}
                      onNavigateToAttendance={() => handleOwnerNav('attendance')}
                      onNavigateToShifts={() => handleOwnerNav('shifts')}
                      onNavigateToLeave={() => handleOwnerNav('leave')}
                    />
                  }
                />
                <Route
                  path="dashboard"
                  element={
                    <OwnerDashboardPage
                      onNavigateToEmployees={() => handleOwnerNav('employees')}
                      onNavigateToAttendance={() => handleOwnerNav('attendance')}
                      onNavigateToShifts={() => handleOwnerNav('shifts')}
                      onNavigateToLeave={() => handleOwnerNav('leave')}
                    />
                  }
                />
                <Route
                  path="employees"
                  element={
                    <EmployeesPage
                      onAddEmployeeClick={() => navigate('/owner/employees/add')}
                      onViewEmployee={(emp) => {
                        setSelectedEmployee(emp)
                        try {
                          sessionStorage.setItem('wf360_selected_employee', JSON.stringify(emp))
                        } catch {
                          // ignore storage errors
                        }
                        navigate('/owner/employees/details')
                      }}
                    />
                  }
                />
                <Route
                  path="employees/add"
                  element={
                    <AddEmployeePage
                      onBack={() => navigate('/owner/employees')}
                      onEmployeeCreated={() => navigate('/owner/employees')}
                    />
                  }
                />
                <Route
                  path="employees/details"
                  element={
                    selectedEmployee ? (
                      <EmployeeDetailsPage
                        employee={selectedEmployee}
                        onBack={() => navigate('/owner/employees')}
                      />
                    ) : (
                      <Navigate to="/owner/employees" replace />
                    )
                  }
                />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="shifts" element={<ShiftsPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="leave" element={<LeavePage />} />
                <Route path="uniforms" element={<UniformsPage />} />
                <Route path="desk" element={<OwnerDeskPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="subscription" element={<SubscriptionPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Employee Portal Routes */}
      <Route
        path="/employee/*"
        element={
          <ProtectedRoute allowedRoles={['employee', 'owner', 'manager', 'superadmin']}>
            <EmployeeLayout
              currentTab={employeeTab}
              onTabChange={(tab) => setEmployeeTab(tab)}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="" element={<EmployeeDashboardPage activeTab={employeeTab} />} />
                <Route path="*" element={<Navigate to="/employee" replace />} />
              </Routes>
            </EmployeeLayout>
          </ProtectedRoute>
        }
      />

      {/* Super Admin Platform Console */}
      <Route
        path="/superadmin/*"
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SuperAdminLayout
              currentRoute={superAdminRoute}
              onRouteChange={handleSuperAdminNav}
              onLogout={handleLogout}
            >
              <Routes>
                <Route path="" element={<SuperAdminDashboardPage />} />
                <Route path="tenants" element={<SuperAdminDashboardPage />} />
                <Route path="subscriptions" element={<SuperAdminSubscriptionsPage />} />
                <Route path="telemetry" element={<SuperAdminTelemetryPage />} />
                <Route path="*" element={<Navigate to="/superadmin" replace />} />
              </Routes>
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback Root Redirection */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes
