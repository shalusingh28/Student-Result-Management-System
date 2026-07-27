import { useEffect, useState } from 'react'
import { Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Students() {
  const [students, setStudents] = useState([])

  useEffect(() => {
    api.get('/students').then((response) => setStudents(response.data.data || []))
  }, [])

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>Students</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow><TableCell>Name</TableCell><TableCell>Roll No</TableCell><TableCell>Course</TableCell><TableCell>Fees</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.roll_no}</TableCell>
                  <TableCell>{student.course_name}</TableCell>
                  <TableCell>{student.fees_status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Layout>
  )
}
