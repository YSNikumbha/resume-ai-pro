import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AuthProvider from './context/AuthProvider'
import CreateJobMatch from './pages/CreateJobMatch'
import Dashboard from './pages/Dashboard'
import JobMatchDetails from './pages/JobMatchDetails'
import JobMatchHistory from './pages/JobMatchHistory'
import Landing from './pages/Landing'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import ResumeAnalysis from './pages/ResumeAnalysis'
import Register from './pages/Register'
import ResumeChat from './pages/ResumeChat'
import ResumeDetails from './pages/ResumeDetails'
import ResumeHistory from './pages/ResumeHistory'
import UploadResume from './pages/UploadResume'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes/upload"
            element={
              <ProtectedRoute>
                <UploadResume />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes"
            element={
              <ProtectedRoute>
                <ResumeHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes/:resumeId/chat"
            element={
              <ProtectedRoute>
                <ResumeChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resumes/:id"
            element={
              <ProtectedRoute>
                <ResumeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyses/:analysisId"
            element={
              <ProtectedRoute>
                <ResumeAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matches/new"
            element={
              <ProtectedRoute>
                <CreateJobMatch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matches"
            element={
              <ProtectedRoute>
                <JobMatchHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/job-matches/:id"
            element={
              <ProtectedRoute>
                <JobMatchDetails />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
