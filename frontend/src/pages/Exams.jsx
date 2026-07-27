import { useEffect, useState } from 'react'
import { Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Exams() {
  const [exams, setExams] = useState([])

  useEffect(() => {
    api.get('/exams').then((response) => setExams(response.data.data || []))
  }, [])

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>Exams</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow><TableCell>Exam</TableCell><TableCell>Type</TableCell><TableCell>Course</TableCell><TableCell>Subject</TableCell><TableCell>Status</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={`${exam.id}-${exam.subject_id || 'subject'}`}>
                  <TableCell>{exam.exam_name}</TableCell>
                  <TableCell>{exam.exam_type}</TableCell>
                  <TableCell>{exam.course_name}</TableCell>
                  <TableCell>{exam.subject_name}</TableCell>
                  <TableCell>{exam.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Layout>
  )
}
