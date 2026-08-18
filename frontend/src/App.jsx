import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { messageService } from './services/messageService';
import { useAuth } from './context/AuthContext'

// Pages
const Messaging = lazy(() => import('./pages/Messaging'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const RegisterFreelancer = lazy(() => import('./pages/RegisterFreelancer'))
const RegisterEmployer = lazy(() => import('./pages/RegisterEmployer'))
const AccountType = lazy(() => import('./pages/AccountType'))
const VerifyOTP = lazy(() => import('./pages/VerifyOTP'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const JobList = lazy(() => import('./pages/JobList'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const EmployerDashboard = lazy(() => import('./pages/EmployerDashboard'))
const FreelancerDashboard = lazy(() => import('./pages/FreelancerDashboard'))
const FreelancerProfile = lazy(() => import('./pages/FreelancerProfile'))
const FreelancerEvaluations = lazy(() => import('./pages/FreelancerEvaluations'))
const EmployerProfile = lazy(() => import('./pages/EmployerProfile'))
const FreelancerList = lazy(() => import('./pages/FreelancerList'))
const EmployerList = lazy(() => import('./pages/EmployerList'))
const Notifications = lazy(() => import('./pages/Notifications'))
const PublishMission = lazy(() => import('./pages/PublishMission'))
const Settings = lazy(() => import('./pages/Settings'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))
const AdminCreateUser = lazy(() => import('./pages/AdminCreateUser'))
const AdminJobs = lazy(() => import('./pages/AdminJobs'))
const AdminStats = lazy(() => import('./pages/AdminStats'))
const AdminSEO = lazy(() => import('./pages/AdminSEO'))
const AdminSecteurs = lazy(() => import('./pages/AdminSecteurs'))
const AdminCompetences = lazy(() => import('./pages/AdminCompetences'))
const AdminPublishMission = lazy(() => import('./pages/AdminPublishMission'))
const AdminLangues = lazy(() => import('./pages/AdminLangues'))
const AdminTypeFacturation = lazy(() => import('./pages/AdminTypeFacturation'))
const AdminTypeMission = lazy(() => import('./pages/AdminTypeMission'))
const AdminLieuMission = lazy(() => import('./pages/AdminLieuMission'))
const PublishMissionHourly = lazy(() => import('./pages/PublishMissionHourly'))
const PublishMissionFixed = lazy(() => import('./pages/PublishMissionFixed'))
const EmployerMyJobs = lazy(() => import('./pages/EmployerMyJobs'))
const EmployerJobs = lazy(() => import('./pages/EmployerJobs'))
const AdminSendNotification = lazy(() => import('./pages/AdminSendNotification'))
const AdminNewsletter = lazy(() => import('./pages/AdminNewsletter'))
const MissionDemandes = lazy(() => import('./pages/MissionDemandes'))
const VerificationIdentite = lazy(() => import('./pages/VerificationIdentite'))
const FormulaireVerificationMultiEtapes = lazy(() => import('./pages/FormulaireVerificationMultiEtapes'))
const AdminVerifications = lazy(() => import('./pages/AdminVerifications'))
const AdminVerificationBCE = lazy(() => import('./pages/AdminVerificationBCE'))
const AdminApplications = lazy(() => import('./pages/AdminApplications'))
const AdminForfaits = lazy(() => import('./pages/AdminForfaits'))
const AdminProfile = lazy(() => import('./pages/AdminProfile'))
const FreelancerForfaits = lazy(() => import('./pages/FreelancerForfaits'))
const FreelancerMissions = lazy(() => import('./pages/FreelancerMissions'))
const FreelancerMesMissions = lazy(() => import('./pages/FreelancerMesMissions'))
const FreelancerMyJobs = lazy(() => import('./pages/FreelancerMyJobs'))
const EmployerForfaits = lazy(() => import('./pages/EmployerForfaits'))
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'))
const PaymentCancel = lazy(() => import('./pages/PaymentCancel'))
const FreelancerPublicProfile = lazy(() => import('./pages/FreelancerPublicProfile'))
const EmployerPublicProfile = lazy(() => import('./pages/EmployerPublicProfile'))
const EmployerViewFreelancer = lazy(() => import('./pages/EmployerViewFreelancer'))
const EmployerApplications = lazy(() => import('./pages/EmployerApplications'))
const EmployerDemandesDevis = lazy(() => import('./pages/EmployerDemandesDevis'))
const EmployerDevisRecus = lazy(() => import('./pages/EmployerDevisRecus'))
const FreelancerApplications = lazy(() => import('./pages/FreelancerApplications'))
const DemandeDevis = lazy(() => import('./pages/DemandeDevis'))
const Particulier = lazy(() => import('./pages/Particulier'))
const AdminDevis = lazy(() => import('./pages/AdminDevis'))
const FreelancerDevisDisponibles = lazy(() => import('./pages/FreelancerDevisDisponibles'))
const DevisDetail = lazy(() => import('./pages/DevisDetail'))
const PublicDevis = lazy(() => import('./pages/PublicDevis'))
const PublicMissions = lazy(() => import('./pages/PublicMissions'))
const AdminFactures = lazy(() => import('./pages/AdminFactures'))
const MesFactures = lazy(() => import('./pages/MesFactures'))
const FreelancerDevisEnvoyes = lazy(() => import('./pages/FreelancerDevisEnvoyes'))
const AvisParticulier = lazy(() => import('./pages/AvisParticulier'))
const AdminAvis = lazy(() => import('./pages/AdminAvis'))
const AdminAvisMissions = lazy(() => import('./pages/AdminAvisMissions'))
const FreelancerEvaluationsParticulier = lazy(() => import('./pages/FreelancerEvaluationsParticulier'))
const Support = lazy(() => import('./pages/Support'))

// Components
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Preloader from './components/Preloader'
import DashboardLayout from './layouts/DashboardLayout'

function AppContent() {
  const { user } = useAuth()
  const location = useLocation()
  const isDashboardRoute = location.pathname.startsWith('/employer/') || location.pathname.startsWith('/freelancer/') || location.pathname.startsWith('/admin/')
  const hideNavbar = ['/login', '/register', '/account-type', '/verify-otp', '/forgot-password', '/particulier'].includes(location.pathname) 
    || location.pathname.startsWith('/register-freelancer') 
    || location.pathname.startsWith('/register-employer')
    || location.pathname.startsWith('/profile')
    || isDashboardRoute

  return (
    <div className="min-h-screen bg-gray-50">
      <Preloader />
      {!hideNavbar && <Navbar />}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #e2e8f0',
              boxShadow: '0 18px 45px rgba(8, 33, 81, 0.12)',
              fontWeight: 700,
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#2A4DEF',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Suspense fallback={<div className="min-h-[45vh] bg-[#f5f8ff]" />}>
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
          <Route path="/particulier" element={<Particulier />} />
          <Route path="/avis-particulier" element={<AvisParticulier />} />
          <Route path="/demande-devis" element={<DemandeDevis />} />
          <Route path="/devis" element={<PublicDevis />} />
          <Route path="/devis/:id" element={<DevisDetail />} />
          <Route path="/missions" element={<PublicMissions />} />
          <Route path="/missions/:type/:id" element={<PublicMissions />} />
          
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
          <Route element={<DashboardLayout />}>
            <Route path="/freelancer/public-profile/:username" element={<FreelancerPublicProfile />} />
            <Route path="/employer/public-profile/:companyName" element={<EmployerPublicProfile />} />
          </Route>
          
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
            <Route path="jobs" element={<AdminJobs />} />
            <Route path="applications" element={<AdminApplications />} />
            <Route path="devis" element={<AdminDevis />} />
            <Route path="factures" element={<AdminFactures />} />
            <Route path="avis-prestataires" element={<AdminAvis />} />
            <Route path="avis-missions" element={<AdminAvisMissions />} />
            <Route path="stats" element={<AdminStats />} />
            <Route path="seo" element={<AdminSEO />} />
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
            <Route path="verification-bce" element={<AdminVerificationBCE />} />
            <Route path="forfaits" element={<AdminForfaits />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="send-notification" element={<AdminSendNotification />} />
          <Route path="newsletter" element={<AdminNewsletter />} />
            <Route path="support" element={<Support />} />
            <Route path="support/create" element={<Support createMode />} />
            <Route path="profile" element={<AdminProfile />} />
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
            <Route path="demandes-devis" element={<EmployerDemandesDevis />} />
            <Route path="devis-recus" element={<EmployerDevisRecus />} />
            <Route path="list-freelancers" element={<FreelancerList />} />
            <Route path="list-freelancer/:username" element={<EmployerViewFreelancer />} />
            <Route path="list-employer" element={<EmployerList />} />
            <Route path="forfaits" element={<EmployerForfaits />} />
            <Route path="factures" element={<MesFactures />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<Support />} />
            <Route path="support/create" element={<Support createMode />} />
            <Route path="profile" element={<EmployerProfile />} />
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
            <Route path="applications" element={<FreelancerApplications />} />
            <Route path="devis-disponibles" element={<FreelancerDevisDisponibles />} />
            <Route path="devis-envoyes" element={<FreelancerDevisEnvoyes />} />
            <Route path="devis-ia" element={<FreelancerDevisEnvoyes onlyAi />} />
            <Route path="evaluations" element={<FreelancerEvaluations />} />
            <Route path="evaluations-particulier" element={<FreelancerEvaluationsParticulier />} />
            <Route path="list-employers" element={<EmployerList />} />
            <Route path="employers" element={<Navigate to="/freelancer/list-employers" replace />} />
            <Route path="verification" element={<VerificationIdentite />} />
            <Route path="verification/formulaire" element={<FormulaireVerificationMultiEtapes />} />
            <Route path="forfaits" element={<FreelancerForfaits />} />
            <Route path="factures" element={<MesFactures />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<Support />} />
            <Route path="support/create" element={<Support createMode />} />
            <Route path="profile" element={<FreelancerProfile />} />
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
          <Route element={<DashboardLayout />}>
            <Route path="/employer/profile/:identifier" element={<PublicProfile />} />
            <Route path="/freelancer/profile/:identifier" element={<PublicProfile />} />
            <Route path="/profile/:identifier" element={<PublicProfile />} />
          </Route>
          
          {/* 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </Suspense>
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
