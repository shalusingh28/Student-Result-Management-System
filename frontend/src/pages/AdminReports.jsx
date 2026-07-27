import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

const primaryBar = '#1D4ED8'

const reportConfigs = {
  'student-results': {
    title: 'Student Result Report',
    endpoint: '/reports/student-results',
    chartLabel: 'Result Percentage',
    chartValue: 'percentage',
    chartName: 'student_name',
    columns: [
      ['student_name', 'Student'], ['roll_no', 'Roll No'], ['course_name', 'Course'], ['class_name', 'Class'],
      ['semester_name', 'Semester'], ['exam_name', 'Exam'], ['academic_year', 'Academic Year'],
      ['total_marks', 'Total'], ['maximum_marks', 'Max'], ['percentage', '%'], ['gpa', 'GPA'], ['cgpa', 'CGPA'],
      ['overall_grade', 'Grade'], ['final_result', 'Result'], ['review_status', 'Status'],
    ],
  },
  semester: {
    title: 'Semester Report',
    endpoint: '/reports/semester',
    chartLabel: 'Average Percentage',
    chartValue: 'average_percentage',
    chartName: 'semester_name',
    columns: [
      ['academic_year', 'Academic Year'], ['semester_name', 'Semester'], ['course_name', 'Course'],
      ['total_results', 'Total Results'], ['pass_count', 'Pass'], ['fail_count', 'Fail'],
      ['pass_percentage', 'Pass %'], ['fail_percentage', 'Fail %'], ['average_percentage', 'Average %'],
      ['highest_percentage', 'Highest %'], ['lowest_percentage', 'Lowest %'],
    ],
  },
  'course-performance': {
    title: 'Course Performance',
    endpoint: '/reports/course-performance',
    chartLabel: 'Average Percentage',
    chartValue: 'average_percentage',
    chartName: 'course_name',
    columns: [
      ['course_name', 'Course'], ['course_code', 'Code'], ['total_students', 'Students'], ['total_results', 'Results'],
      ['average_percentage', 'Average %'], ['pass_count', 'Pass'], ['fail_count', 'Fail'],
      ['pass_percentage', 'Pass %'], ['topper_name', 'Topper'], ['topper_percentage', 'Topper %'],
    ],
  },
  'subject-performance': {
    title: 'Subject Performance',
    endpoint: '/reports/subject-performance',
    chartLabel: 'Average Subject Percentage',
    chartValue: 'average_subject_percentage',
    chartName: 'subject_name',
    columns: [
      ['subject_name', 'Subject'], ['subject_code', 'Code'], ['course_name', 'Course'], ['exam_name', 'Exam'],
      ['total_students', 'Students'], ['average_marks', 'Average Marks'], ['max_marks', 'Max Marks'],
      ['passing_marks', 'Passing Marks'], ['pass_count', 'Pass'], ['fail_count', 'Fail'],
      ['pass_percentage', 'Pass %'], ['average_subject_percentage', 'Average %'],
    ],
  },
  'pass-fail': {
    title: 'Pass/Fail Report',
    endpoint: '/reports/pass-fail',
    chartLabel: 'Pass Percentage',
    chartValue: 'pass_percentage',
    chartName: 'label',
    columns: [
      ['label', 'Group'], ['total_results', 'Total Results'], ['pass_count', 'Pass'], ['fail_count', 'Fail'],
      ['pass_percentage', 'Pass %'], ['fail_percentage', 'Fail %'],
    ],
  },
  toppers: {
    title: 'Topper Report',
    endpoint: '/reports/toppers',
    chartLabel: 'Percentage',
    chartValue: 'percentage',
    chartName: 'student_name',
    columns: [
      ['rank', 'Rank'], ['student_name', 'Student'], ['roll_no', 'Roll No'], ['course_name', 'Course'],
      ['exam_name', 'Exam'], ['semester_name', 'Semester'], ['percentage', '%'], ['total_marks', 'Total'],
      ['maximum_marks', 'Max'], ['overall_grade', 'Grade'],
    ],
  },
  attendance: {
    title: 'Attendance Report',
    endpoint: '/reports/attendance',
    chartLabel: 'Attendance Percentage',
    chartValue: 'attendance_percentage',
    chartName: 'student_name',
    columns: [
      ['student_name', 'Student'], ['roll_no', 'Roll No'], ['course_name', 'Course'], ['subject_name', 'Subject'],
      ['semester_name', 'Semester'], ['academic_year', 'Academic Year'], ['present_classes', 'Present'],
      ['absent_classes', 'Absent'], ['late_classes', 'Late'], ['leave_classes', 'Leave'],
      ['total_classes', 'Total'], ['attendance_percentage', 'Attendance %'], ['is_low_attendance', 'Warning'],
    ],
  },
}

