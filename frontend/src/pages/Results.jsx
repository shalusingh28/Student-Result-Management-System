import { useEffect, useState } from 'react'
import { Button, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../services/api'

export default function Results() {
  const [results, setResults] = useState([])

  useEffect(() => {
    api.get('/results').then((response) => setResults(response.data.data || []))
  }, [])

  return (
    <Layout>
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={700}>Results</Typography>
        <Paper>
          <Table>
            <TableHead>
              <TableRow><TableCell>Student</TableCell><TableCell>Exam</TableCell><TableCell>%</TableCell><TableCell>Grade</TableCell><TableCell>Status</TableCell><TableCell>Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result.id}>
                  <TableCell>{result.student_name}</TableCell>
                  <TableCell>{result.exam_name}</TableCell>
                  <TableCell>{result.percentage}</TableCell>
                  <TableCell>{result.overall_grade}</TableCell>
                  <TableCell>{result.review_status}</TableCell>
                  <TableCell><Button component={Link} to={`/results/${result.id}`}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Layout>
  )
}
