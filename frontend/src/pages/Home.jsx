import { Box, Button, Chip, Container, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  ['Student Records', 'Manage student details, courses, roll numbers, and profile data easily.'],
  ['Marks Management', 'Enter internal, practical, and external marks to complete the result workflow.'],
  ['Result Reports', 'View published results, pass/fail summaries, and performance reports in one place.'],
]

const stats = [
  ['3 Roles', 'Admin, Teacher, Student'],
  ['Fast Workflow', 'Marks to result publication'],
  ['Smart Reports', 'Dashboard analytics'],
]

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef4ff' }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          color: 'white',
          background: 'linear-gradient(135deg, #172554 0%, #2563eb 52%, #06b6d4 100%)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.18,
            backgroundImage: 'radial-gradient(circle at 20% 20%, #ffffff 0 2px, transparent 2px)',
            backgroundSize: '34px 34px',
          }}
        />
        <Container sx={{ position: 'relative', py: { xs: 3, md: 4 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Typography variant="h5" fontWeight={800}>Student Result Management</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button component={Link} to="/" color="inherit">Home</Button>
              <Button component={Link} to={isAuthenticated ? '/dashboard' : '/login'} color="inherit">
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Button>
            </Stack>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
              gap: 4,
              alignItems: 'center',
              py: { xs: 7, md: 11 },
            }}
          >
            <Stack spacing={3}>
              <Chip label="Academic Management System" sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(255,255,255,0.18)', color: 'white', fontWeight: 700 }} />
              <Typography variant="h2" fontWeight={900} sx={{ fontSize: { xs: '2.4rem', md: '4.5rem' }, lineHeight: 1 }}>
                Manage student results with speed and accuracy.
              </Typography>
              <Typography sx={{ maxWidth: 680, color: 'rgba(255,255,255,0.86)', fontSize: '1.1rem', lineHeight: 1.8 }}>
                This portal helps admins, teachers, and students manage records, exams, marks entry, and published results based on their roles.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component={Link} to={isAuthenticated ? '/dashboard' : '/login'} variant="contained" size="large" sx={{ bgcolor: 'white', color: '#1d4ed8', '&:hover': { bgcolor: '#dbeafe' } }}>
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                </Button>
                <Button component={Link} to="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.75)', color: 'white' }}>
                  Demo Login
                </Button>
              </Stack>
            </Stack>

            <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5, bgcolor: 'rgba(255,255,255,0.96)' }}>
              <Stack spacing={2.5}>
                <Typography variant="h5" fontWeight={800} color="text.primary">Project Highlights</Typography>
                {stats.map(([value, label]) => (
                  <Box key={value} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: '#f8fafc' }}>
                    <Typography variant="h4" fontWeight={900} color="primary">{value}</Typography>
                    <Typography color="text.secondary">{label}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Container>
      </Box>

      <Container sx={{ py: { xs: 5, md: 7 } }}>
        <Stack spacing={4}>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={900}>Everything for result management</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Clean dashboard, role-based access, and a complete academic workflow.
            </Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            {features.map(([title, text]) => (
              <Paper key={title} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                <Typography variant="h6" fontWeight={800}>{title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>{text}</Typography>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Container>
    </Box>
  )
}