const reviewStatuses = ['Published', 'Approved', 'Calculated', 'Under Review', 'Rejected', 'all']
const finalResults = ['', 'Pass', 'Fail']

const cleanParams = (params) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined))
const formatValue = (value) => value === null || value === undefined || value === '' ? '-' : value

function StatusChip({ value }) {
  if (value === true || value === 1) return <Chip label="Low" color="warning" size="small" />
  if (value === false || value === 0) return <Chip label="OK" color="success" size="small" />
  if (value === 'Pass' || value === 'Published' || value === 'Approved') return <Chip label={value} color="success" size="small" />
  if (value === 'Fail' || value === 'Rejected') return <Chip label={value} color="error" size="small" />
  if (String(value || '').includes('Review')) return <Chip label={value} color="warning" size="small" />
  return <Chip label={formatValue(value)} size="small" />
}

function ReportBarChart({ title, rows, nameKey, valueKey }) {
  const visibleRows = rows.slice(0, 10)
  const maxValue = Math.max(...visibleRows.map((row) => Number(row[valueKey]) || 0), 1)

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        {visibleRows.length === 0 && <Typography color="text.secondary">No data available</Typography>}
        {visibleRows.map((row, index) => {
          const value = Number(row[valueKey]) || 0
          const label = row[nameKey] || `Item ${index + 1}`
          return (
            <Box key={`${label}-${index}`}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" color="text.secondary">{value.toFixed(2)}%</Typography>
              </Stack>
              <Tooltip title={`${label}: ${value.toFixed(2)}%`}>
                <Box sx={{ mt: 0.75, height: 12, bgcolor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.max(4, (value / maxValue) * 100)}%`, height: '100%', bgcolor: primaryBar, borderRadius: 999 }} />
                </Box>
              </Tooltip>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

function ReportTable({ columns, rows }) {
  return (
    <Paper sx={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(([, label]) => <TableCell key={label}>{label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length}>No data available</TableCell>
            </TableRow>
          )}
          {rows.map((row, index) => (
            <TableRow key={row.id || `${row.student_id || row.label || 'row'}-${index}`}>
              {columns.map(([key]) => (
                <TableCell key={key}>
                  {['final_result', 'review_status', 'is_low_attendance'].includes(key) ? <StatusChip value={row[key]} /> : formatValue(row[key])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  )
}

function downloadCsv(fileName, rows) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [selectedReport, setSelectedReport] = useState('student-results')
  const [filters, setFilters] = useState({ reviewStatus: 'Published', finalResult: '', courseId: '', subjectId: '', examId: '', semesterId: '', academicYearId: '', fromDate: '', toDate: '', limit: 10 })
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [extraTables, setExtraTables] = useState([])
  const [options, setOptions] = useState({ courses: [], subjects: [], exams: [], semesters: [], academicYears: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const config = reportConfigs[selectedReport]

  useEffect(() => {
    const loadOptions = async () => {
      const requests = [
        ['courses', api.get('/courses')],
        ['subjects', api.get('/subjects')],
        ['exams', api.get('/exams')],
        ['semesters', api.get('/semesters')],
        ['academicYears', api.get('/academic-years')],
      ]
      const responses = await Promise.allSettled(requests.map(([, request]) => request))
      const nextOptions = { courses: [], subjects: [], exams: [], semesters: [], academicYears: [] }
      responses.forEach((response, index) => {
        if (response.status === 'fulfilled') nextOptions[requests[index][0]] = response.value.data.data || []
      })
      setOptions(nextOptions)
    }

    loadOptions()
  }, [])

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true)
      setError('')
      setSummary(null)
      setExtraTables([])

      try {
        const response = await api.get(config.endpoint, { params: cleanParams(filters) })
        const data = response.data.data
        if (selectedReport === 'pass-fail') {
          setSummary(data.summary || null)
          setRows(data.byCourse || [])
          setExtraTables([
            { title: 'By Semester', rows: data.bySemester || [] },
            { title: 'By Exam', rows: data.byExam || [] },
          ])
        } else {
          setRows(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        setRows([])
        setError(err.response?.data?.message || 'Report load nahi ho pa raha. Backend check karein.')
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [config.endpoint, filters, selectedReport])

  const kpis = useMemo(() => {
    if (summary) {
      return [
        ['Total Results', summary.total_results || 0],
        ['Pass', summary.pass_count || 0],
        ['Fail', summary.fail_count || 0],
        ['Pass %', `${Number(summary.pass_percentage || 0).toFixed(2)}%`],
      ]
    }

    const average = rows.length ? rows.reduce((sum, row) => sum + Number(row[config.chartValue] || 0), 0) / rows.length : 0
    return [
      ['Report Rows', rows.length],
      ['Average', `${average.toFixed(2)}%`],
      ['Report', config.title],
      ['CSV Export', rows.length ? 'Ready' : 'No Data'],
    ]
  }, [config, rows, summary])

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))

  return (
    <Layout>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Reports & Analytics</Typography>
            <Typography color="text.secondary">Admin reports generate karein, analytics dekhein aur CSV download karein.</Typography>
          </Box>
          <Button variant="contained" onClick={() => downloadCsv(`${selectedReport}-report.csv`, rows)} disabled={!rows.length}>Download CSV</Button>
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="report-select-label">Report Type</InputLabel>
              <Select labelId="report-select-label" label="Report Type" value={selectedReport} onChange={(event) => setSelectedReport(event.target.value)}>
                {Object.entries(reportConfigs).map(([key, report]) => <MenuItem key={key} value={key}>{report.title}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="course-filter-label">Course</InputLabel>
              <Select labelId="course-filter-label" label="Course" value={filters.courseId} onChange={(event) => updateFilter('courseId', event.target.value)}>
                <MenuItem value="">All Courses</MenuItem>
                {options.courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="subject-filter-label">Subject</InputLabel>
              <Select labelId="subject-filter-label" label="Subject" value={filters.subjectId} onChange={(event) => updateFilter('subjectId', event.target.value)}>
                <MenuItem value="">All Subjects</MenuItem>
                {options.subjects.map((subject) => <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="exam-filter-label">Exam</InputLabel>
              <Select labelId="exam-filter-label" label="Exam" value={filters.examId} onChange={(event) => updateFilter('examId', event.target.value)}>
                <MenuItem value="">All Exams</MenuItem>
                {options.exams.map((exam) => <MenuItem key={exam.id} value={exam.id}>{exam.exam_name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="semester-filter-label">Semester</InputLabel>
              <Select labelId="semester-filter-label" label="Semester" value={filters.semesterId} onChange={(event) => updateFilter('semesterId', event.target.value)}>
                <MenuItem value="">All Semesters</MenuItem>
                {options.semesters.map((semester) => <MenuItem key={semester.id} value={semester.id}>{semester.semester_name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="year-filter-label">Academic Year</InputLabel>
              <Select labelId="year-filter-label" label="Academic Year" value={filters.academicYearId} onChange={(event) => updateFilter('academicYearId', event.target.value)}>
                <MenuItem value="">All Years</MenuItem>
                {options.academicYears.map((year) => <MenuItem key={year.id} value={year.id}>{year.year_name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="review-filter-label">Review Status</InputLabel>
              <Select labelId="review-filter-label" label="Review Status" value={filters.reviewStatus} onChange={(event) => updateFilter('reviewStatus', event.target.value)}>
                {reviewStatuses.map((status) => <MenuItem key={status} value={status}>{status === 'all' ? 'All Statuses' : status}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="result-filter-label">Final Result</InputLabel>
              <Select labelId="result-filter-label" label="Final Result" value={filters.finalResult} onChange={(event) => updateFilter('finalResult', event.target.value)}>
                {finalResults.map((result) => <MenuItem key={result || 'all'} value={result}>{result || 'All Results'}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="From Date" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="To Date" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Topper Limit" type="number" value={filters.limit} onChange={(event) => updateFilter('limit', event.target.value)} fullWidth />
          </Box>
        </Paper>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
          {kpis.map(([label, value]) => (
            <Paper key={label} sx={{ p: 2.5 }}>
              <Typography color="text.secondary" variant="body2">{label}</Typography>
              <Typography variant="h5" fontWeight={800}>{value}</Typography>
            </Paper>
          ))}
        </Box>

        {loading && <Alert severity="info">Loading report...</Alert>}

        <ReportBarChart title={config.chartLabel} rows={rows} nameKey={config.chartName} valueKey={config.chartValue} />
        <ReportTable columns={config.columns} rows={rows} />

        {extraTables.map((table) => (
          <Stack spacing={1} key={table.title}>
            <Typography variant="h6" fontWeight={700}>{table.title}</Typography>
            <ReportTable columns={config.columns} rows={table.rows} />
          </Stack>
        ))}
      </Stack>
    </Layout>
  )
}
