import { BrowserRouter } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import { AuthProvider } from './context/AuthContext'
import AppRoutes from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CssBaseline />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
