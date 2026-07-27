import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const chartColors = ['#1D4ED8', '#15803D', '#C2410C', '#7E22CE', '#BE123C']

const dashboardContent = {
  TEACHER: {
    title: 'Teacher Dashboard',
    subtitle: 'Enter or update marks for assigned subjects.',
    cards: [
      ['Assigned Subjects', 'View exam subjects assigned to the teacher.'],
      ['Marks Entry', 'Enter internal, practical, and external marks.'],
      ['Validation', 'The system automatically calculates total marks and pass/fail status.'],
      ['Students', 'View academic data for assigned students.'],
    ],
  },
  STUDENT: {
    title: 'Student Dashboard',
    subtitle: 'View published results, notifications, and marksheets.',
    cards: [
      ['My Results', 'Only published results are visible to students.'],
      ['My Marksheet', 'After result publication, marksheet view and download details will be available.'],
      ['Notifications', 'Result publication notifications will appear here.'],
      ['Profile', 'View course, roll number, and student details.'],
    ],
  },
}

const initialStats = {
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  totalSubjects: 0,
  totalExams: 0,
  publishedResults: 0,
  passPercentage: 0,
  failPercentage: 0,
  averagePercentage: 0,
}

const round = (value) => Number(value || 0).toFixed(1)

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(Number(value)))
  if (!validValues.length) return 0
  return validValues.reduce((sum, value) => sum + Number(value), 0) / validValues.length
}

function BarChart({ title, data, valueSuffix = '%' }) {
  const maxValue = Math.max(...data.map((item) => Number(item.value) || 0), 1)

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={700}>{title}</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {data.length === 0 && <Typography color="text.secondary">No data available</Typography>}
        {data.map((item, index) => {
          const width = Math.max(4, (Number(item.value) / maxValue) * 100)
          const color = chartColors[index % chartColors.length]

          return (
            <Box key={item.label}>
              <Stack direction="row" justifyContent="space-between" spacing={2}>
                <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                <Typography variant="body2" color="text.secondary">{round(item.value)}{valueSuffix}</Typography>
              </Stack>
              <Tooltip title={`${item.label}: ${round(item.value)}${valueSuffix}`}>
                <Box sx={{ mt: 0.75, height: 12, bgcolor: '#e5e7eb', borderRadius: 999, overflow: 'hidden' }}>
                  <Box sx={{ width: `${width}%`, height: '100%', bgcolor: color, borderRadius: 999 }} />
                </Box>
              </Tooltip>
            </Box>
          )
        })}
      </Stack>
    </Paper>
  )
}

function PassFailChart({ passPercentage, failPercentage }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight={700}>Pass/Fail Chart</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={600}>Pass</Typography>
            <Typography>{round(passPercentage)}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={Number(passPercentage)} sx={{ height: 12, borderRadius: 999, mt: 1 }} color="success" />
        </Box>
        <Box>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={600}>Fail</Typography>
            <Typography>{round(failPercentage)}%</Typography>
          </Stack>
          <LinearProgress variant="determinate" value={Number(failPercentage)} sx={{ height: 12, borderRadius: 999, mt: 1 }} color="error" />
        </Box>
      </Stack>
    </Paper>
  )
}

function RoleDashboard({ content }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
      {content.cards.map(([title, text]) => (
        <Paper key={title} sx={{ p: 3, height: '100%' }}>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{text}</Typography>
        </Paper>
      ))}
    </Box>
  )
}

function DataList({ title, items, renderItem }) {
  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
        <Chip label={`${items.length} records`} size="small" />
      </Stack>
      <Stack spacing={1.5} sx={{ mt: 2, maxHeight: 420, overflowY: 'auto', pr: 1 }}>
        {items.length === 0 && <Typography color="text.secondary">No data available</Typography>}
        {items.map((item) => renderItem(item))}
      </Stack>
    </Paper>
  )
}

