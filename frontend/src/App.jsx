import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { messageService } from './services/messageService';
import Messaging from './pages/Messaging';
import { useAuth } from './context/AuthContext'
import InstallPWA from './components/InstallPWA'
import NetworkStatus from './components/NetworkStatus'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import RegisterFreelancer from './pages/RegisterFreelancer'
import RegisterEmployer from './pages/RegisterEmployer'
import AccountType from './pages/AccountType'
import VerifyOTP from './pages/VerifyOTP'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import JobList from './pages/JobList'
import AdminDashboard from './pages/AdminDashboard'
import AdminDemandes from './pages/AdminDemandes'
import EmployerDashboard from './pages/EmployerDashboard'
import FreelancerDashboard from './pages/FreelancerDashboard'
import FreelancerProfile from './pages/FreelancerProfile'
import FreelancerEvaluations from './pages/FreelancerEvaluations'
import EmployerProfile from './pages/EmployerProfile'
import FreelancerList from './pages/FreelancerList'
import EmployerList from './pages/EmployerList'
import Notifications from './pages/Notifications'
import PublishMission from './pages/PublishMission'
import Settings from './pages/Settings'
import PublicProfile from './pages/PublicProfile'
import AdminUsers from './pages/AdminUsers'
import AdminCreateUser from './pages/AdminCreateUser'
import AdminMissions from './pages/AdminMissions'
import AdminJobs from './pages/AdminJobs'
import AdminStats from './pages/AdminStats'
import AdminSecteurs from './pages/AdminSecteurs'
import AdminCompetences from './pages/AdminCompetences'
import AdminPublishMission from './pages/AdminPublishMission'
import AdminLangues from './pages/AdminLangues'
import AdminTypeFacturation from './pages/AdminTypeFacturation'
import AdminTypeMission from './pages/AdminTypeMission'
import AdminLieuMission from './pages/AdminLieuMission'
import PublishMissionHourly from './pages/PublishMissionHourly'
import PublishMissionFixed from './pages/PublishMissionFixed'
import EmployerMyJobs from './pages/EmployerMyJobs'
import EmployerJobs from './pages/EmployerJobs'
import AdminSendNotification from './pages/AdminSendNotification'
import MissionDemandes from './pages/MissionDemandes'
import VerificationIdentite from './pages/VerificationIdentite'
import FormulaireVerificationMultiEtapes from './pages/FormulaireVerificationMultiEtapes'
import AdminVerifications from './pages/AdminVerifications'
import Support from './pages/Support'
import AdminSupport from './pages/AdminSupport'
import AdminLabel from './pages/AdminLabel'
import AdminLabelEligibleUsers from './pages/AdminLabelEligibleUsers'
import AdminLabelExceptionalRequests from './pages/AdminLabelExceptionalRequests'
import AuthHelp from './pages/AuthHelp'
import LabelStatus from './pages/LabelStatus'
import LabelEligibility from './pages/LabelEligibility'
import LabelExceptionalRequest from './pages/LabelExceptionalRequest'
import AdminApplications from './pages/AdminApplications'
import AdminForfaits from './pages/AdminForfaits'
import AdminFactures from './pages/AdminFactures'
import AdminPWA from './pages/AdminPWA'
import AdminProfile from './pages/AdminProfile'
import FreelancerForfaits from './pages/FreelancerForfaits'
import FreelancerMissions from './pages/FreelancerMissions'
import FreelancerMesMissions from './pages/FreelancerMesMissions'
import FreelancerMyJobs from './pages/FreelancerMyJobs'
import EmployerForfaits from './pages/EmployerForfaits'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import FreelancerPublicProfile from './pages/FreelancerPublicProfile'
import EmployerPublicProfile from './pages/EmployerPublicProfile'
import EmployerViewFreelancer from './pages/EmployerViewFreelancer'
import EmployerApplications from './pages/EmployerApplications'
import FreelancerApplications from './pages/FreelancerApplications'
import DemandeDevis from './pages/DemandeDevis'
import AdminDemandesDevis from './pages/AdminDemandesDevis'
import DevisPubliques from './pages/DevisPubliques'
import FreelancerDevisDisponibles from './pages/FreelancerDevisDisponibles'
import FreelancerDemandeDetails from './pages/FreelancerDemandeDetails'
import MissionsPubliques from './pages/MissionsPubliques'
import AdminDemandeDetails from './pages/AdminDemandeDetails'
import AdminFreelancerJobs from './pages/AdminFreelancerJobs'
import FreelancerPublishMission from './pages/FreelancerPublishMission'
import FreelancerPublishMissionHourly from './pages/FreelancerPublishMissionHourly'
import FreelancerPublishMissionFixed from './pages/FreelancerPublishMissionFixed'
import FreelancerMyPublishedJobs from './pages/FreelancerMyPublishedJobs'

