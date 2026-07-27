import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { jsPDF } from 'jspdf'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const demoResults = [
  {
    id: 1,
    exam_id: 4,
    exam_name: 'Class 10 Final Exam',
    total_marks: 438,
    maximum_marks: 500,
    percentage: 87.6,
    gpa: 8.76,
    cgpa: 8.76,
    overall_grade: 'A',
    final_result: 'Pass',
  },
]

const demoMarksheet = {
  result: {
    student_name: 'Aarav Sharma',
    roll_no: 'R-101',
    course_name: 'Class 10',
    department_name: 'General Studies',
    semester_name: 'Semester 1',
    exam_name: 'Class 10 Final Exam',
    academic_year: '2026',
    total_marks: 438,
    maximum_marks: 500,
    percentage: 87.6,
    gpa: 8.76,
    cgpa: 8.76,
    final_result: 'Pass',
  },
  marks: [
    { subject_name: 'English', internal_marks: 18, practical_marks: 9, external_marks: 58, total_marks: 85, grade: 'A' },
    { subject_name: 'Math', internal_marks: 19, practical_marks: 10, external_marks: 61, total_marks: 90, grade: 'A+' },
    { subject_name: 'Science', internal_marks: 18, practical_marks: 10, external_marks: 57, total_marks: 85, grade: 'A' },
    { subject_name: 'Social Studies', internal_marks: 17, practical_marks: 9, external_marks: 55, total_marks: 81, grade: 'A' },
    { subject_name: 'Computer', internal_marks: 19, practical_marks: 10, external_marks: 64, total_marks: 93, grade: 'A+' },
  ],
}

const display = (value) => value ?? '-'

const institution = {
  name: 'Student Result Management Institute',
  address: 'Main Campus, Academic Road, India',
  logoText: 'SRM',
  signature: 'Controller of Examination',
}

const buildVerificationNumber = (result) => {
  const studentPart = String(result?.roll_no || 'STUDENT').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  const examPart = String(result?.exam_id || result?.id || 'EXAM').replace(/[^A-Z0-9]/gi, '').toUpperCase()
  return `VR-${studentPart}-${examPart}-${new Date().getFullYear()}`
}

const drawText = (doc, label, value, x, y) => {
  doc.setFont('helvetica', 'bold')
  doc.text(`${label}:`, x, y)
  doc.setFont('helvetica', 'normal')
  doc.text(String(display(value)), x + 34, y)
}

