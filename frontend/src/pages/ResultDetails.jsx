import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../services/api'

export default function ResultDetails() {
  const { id } = useParams()
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')

  const loadResult = useCallback(() => {
    api.get(`/results/${id}`).then((response) => setResult(response.data.data))
  }, [id])

  useEffect(() => {
    loadResult()
  }, [loadResult])

  const review = async () => {
    await api.patch(`/results/${id}/review`, { reviewStatus: 'Approved', reviewNotes: 'Verified from frontend.' })
    setMessage('Result approved successfully.')
    loadResult()
  }

  const publish = async () => {
    await api.patch(`/results/${id}/publish`)
    setMessage('Result published successfully.')
    loadResult()
  }

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>Result Details</Typography>
        {message && <Alert severity="success">{message}</Alert>}
        {result && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={1}>
              <Typography><strong>Student:</strong> {result.student_name}</Typography>
              <Typography><strong>Exam:</strong> {result.exam_name}</Typography>
              <Typography><strong>Total:</strong> {result.total_marks}/{result.maximum_marks}</Typography>
              <Typography><strong>Percentage:</strong> {result.percentage}%</Typography>
              <Typography><strong>Grade:</strong> {result.overall_grade}</Typography>
              <Typography><strong>Final Result:</strong> {result.final_result}</Typography>
              <Typography><strong>Review Status:</strong> {result.review_status}</Typography>
              <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                <Button variant="outlined" onClick={review}>Approve</Button>
                <Button variant="contained" onClick={publish}>Publish</Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Layout>
  )
}
