import { useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

const initialForm = {
  student_id: '',
  exam_id: '',
  subject_id: '',
  internal_marks: 20,
  practical_marks: 20,
  external_marks: 50,
}

export default function MarksEntry() {
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    try {
      const response = await api.post('/marks', form)
      setMessage(`Marks saved. Total Marks = ${response.data.data.total_marks}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Marks entry failed')
    }
  }

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>Marks Entry</Typography>
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {Object.keys(initialForm).map((field) => (
              <TextField key={field} name={field} label={field.replaceAll('_', ' ')} value={form[field]} onChange={handleChange} fullWidth />
            ))}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Button type="submit" variant="contained">Save Marks</Button>
            </Box>
          </Box>
        </Paper>
        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
    </Layout>
  )
}