const downloadMarksheetPdf = (result, marks) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const verificationNumber = buildVerificationNumber(result)

  doc.setDrawColor(29, 78, 216)
  doc.setLineWidth(1.2)
  doc.rect(10, 10, pageWidth - 20, 277)

  doc.setFillColor(29, 78, 216)
  doc.circle(25, 25, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(institution.logoText, 25, 28, { align: 'center' })

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.text(institution.name, pageWidth / 2, 22, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(institution.address, pageWidth / 2, 29, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('OFFICIAL MARKSHEET', pageWidth / 2, 39, { align: 'center' })
  doc.line(15, 44, pageWidth - 15, 44)

  doc.setFontSize(10)
  drawText(doc, 'Student Name', result.student_name, 16, 56)
  drawText(doc, 'Roll Number', result.roll_no, 112, 56)
  drawText(doc, 'Course', result.course_name, 16, 66)
  drawText(doc, 'Department', result.department_name, 112, 66)
  drawText(doc, 'Semester', result.semester_name, 16, 76)
  drawText(doc, 'Exam', result.exam_name, 112, 76)
  drawText(doc, 'Academic Year', result.academic_year, 16, 86)
  drawText(doc, 'Verification No', verificationNumber, 112, 86)

  const tableTop = 100
  const columns = [16, 78, 102, 126, 150, 174]
  doc.setFillColor(229, 231, 235)
  doc.rect(15, tableTop - 7, pageWidth - 30, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.text('Subject', columns[0], tableTop)
  doc.text('Internal', columns[1], tableTop)
  doc.text('Practical', columns[2], tableTop)
  doc.text('External', columns[3], tableTop)
  doc.text('Total', columns[4], tableTop)
  doc.text('Grade', columns[5], tableTop)

  doc.setFont('helvetica', 'normal')
  let y = tableTop + 10
  marks.forEach((mark, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, y - 7, pageWidth - 30, 9, 'F')
    }
    doc.text(String(display(mark.subject_name)), columns[0], y)
    doc.text(String(display(mark.internal_marks)), columns[1], y)
    doc.text(String(display(mark.practical_marks)), columns[2], y)
    doc.text(String(display(mark.external_marks)), columns[3], y)
    doc.text(String(display(mark.total_marks)), columns[4], y)
    doc.text(String(display(mark.grade)), columns[5], y)
    y += 9
  })

  const summaryTop = Math.max(y + 12, 170)
  doc.line(15, summaryTop - 7, pageWidth - 15, summaryTop - 7)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Final Result Summary', 16, summaryTop)
  doc.setFontSize(10)
  drawText(doc, 'Total Marks', `${display(result.total_marks)}/${display(result.maximum_marks)}`, 16, summaryTop + 12)
  drawText(doc, 'Percentage', `${display(result.percentage)}%`, 112, summaryTop + 12)
  drawText(doc, 'Grade', result.overall_grade, 16, summaryTop + 22)
  drawText(doc, 'Result', result.final_result, 112, summaryTop + 22)
  drawText(doc, 'GPA', result.gpa, 16, summaryTop + 32)
  drawText(doc, 'CGPA', result.cgpa, 112, summaryTop + 32)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('This marksheet is computer generated and valid with the verification number above.', 16, 252)
  doc.line(140, 258, 190, 258)
  doc.setFont('helvetica', 'bold')
  doc.text(institution.signature, 165, 265, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Verification Number: ${verificationNumber}`, 16, 278)

  const fileName = `marksheet-${String(result.roll_no || 'student').toLowerCase()}-${String(result.exam_name || 'exam').toLowerCase().replace(/\s+/g, '-')}.pdf`
  doc.save(fileName)
}

export default function MyResult() {
  const { token } = useAuth()
  const [results, setResults] = useState([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [marksheet, setMarksheet] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const loadResults = async () => {
      setError('')

      if (token === 'demo-local-token') {
        setResults(demoResults)
        setSelectedExamId(String(demoResults[0].exam_id))
        return
      }

      try {
        const response = await api.get('/me/results')
        const nextResults = response.data.data || []
        setResults(nextResults)
        if (nextResults.length) setSelectedExamId(String(nextResults[0].exam_id))
      } catch (err) {
        setResults(demoResults)
        setSelectedExamId(String(demoResults[0].exam_id))
        setError(err.response?.data?.message || 'The result could not be loaded from the backend, so a demo result is being shown.')
      }
    }

    loadResults()
  }, [token])

  useEffect(() => {
    if (!selectedExamId) return

    const loadMarksheet = async () => {
      setLoading(true)
      setError('')

      if (token === 'demo-local-token') {
        setMarksheet(demoMarksheet)
        setLoading(false)
        return
      }

      try {
        const response = await api.get(`/me/marksheet/${selectedExamId}`)
        setMarksheet(response.data.data)
      } catch (err) {
        setMarksheet(demoMarksheet)
        setError(err.response?.data?.message || 'The marksheet could not be loaded from the backend, so a demo marksheet is being shown.')
      } finally {
        setLoading(false)
      }
    }

    loadMarksheet()
  }, [refreshKey, selectedExamId, token])

  const result = marksheet?.result
  const marks = marksheet?.marks || []

  const examOptions = useMemo(() => {
    return results.map((item) => ({
      value: String(item.exam_id),
      label: item.exam_name || `Exam ${item.exam_id}`,
    }))
  }, [results])

  return (
    <Layout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>My Result</Typography>
          <Typography color="text.secondary">Select an exam to view your complete result.</Typography>
        </Box>

        {error && <Alert severity="warning">{error}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <FormControl fullWidth>
              <InputLabel id="exam-select-label">Select Exam</InputLabel>
              <Select
                labelId="exam-select-label"
                label="Select Exam"
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
              >
                {examOptions.map((exam) => (
                  <MenuItem key={exam.value} value={exam.value}>{exam.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!selectedExamId || loading} onClick={() => setRefreshKey((value) => value + 1)} sx={{ minWidth: 140 }}>
              {loading ? 'Loading...' : 'View Result'}
            </Button>
          </Stack>
        </Paper>

        {!loading && !result && (
          <Alert severity="info">No published result is available yet.</Alert>
        )}

        {result && (
          <>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Student Result Page</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
                <Typography><strong>Student Name:</strong> {display(result.student_name)}</Typography>
                <Typography><strong>Roll Number:</strong> {display(result.roll_no)}</Typography>
                <Typography><strong>Course:</strong> {display(result.course_name)}</Typography>
                <Typography><strong>Department:</strong> {display(result.department_name)}</Typography>
                <Typography><strong>Semester:</strong> {display(result.semester_name)}</Typography>
                <Typography><strong>Exam:</strong> {display(result.exam_name)}</Typography>
                <Typography><strong>Academic Year:</strong> {display(result.academic_year)}</Typography>
              </Box>
            </Paper>

            <Paper sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject</TableCell>
                    <TableCell>Internal</TableCell>
                    <TableCell>Practical</TableCell>
                    <TableCell>External</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Grade</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marks.map((mark) => (
                    <TableRow key={`${mark.subject_name}-${mark.id || mark.subject_id}`}>
                      <TableCell>{display(mark.subject_name)}</TableCell>
                      <TableCell>{display(mark.internal_marks)}</TableCell>
                      <TableCell>{display(mark.practical_marks)}</TableCell>
                      <TableCell>{display(mark.external_marks)}</TableCell>
                      <TableCell>{display(mark.total_marks)}</TableCell>
                      <TableCell>{display(mark.grade)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>Final Summary</Typography>
                <Button variant="contained" color="success" onClick={() => downloadMarksheetPdf(result, marks)}>
                  Download Marksheet
                </Button>
              </Stack>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }, gap: 2 }}>
                <Typography><strong>Total Marks:</strong> {display(result.total_marks)}/{display(result.maximum_marks)}</Typography>
                <Typography><strong>Percentage:</strong> {display(result.percentage)}%</Typography>
                <Typography><strong>GPA:</strong> {display(result.gpa)}</Typography>
                <Typography><strong>CGPA:</strong> {display(result.cgpa)}</Typography>
                <Typography><strong>Final Result:</strong> {display(result.final_result)}</Typography>
              </Box>
            </Paper>
          </>
        )}
      </Stack>
    </Layout>
  )
}