// Components
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import DashboardLayout from './layouts/DashboardLayout'

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const isDashboardRoute = location.pathname.startsWith('/employer/') || location.pathname.startsWith('/freelancer/') || location.pathname.startsWith('/admin/')
  const isPublicPage = ['/missions', '/devis', '/demande-devis'].includes(location.pathname)
  const hideNavbar = ['/login', '/register', '/account-type', '/verify-otp', '/forgot-password'].includes(location.pathname)
    || location.pathname.startsWith('/register-freelancer')
    || location.pathname.startsWith('/register-employer')
    || isDashboardRoute
    || isPublicPage

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <InstallPWA />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 15000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 15000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 15000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Détection de la connexion internet */}
      <NetworkStatus />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/register-freelancer" element={user ? <Navigate to="/" /> : <RegisterFreelancer />} />
        <Route path="/register-freelancer/*" element={user ? <Navigate to="/" /> : <RegisterFreelancer />} />
        <Route path="/register-employer" element={user ? <Navigate to="/" /> : <RegisterEmployer />} />
        <Route path="/register-employer/*" element={user ? <Navigate to="/" /> : <RegisterEmployer />} />
        <Route path="/account-type" element={user ? <Navigate to="/" /> : <AccountType />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
        <Route path="/reset-password/:token" element={user ? <Navigate to="/" /> : <ResetPassword />} />
        <Route path="/auth-help" element={<AuthHelp />} />
        <Route path="/demande-devis" element={<DemandeDevis />} />
        <Route path="/devis" element={<DevisPubliques />} />
        <Route path="/missions" element={<MissionsPubliques />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <PrivateRoute>
            {user?.role === 'admin' && <Navigate to="/admin/dashboard" />}
            {user?.role === 'employer' && <Navigate to="/employer/dashboard" />}
            {user?.role === 'freelancer' && <Navigate to="/freelancer/dashboard" />}
            {!user && <Navigate to="/login" />}
          </PrivateRoute>
        } />

        <Route path="/jobs" element={
          <PrivateRoute>
            <JobList />
          </PrivateRoute>
        } />

        {/* Public Profile Routes */}
        <Route path="/freelancer/public-profile/:username" element={<FreelancerPublicProfile />} />
        <Route path="/employer/public-profile/:companyName" element={<EmployerPublicProfile />} />

        {/* Employer Profile with Dashboard Layout (accessed from employer list) */}
        <Route path="/freelancer/list-employers/:companyName" element={
          <PrivateRoute requiredRole="freelancer">
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<EmployerPublicProfile />} />
        </Route>



        {/* Admin Routes with Sidebar */}
        <Route path="/admin" element={
          <PrivateRoute requiredRole="admin">
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/create" element={<AdminCreateUser />} />
          <Route path="missions" element={<AdminMissions />} />
          <Route path="missions-prestataires" element={<AdminFreelancerJobs />} />
          <Route path="jobs" element={<AdminJobs />} />
          <Route path="applications" element={<AdminApplications />} />
          <Route path="demandes" element={<AdminDemandes />} />
          <Route path="forfaits" element={<AdminForfaits />} />
          <Route path="factures" element={<AdminFactures />} />
          <Route path="pwa" element={<AdminPWA />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="secteurs" element={<AdminSecteurs />} />
          <Route path="competences" element={<AdminCompetences />} />
          <Route path="publish-mission" element={<AdminPublishMission />} />
          <Route path="publish-mission/forfait-heure" element={<PublishMissionHourly />} />
          <Route path="publish-mission/forfait-fixe" element={<PublishMissionFixed />} />
          <Route path="langues" element={<AdminLangues />} />
          <Route path="type-facturation" element={<AdminTypeFacturation />} />
          <Route path="type-mission" element={<AdminTypeMission />} />
          <Route path="lieu-mission" element={<AdminLieuMission />} />
          <Route path="verifications" element={<AdminVerifications />} />
          <Route path="send-notification" element={<AdminSendNotification />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="support/:ticketId" element={<AdminSupport />} />
          <Route path="label" element={<AdminLabel />} />
          <Route path="label/eligible-users" element={<AdminLabelEligibleUsers />} />
          <Route path="label/exceptional-requests" element={<AdminLabelExceptionalRequests />} />
          <Route path="devis" element={<AdminDemandesDevis />} />
          <Route path="devis/:id" element={<AdminDemandeDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Employer Routes with Sidebar */}
        <Route path="/employer" element={
          <PrivateRoute requiredRole="employer">
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<EmployerDashboard />} />
          <Route path="jobs" element={<EmployerJobs />} />
          <Route path="mes-missions" element={<EmployerMyJobs />} />
          <Route path=":denomination/myjob" element={<EmployerMyJobs />} />
          <Route path=":denomination/myjob/:missionSlug/demandes" element={<MissionDemandes />} />
          <Route path="publish-mission" element={<PublishMission />} />
          <Route path="publish-mission/forfait-heure" element={<PublishMissionHourly />} />
          <Route path="publish-mission/forfait-fixe" element={<PublishMissionFixed />} />
          <Route path="applications" element={<EmployerApplications />} />
          <Route path="list-freelancers" element={<FreelancerList />} />
          <Route path="list-freelancer/:username" element={<EmployerViewFreelancer />} />
          <Route path="list-employer" element={<EmployerList />} />
          <Route path="forfaits" element={<EmployerForfaits />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<EmployerProfile />} />
          <Route path="support" element={<Support />} />
          <Route path="support/:ticketId" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="messages" element={<Messaging />} />
          <Route path="mes-messages" element={<Messaging />} />
        </Route>

        {/* Freelancer Routes with Sidebar */}
        <Route path="/freelancer" element={
          <PrivateRoute requiredRole="freelancer">
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<FreelancerDashboard />} />
          <Route path="list-missions" element={<FreelancerMissions />} />
          <Route path="mes-missions" element={<FreelancerMesMissions />} />
          <Route path="my-jobs" element={<FreelancerMyJobs />} />
          <Route path="publish-mission" element={<FreelancerPublishMission />} />
          <Route path="publish-mission-hourly" element={<FreelancerPublishMissionHourly />} />
          <Route path="publish-mission-fixed" element={<FreelancerPublishMissionFixed />} />
          <Route path="my-published-jobs" element={<FreelancerMyPublishedJobs />} />
          <Route path="my-published-jobs/:missionSlug/applications" element={<MissionDemandes />} />
          <Route path="applications" element={<FreelancerApplications />} />
          <Route path="devis-disponibles" element={<FreelancerDevisDisponibles />} />
          <Route path="devis/:id" element={<FreelancerDemandeDetails />} />
          <Route path="evaluations" element={<FreelancerEvaluations />} />
          <Route path="list-employers" element={<EmployerList />} />
          <Route path="employers" element={<Navigate to="/freelancer/list-employers" replace />} />
          <Route path="verification" element={<VerificationIdentite />} />
          <Route path="verification/formulaire" element={<FormulaireVerificationMultiEtapes />} />
          <Route path="forfaits" element={<FreelancerForfaits />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<FreelancerProfile />} />
          <Route path="label" element={<LabelStatus />} />
          <Route path="label/eligibility" element={<LabelEligibility />} />
          <Route path="label/exceptional-request" element={<LabelExceptionalRequest />} />
          <Route path="list-freelancers" element={<FreelancerList />} />
          <Route path="list-freelancer/:username" element={<EmployerViewFreelancer />} />
          <Route path="support" element={<Support />} />
          <Route path="support/:ticketId" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="messages" element={<Messaging />} />
          <Route path="mes-messages" element={<Messaging />} />
        </Route>

        {/* Pages de paiement (accessible après authentification) */}
        <Route path="/payment/success" element={
          <PrivateRoute>
            <PaymentSuccess />
          </PrivateRoute>
        } />
        <Route path="/payment/cancel" element={
          <PrivateRoute>
            <PaymentCancel />
          </PrivateRoute>
        } />

        {/* Public Profile (accessible sans authentification) */}
        <Route path="/employer/profile/:identifier" element={<PublicProfile />} />
        <Route path="/freelancer/profile/:identifier" element={<PublicProfile />} />
        <Route path="/profile/:identifier" element={<PublicProfile />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppContent />
    </Router>
  )
}

export default App
