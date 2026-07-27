import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const demoAccounts = [
  { label: 'Admin', identifier: 'admin', password: 'Admin@123' },
  { label: 'Teacher', identifier: 'amit_teacher', password: 'Teacher@123' },
  { label: 'Student', identifier: 'aarav101', password: 'Student@123' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('admin')
  const [password, setPassword] = useState('Admin@123')
  const [loginInfo, setLoginInfo] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fillDemoAccount = (account) => {
    setIdentifier(account.identifier)
    setPassword(account.password)
    setError('')
    setLoginInfo(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoginInfo(null)
    setLoading(true)

    try {
      const auth = await login(identifier.trim(), password)
      setLoginInfo(auth)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check that the backend is running and the credentials are correct.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#f4f6f8', p: 2 }}>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460 }}>
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight={700}>Login</Typography>
            <Typography color="text.secondary">Select your role and log in with a valid username and password.</Typography>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}
          {loginInfo && (
            <Alert severity="success">
              Login successful. Role: <strong>{loginInfo.role}</strong>
            </Alert>
          )}

          <TextField
            label="Any Username"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            fullWidth
            required
          />

          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Demo Login Accounts
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1 }}>
              {demoAccounts.map((account) => (
                <Button
                  key={account.label}
                  type="button"
                  variant="outlined"
                  size="small"
                  onClick={() => fillDemoAccount(account)}
                  sx={{ textTransform: 'none', whiteSpace: 'normal', lineHeight: 1.2, minHeight: 48 }}
                >
                  {account.label}<br />{account.identifier}
                </Button>
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Admin: Admin@123 · Teacher: Teacher@123 · Student: Student@123
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  )
}
