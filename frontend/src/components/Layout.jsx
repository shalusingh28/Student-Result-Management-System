import { AppBar, Box, Button, Container, Toolbar, Typography } from '@mui/material'
import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Students', path: '/students' },
  { label: 'Exams', path: '/exams' },
  { label: 'Marks Entry', path: '/marks-entry' },
  { label: 'Results', path: '/results' },
  { label: 'Reports', path: '/reports' },
]

const teacherNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Marks Entry', path: '/marks-entry' },
  { label: 'Attendance', path: '/teacher-attendance' },
]

const studentNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'My Result', path: '/my-result' },
]

export default function Layout({ children }) {
  const { logout, role, user } = useAuth()
  const navItems = role === 'STUDENT' ? studentNavItems : role === 'TEACHER' ? teacherNavItems : adminNavItems

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Student Result Management
          </Typography>
          {navItems.map((item) => (
            <Button key={item.path} color="inherit" component={Link} to={item.path}>
              {item.label}
            </Button>
          ))}
          <Typography variant="body2">{user?.name}</Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ py: 4 }}>
        {children || <Outlet />}
      </Container>
    </Box>
  )
}