export default function Dashboard() {
  const { role, user, token } = useAuth()
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const content = dashboardContent[role] || {
    title: 'Admin Dashboard',
    subtitle: 'Manage the complete academic, examination, marks, and result publication workflow.',
  }
  const [dashboardData, setDashboardData] = useState({
    students: [],
    teachers: [],
    courses: [],
    subjects: [],
    exams: [],
    results: [],
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin) return

    const loadDashboardData = async () => {
      const requests = [
        ['students', api.get('/students')],
        ['teachers', api.get('/teachers')],
        ['courses', api.get('/courses')],
        ['subjects', api.get('/subjects')],
        ['exams', api.get('/exams')],
        ['results', api.get('/results')],
      ]

      const responses = await Promise.allSettled(requests.map(([, request]) => request))
      const nextData = { students: [], teachers: [], courses: [], subjects: [], exams: [], results: [] }
      const failedSections = []

      responses.forEach((response, index) => {
        const section = requests[index][0]
        if (response.status === 'fulfilled') {
          nextData[section] = response.value.data.data || []
        } else {
          failedSections.push(section)
        }
      })

      setDashboardData(nextData)
      setError(failedSections.length ? `Some dashboard data failed: ${failedSections.join(', ')}` : '')
    }

    loadDashboardData().catch((err) => {
      setError(err.response?.data?.message || 'Dashboard data could not be loaded. Please check whether the backend is running.')
    })
  }, [isAdmin, token])

  const adminAnalytics = useMemo(() => {
    const { students, teachers, courses, subjects, exams, results } = dashboardData
    const publishedResults = results.filter((result) => result.review_status === 'Published')
    const passedResults = results.filter((result) => result.final_result === 'Pass')
    const failedResults = results.filter((result) => result.final_result === 'Fail')
    const totalResults = results.length || 1

    const coursePerformance = courses.map((course) => {
      const courseStudentIds = new Set(students.filter((student) => student.course_id === course.id).map((student) => student.id))
      const courseResults = results.filter((result) => courseStudentIds.has(result.student_id))
      return {
        label: course.name,
        value: average(courseResults.map((result) => result.percentage)),
      }
    })

    const subjectPerformance = subjects.map((subject) => {
      const subjectResults = results.filter((result) => {
        return exams.some((exam) => exam.id === result.exam_id && exam.subject_id === subject.id)
      })
      return {
        label: subject.name,
        value: average(subjectResults.map((result) => result.percentage)),
      }
    })

    const semesterPerformance = exams.reduce((summary, exam) => {
      const key = exam.semester_name || `Semester ${exam.semester_id || '-'}`
      const examResults = results.filter((result) => result.exam_id === exam.id)
      if (!summary[key]) summary[key] = []
      summary[key].push(...examResults.map((result) => Number(result.percentage)))
      return summary
    }, {})

    const topPerformers = [...results]
      .sort((first, second) => Number(second.percentage) - Number(first.percentage))
      .slice(0, 5)
      .map((result) => ({ label: result.student_name || result.roll_no || `Result ${result.id}`, value: Number(result.percentage) }))

    return {
      stats: {
        ...initialStats,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalCourses: courses.length,
        totalSubjects: subjects.length,
        totalExams: new Set(exams.map((exam) => exam.id)).size,
        publishedResults: publishedResults.length,
        passPercentage: (passedResults.length / totalResults) * 100,
        failPercentage: (failedResults.length / totalResults) * 100,
        averagePercentage: average(results.map((result) => result.percentage)),
      },
      coursePerformance,
      subjectPerformance,
      semesterPerformance: Object.entries(semesterPerformance).map(([label, values]) => ({ label, value: average(values) })),
      topPerformers,
    }
  }, [dashboardData])

  const statCards = [
    ['Total Students', adminAnalytics.stats.totalStudents],
    ['Total Teachers', adminAnalytics.stats.totalTeachers],
    ['Total Courses', adminAnalytics.stats.totalCourses],
    ['Total Subjects', adminAnalytics.stats.totalSubjects],
    ['Total Exams', adminAnalytics.stats.totalExams],
    ['Published Results', adminAnalytics.stats.publishedResults],
    ['Pass %', `${round(adminAnalytics.stats.passPercentage)}%`],
    ['Fail %', `${round(adminAnalytics.stats.failPercentage)}%`],
    ['Average Percentage', `${round(adminAnalytics.stats.averagePercentage)}%`],
  ]

  return (
    <Layout>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight={700}>{content.title}</Typography>
            <Typography color="text.secondary">{content.subtitle}</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`Role: ${role || 'N/A'}`} color="primary" />
            <Chip label={token ? 'Session Active' : 'No Session'} color={token ? 'success' : 'default'} />
          </Stack>
        </Stack>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={700}>Logged in user</Typography>
          <Typography>Name: {user?.name || '-'}</Typography>
          <Typography>Email: {user?.email || '-'}</Typography>
          <Typography>Username: {user?.username || '-'}</Typography>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        {isAdmin ? (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 2 }}>
              {statCards.map(([label, value]) => (
                <Paper key={label} sx={{ p: 2.5 }}>
                  <Typography color="text.secondary" variant="body2">{label}</Typography>
                  <Typography variant="h4" fontWeight={800}>{value}</Typography>
                </Paper>
              ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
              <BarChart title="Course-wise Performance" data={adminAnalytics.coursePerformance} />
              <BarChart title="Subject-wise Performance" data={adminAnalytics.subjectPerformance} />
              <BarChart title="Semester-wise Performance" data={adminAnalytics.semesterPerformance} />
              <PassFailChart passPercentage={adminAnalytics.stats.passPercentage} failPercentage={adminAnalytics.stats.failPercentage} />
              <BarChart title="Topper Chart" data={adminAnalytics.topPerformers} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 3 }}>
              <DataList
                title="Course Data"
                items={dashboardData.courses}
                renderItem={(course) => (
                  <Box key={course.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                      <Typography fontWeight={700} sx={{ minWidth: 0, wordBreak: 'break-word' }}>{course.name}</Typography>
                      <Chip label={course.code} size="small" color="primary" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">Department: {course.department_name || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">Duration: {course.duration || '-'}</Typography>
                  </Box>
                )}
              />
              <DataList
                title="Subject Data"
                items={dashboardData.subjects}
                renderItem={(subject) => (
                  <Box key={subject.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                      <Typography fontWeight={700} sx={{ minWidth: 0, wordBreak: 'break-word' }}>{subject.name}</Typography>
                      <Chip label={subject.code} size="small" color="secondary" />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">Course: {subject.course_name || '-'}</Typography>
                    <Typography variant="body2" color="text.secondary">Max Marks: {subject.max_marks || '-'}</Typography>
                  </Box>
                )}
              />
            </Box>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700}>Top Performers</Typography>
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {adminAnalytics.topPerformers.map((student, index) => (
                  <Stack key={`${student.label}-${index}`} direction="row" justifyContent="space-between">
                    <Typography>{index + 1}. {student.label}</Typography>
                    <Typography fontWeight={700}>{round(student.value)}%</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </>
        ) : (
          <>
            {role === 'TEACHER' && (
              <Paper sx={{ p: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Attendance</Typography>
                    <Typography color="text.secondary">Select class, subject, and date to mark student attendance.</Typography>
                  </Box>
                  <Button component={Link} to="/teacher-attendance" variant="contained">Mark Attendance</Button>
                </Stack>
              </Paper>
            )}
            {role === 'STUDENT' && (
              <Paper sx={{ p: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={700}>My Result</Typography>
                    <Typography color="text.secondary">Select an exam to view the complete marksheet and final result.</Typography>
                  </Box>
                  <Button component={Link} to="/my-result" variant="contained">View Result</Button>
                </Stack>
              </Paper>
            )}
            <RoleDashboard content={content} />
          </>
        )}
      </Stack>
    </Layout>
  )
}
