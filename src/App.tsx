import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import LandingPage from '@/pages/landing'

const Manage = lazy(() => import('@/pages/manage'))
const Record = lazy(() => import('@/pages/manage/record'))
const Movement = lazy(() => import('@/pages/manage/movement'))
const AdminMain = lazy(() => import('./pages/admin/main'))
const AdminUsersPage = lazy(() => import('@/pages/admin/users'))
const AdminFixedMovementPage = lazy(() => import('@/pages/admin/fixed-movement'))
const AdminFixedMovementFormPage = lazy(() => import('@/pages/admin/fixed-movement/create'))
const AdminFixedMovementTeamSettingsPage = lazy(() => import('@/pages/admin/fixed-movement/team-settings'))
const AdminFixedMovementTeamFormPage = lazy(() => import('@/pages/admin/fixed-movement/team-settings/create'))
const HomePage = lazy(() => import('@/pages/home'))
const AfterSchoolPage = lazy(() => import('@/pages/after-school'))
const SelfStudyPage = lazy(() => import('@/pages/admin/self-study'))
const AdminSupervisionPage = lazy(() => import('@/pages/admin/supervision'))
const AdminBusinessTripPage = lazy(() => import('@/pages/admin/business-trip'))
const SupervisionPage = lazy(() => import('@/pages/supervision'))
const AfterSchoolExtraPage = lazy(() => import('@/pages/after-school/extra'))
const ErrorPage = lazy(() => import('./pages/error'))
const AdminAfterSchoolPage = lazy(() => import('@/pages/admin/after-school'))
const AdminAfterSchoolFormPage = lazy(() => import('@/pages/admin/after-school/create'))
const BusinessTripPage = lazy(() => import('@/pages/after-school/business-trip'))
const Oauth = lazy(() => import('@/pages/oauth2'))

function App() {
  return (
    <Routes>
      <Route path="*" element={<ErrorPage />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/oauth2/callback" element={<Oauth />} />
      <Route element={<MainLayout />}>
        <Route path="/main" element={<HomePage />} />
        <Route path="/supervision" element={<SupervisionPage />} />
        <Route path="/manage">
          <Route index element={<Manage />} />
          <Route path="record" element={<Record />} />
          <Route path="movement" element={<Movement />} />
        </Route>
        <Route path="/after-school">
          <Route index element={<AfterSchoolPage />} />
          <Route path="extra" element={<AfterSchoolExtraPage />} />
          <Route path="business-trip" element={<BusinessTripPage />} />
        </Route>
        <Route path="/admin">
            <Route index element={<AdminMain />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="fixed-movement" element={<AdminFixedMovementPage />} />
            <Route path="fixed-movement/create" element={<AdminFixedMovementFormPage />} />
            <Route path="fixed-movement/edit/:id" element={<AdminFixedMovementFormPage />} />
            <Route path="fixed-movement/team-settings" element={<AdminFixedMovementTeamSettingsPage />} />
            <Route path="fixed-movement/team-settings/create" element={<AdminFixedMovementTeamFormPage />} />
            <Route path="fixed-movement/team-settings/edit/:id" element={<AdminFixedMovementTeamFormPage />} />
            <Route path="self-study" element={<SelfStudyPage />} />
            <Route path="supervision" element={<AdminSupervisionPage />} />
            <Route path="after-school" element={<AdminAfterSchoolPage />} />
            <Route path="after-school/create" element={<AdminAfterSchoolFormPage />} />
            <Route path="after-school/edit/:id" element={<AdminAfterSchoolFormPage />} />
            <Route path="business-trip" element={<AdminBusinessTripPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
