import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Exams from '../pages/Exams'
import Login from '../pages/Login'
import MarksEntry from '../pages/MarksEntry'
import MyResult from '../pages/MyResult'
import AdminReports from '../pages/AdminReports'
import ResultDetails from '../pages/ResultDetails'
import Results from '../pages/Results'
import Students from '../pages/Students'
import TeacherAttendance from '../pages/TeacherAttendance'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/exams" element={<ProtectedRoute><Exams /></ProtectedRoute>} />
      <Route path="/marks-entry" element={<ProtectedRoute><MarksEntry /></ProtectedRoute>} />
      <Route path="/teacher-attendance" element={<ProtectedRoute><TeacherAttendance /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><AdminReports /></ProtectedRoute>} />
      <Route path="/my-result" element={<ProtectedRoute><MyResult /></ProtectedRoute>} />
      <Route path="/results/:id" element={<ProtectedRoute><ResultDetails /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
