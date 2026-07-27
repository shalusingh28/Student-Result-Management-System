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
  TextField,
  Typography,
} from '@mui/material'
import Layout from '../components/Layout'
import api from '../services/api'

const statuses = ['Present', 'Absent', 'Late', 'Leave']
const lowAttendanceThreshold = 60
const today = new Date().toISOString().slice(0, 10)

const demoClasses = [{ course_id: 1, course_name: 'Class 10', class_name: '10th' }]
const demoSubjects = [{ subject_id: 1, subject_name: 'English', academic_year_id: 1, year_name: '2026', semester_id: 1, semester_name: 'Semester 1' }]
const demoRoster = [
  { student_id: 1, student_name: 'Rahul Kumar', roll_no: 'R-106', status: 'Present', remarks: '', present_classes: 6, total_classes: 8, attendance_percentage: 75, is_low_attendance: false },
  { student_id: 2, student_name: 'Aarav Sharma', roll_no: 'R-101', status: 'Absent', remarks: '', present_classes: 4, total_classes: 8, attendance_percentage: 50, is_low_attendance: true },
]

const displayPercent = (value) => `${Number(value || 0).toFixed(2)}%`

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [attendanceDate, setAttendanceDate] = useState(today)
  const [roster, setRoster] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadClasses = async () => {
      setError('')
      try {
        const response = await api.get('/me/attendance-classes')
        const nextClasses = response.data.data || []
        setClasses(nextClasses.length ? nextClasses : demoClasses)
      } catch (err) {
        setClasses(demoClasses)
        setError(err.response?.data?.message || 'Classes could not be loaded, so demo classes are being shown.')
      }
    }

    loadClasses()
  }, [])

  useEffect(() => {
    if (!selectedClass) return

    const loadSubjects = async () => {
      const classData = JSON.parse(selectedClass)
      setError('')
      setSelectedSubject('')
      setRoster([])

      try {
        const response = await api.get('/me/attendance-subjects', {
          params: { courseId: classData.course_id, className: classData.class_name },
        })
        const nextSubjects = response.data.data || []
        setSubjects(nextSubjects.length ? nextSubjects : demoSubjects)
      } catch (err) {
        setSubjects(demoSubjects)
        setError(err.response?.data?.message || 'Subjects could not be loaded, so demo subjects are being shown.')
      }
    }

    loadSubjects()
  }, [selectedClass])

  const selectedClassData = useMemo(() => selectedClass ? JSON.parse(selectedClass) : null, [selectedClass])
  const selectedSubjectData = useMemo(() => selectedSubject ? JSON.parse(selectedSubject) : null, [selectedSubject])

  const loadRoster = async () => {
    if (!selectedClassData || !selectedSubjectData || !attendanceDate) {
      setError('Please select class, subject, and date.')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await api.get('/me/attendance-roster', {
        params: {
          courseId: selectedClassData.course_id,
          className: selectedClassData.class_name,
          subjectId: selectedSubjectData.subject_id,
          academicYearId: selectedSubjectData.academic_year_id,
          semesterId: selectedSubjectData.semester_id,
          date: attendanceDate,
        },
      })
      setRoster(response.data.data || [])
    } catch (err) {
      setRoster(demoRoster)
      setError(err.response?.data?.message || 'Roster could not be loaded, so a demo roster is being shown.')
    } finally {
      setLoading(false)
    }
  }

  const updateRoster = (studentId, changes) => {
    setRoster((currentRoster) => currentRoster.map((student) => {
      return student.student_id === studentId ? { ...student, ...changes } : student
    }))
  }

  const markAllPresent = () => {
    setRoster((currentRoster) => currentRoster.map((student) => ({ ...student, status: 'Present' })))
  }

  const saveAttendance = async () => {
    if (!selectedSubjectData || roster.length === 0) return

    setLoading(true)
    setMessage('')
    setError('')

    try {
      await api.post('/me/attendance/bulk', {
        subjectId: selectedSubjectData.subject_id,
        academicYearId: selectedSubjectData.academic_year_id,
        semesterId: selectedSubjectData.semester_id,
        attendanceDate,
        records: roster.map((student) => ({
          studentId: student.student_id,
          status: student.status,
          remarks: student.remarks || '',
        })),
      })
      setMessage('Attendance saved successfully.')
      await loadRoster()
    } catch (err) {
      setError(err.response?.data?.message || 'Attendance could not be saved. Please check the backend.')
    } finally {
      setLoading(false)
    }
  }

  const lowAttendanceStudents = roster.filter((student) => Number(student.attendance_percentage) < lowAttendanceThreshold && Number(student.total_classes) > 0)

  return (
    <Layout>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Teacher Attendance</Typography>
          <Typography color="text.secondary">Select class, subject and date to mark attendance.</Typography>
        </Box>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="warning">{error}</Alert>}
        {lowAttendanceStudents.length > 0 && (
          <Alert severity="warning">
            Low attendance warning: {lowAttendanceStudents.map((student) => `${student.student_name} (${displayPercent(student.attendance_percentage)})`).join(', ')}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="class-select-label">Select Class</InputLabel>
              <Select labelId="class-select-label" label="Select Class" value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                {classes.map((classItem) => (
                  <MenuItem key={`${classItem.course_id}-${classItem.class_name}`} value={JSON.stringify(classItem)}>
                    {classItem.course_name} - {classItem.class_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!selectedClass}>
              <InputLabel id="subject-select-label">Select Subject</InputLabel>
              <Select labelId="subject-select-label" label="Select Subject" value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
                {subjects.map((subject) => (
                  <MenuItem key={`${subject.subject_id}-${subject.academic_year_id}-${subject.semester_id}`} value={JSON.stringify(subject)}>
                    {subject.subject_name} ({subject.semester_name})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Select Date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} InputLabelProps={{ shrink: true }} fullWidth />

            <Button variant="contained" onClick={loadRoster} disabled={loading || !selectedClass || !selectedSubject || !attendanceDate}>
              {loading ? 'Loading...' : 'Load Students'}
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>Mark Attendance</Typography>
              <Typography color="text.secondary">Formula: Present Classes / Total Classes × 100. Low warning: below {lowAttendanceThreshold}%.</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={markAllPresent} disabled={!roster.length}>Mark All Present</Button>
              <Button variant="contained" color="success" onClick={saveAttendance} disabled={loading || !roster.length}>Save Attendance</Button>
            </Stack>
          </Stack>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Roll No</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Attendance %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roster.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Select class, subject, and date, then click Load Students.</TableCell>
                </TableRow>
              )}
              {roster.map((student) => (
                <TableRow key={student.student_id} sx={{ bgcolor: Number(student.attendance_percentage) < lowAttendanceThreshold && Number(student.total_classes) > 0 ? '#fff7ed' : 'inherit' }}>
                  <TableCell>{student.roll_no}</TableCell>
                  <TableCell>{student.student_name}</TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <FormControl fullWidth size="small">
                      <Select value={student.status} onChange={(event) => updateRoster(student.student_id, { status: event.target.value })}>
                        {statuses.map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <TextField size="small" value={student.remarks || ''} onChange={(event) => updateRoster(student.student_id, { remarks: event.target.value })} placeholder="Optional remarks" fullWidth />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography fontWeight={700}>{displayPercent(student.attendance_percentage)}</Typography>
                      <Typography variant="caption" color="text.secondary">{student.present_classes || 0}/{student.total_classes || 0} present</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Stack>
    </Layout>
  )
}
