USE student_result_db;

INSERT INTO roles (name, description) VALUES
  ('SUPER_ADMIN', 'Complete system control'),
  ('ADMIN', 'Academic management control'),
  ('TEACHER', 'Assigned subjects, marks, and attendance'),
  ('STUDENT', 'Own profile, marks, results, attendance, and marksheet')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO permissions (name, module, action, description) VALUES
  ('users.read', 'users', 'read', 'View users'),
  ('users.create', 'users', 'create', 'Create users'),
  ('users.update', 'users', 'update', 'Update users'),
  ('users.delete', 'users', 'delete', 'Delete users'),
  ('roles.read', 'roles', 'read', 'View roles'),
  ('roles.create', 'roles', 'create', 'Create roles'),
  ('roles.update', 'roles', 'update', 'Update roles'),
  ('roles.delete', 'roles', 'delete', 'Delete roles'),
  ('students.read', 'students', 'read', 'View students'),
  ('students.create', 'students', 'create', 'Create students'),
  ('students.update', 'students', 'update', 'Update students'),
  ('teachers.read', 'teachers', 'read', 'View teachers'),
  ('teachers.create', 'teachers', 'create', 'Create teachers'),
  ('marks.read', 'marks', 'read', 'View marks'),
  ('marks.create', 'marks', 'create', 'Create marks'),
  ('marks.update', 'marks', 'update', 'Update marks'),
  ('results.read', 'results', 'read', 'View results'),
  ('results.publish', 'results', 'publish', 'Publish results'),
  ('attendance.read', 'attendance', 'read', 'View attendance'),
  ('attendance.create', 'attendance', 'create', 'Create attendance'),
  ('notices.read', 'notices', 'read', 'View notices'),
  ('notices.create', 'notices', 'create', 'Create notices'),
  ('documents.read', 'documents', 'read', 'View documents'),
  ('documents.upload', 'documents', 'upload', 'Upload documents'),
  ('audit_logs.read', 'audit_logs', 'read', 'View audit logs')
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'SUPER_ADMIN'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'users.read', 'students.read', 'students.create', 'students.update',
  'teachers.read', 'teachers.create', 'marks.read', 'marks.create', 'marks.update',
  'results.read', 'results.publish', 'attendance.read', 'attendance.create',
  'notices.read', 'notices.create', 'documents.read', 'documents.upload'
)
WHERE r.name = 'ADMIN'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
  'students.read', 'marks.read', 'marks.create', 'marks.update',
  'results.read', 'attendance.read', 'attendance.create',
  'notices.read', 'documents.read', 'documents.upload'
)
WHERE r.name = 'TEACHER'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('results.read', 'attendance.read', 'notices.read', 'documents.read')
WHERE r.name = 'STUDENT'
ON DUPLICATE KEY UPDATE permission_id = VALUES(permission_id);

INSERT INTO departments (name, code, description) VALUES
  ('General Studies', 'GS', 'Default school department'),
  ('Computer Science', 'CS', 'Computer science department'),
  ('Science', 'SCI-DEPT', 'Science department'),
  ('Commerce', 'COM', 'Commerce department'),
  ('Arts', 'ARTS', 'Arts and humanities department')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO courses (department_id, name, code, duration, description)
SELECT d.id, c.name, c.code, c.duration, c.description
FROM departments d
JOIN (
  SELECT 'GS' AS department_code, 'Class 10' AS name, 'CLASS-10' AS code, '1 Year' AS duration, 'Default class 10 course' AS description
  UNION ALL SELECT 'GS', 'Class 12', 'CLASS-12', '1 Year', 'Senior secondary class 12 course'
  UNION ALL SELECT 'CS', 'BCA', 'BCA', '3 Years', 'Bachelor of Computer Applications'
  UNION ALL SELECT 'CS', 'MCA', 'MCA', '2 Years', 'Master of Computer Applications'
  UNION ALL SELECT 'COM', 'B.Com', 'BCOM', '3 Years', 'Bachelor of Commerce'
  UNION ALL SELECT 'ARTS', 'B.A.', 'BA', '3 Years', 'Bachelor of Arts'
) c ON c.department_code = d.code
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  name = VALUES(name),
  duration = VALUES(duration),
  description = VALUES(description);

INSERT INTO subjects (course_id, name, code, max_marks, description)
SELECT c.id, s.name, s.code, s.max_marks, s.description
FROM courses c
JOIN (
  SELECT 'CLASS-10' AS course_code, 'English' AS name, 'ENG' AS code, 100 AS max_marks, 'English subject' AS description
  UNION ALL SELECT 'CLASS-10', 'Math', 'MATH', 100, 'Mathematics subject'
  UNION ALL SELECT 'CLASS-10', 'Science', 'SCI', 100, 'Science subject'
  UNION ALL SELECT 'CLASS-10', 'Social Studies', 'SOC', 100, 'Social studies subject'
  UNION ALL SELECT 'CLASS-10', 'Computer', 'COMP', 100, 'Computer subject'
  UNION ALL SELECT 'CLASS-12', 'English', 'C12-ENG', 100, 'Class 12 English'
  UNION ALL SELECT 'CLASS-12', 'Physics', 'C12-PHY', 100, 'Class 12 Physics'
  UNION ALL SELECT 'CLASS-12', 'Chemistry', 'C12-CHEM', 100, 'Class 12 Chemistry'
  UNION ALL SELECT 'CLASS-12', 'Mathematics', 'C12-MATH', 100, 'Class 12 Mathematics'
  UNION ALL SELECT 'BCA', 'Programming Fundamentals', 'BCA-PF', 100, 'Programming basics'
  UNION ALL SELECT 'BCA', 'Database Management', 'BCA-DBMS', 100, 'Database management subject'
  UNION ALL SELECT 'BCA', 'Web Development', 'BCA-WEB', 100, 'Web development subject'
  UNION ALL SELECT 'BCA', 'Operating Systems', 'BCA-OS', 100, 'Operating systems subject'
  UNION ALL SELECT 'MCA', 'Advanced Java', 'MCA-JAVA', 100, 'Advanced Java programming'
  UNION ALL SELECT 'MCA', 'Cloud Computing', 'MCA-CLOUD', 100, 'Cloud computing subject'
  UNION ALL SELECT 'BCOM', 'Financial Accounting', 'BCOM-FA', 100, 'Financial accounting'
  UNION ALL SELECT 'BCOM', 'Business Economics', 'BCOM-BE', 100, 'Business economics'
  UNION ALL SELECT 'BA', 'Political Science', 'BA-POL', 100, 'Political science'
  UNION ALL SELECT 'BA', 'History', 'BA-HIST', 100, 'History subject'
) s ON s.course_code = c.code
ON DUPLICATE KEY UPDATE
  course_id = VALUES(course_id),
  name = VALUES(name),
  max_marks = VALUES(max_marks),
  description = VALUES(description);

INSERT INTO academic_years (year_name, start_date, end_date, status) VALUES
  ('2026', '2026-01-01', '2026-12-31', 'Active'),
  ('2025-2026', '2025-04-01', '2026-03-31', 'Inactive'),
  ('2026-2027', '2026-04-01', '2027-03-31', 'Active'),
  ('2027-2028', '2027-04-01', '2028-03-31', 'Inactive')
ON DUPLICATE KEY UPDATE
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  status = VALUES(status);

INSERT INTO semesters (semester_name, start_date, end_date, status) VALUES
  ('Semester 1', '2026-01-01', '2026-06-30', 'Active'),
  ('Semester 2', '2026-07-01', '2026-12-31', 'Active'),
  ('Semester 3', '2027-01-01', '2027-06-30', 'Inactive'),
  ('Semester 4', '2027-07-01', '2027-12-31', 'Inactive'),
  ('Annual', '2026-04-01', '2027-03-31', 'Active')
ON DUPLICATE KEY UPDATE
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  status = VALUES(status);

INSERT INTO users (role_id, name, email, username, password_hash, status)
SELECT r.id, u.name, u.email, u.username, u.password_hash, u.status
FROM roles r
JOIN (
  SELECT 'SUPER_ADMIN' AS role_name, 'Super Admin User' AS name, 'superadmin@example.com' AS email, 'superadmin' AS username, '5b2b72b874291a5bc80f2fc53a7df3fe:7db91a88709a0d73d189705898a9c9a58f37e4cff8d85b1e8990fc2c15a32c857480f02b55e06ee38862e840eb2e890f59fe2cc6a49d7a67d8a770f1c31e4715' AS password_hash, 'Active' AS status
  UNION ALL SELECT 'ADMIN', 'Admin User', 'admin@example.com', 'admin', '228f31d7b1d32e2bb324a37c952b8133:faf20fa45bf5b717425abd9b421083dc0ef932708f18556566a78b5357a4ff9c4591c5dabc7cc818946ff76593b6140c8b47db694f1be19225f56edebabfc68b', 'Active'
  UNION ALL SELECT 'TEACHER', 'Dr. Meera Nair', 'meera.nair@example.com', 'meera_teacher', 'ba5f60f4bda5184078d7bbc94c2126c6:dd8189c3eeb8812742e3e9bd50cece632f5365cc68e33dd3743f4301f3c60997ccad16d875ff2346710f3465d2d0ef788c8e99c2f3b1a1bbdf3e7f67310806e2', 'Active'
  UNION ALL SELECT 'TEACHER', 'Prof. Amit Joshi', 'amit.joshi@example.com', 'amit_teacher', 'ba5f60f4bda5184078d7bbc94c2126c6:dd8189c3eeb8812742e3e9bd50cece632f5365cc68e33dd3743f4301f3c60997ccad16d875ff2346710f3465d2d0ef788c8e99c2f3b1a1bbdf3e7f67310806e2', 'Active'
  UNION ALL SELECT 'STUDENT', 'Rahul Kumar', 'rahul106@example.com', 'rahul106', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
  UNION ALL SELECT 'STUDENT', 'Aarav Sharma', 'aarav101@example.com', 'aarav101', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
  UNION ALL SELECT 'STUDENT', 'Ananya Verma', 'ananya102@example.com', 'ananya102', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
  UNION ALL SELECT 'STUDENT', 'Rohan Kumar', 'rohan103@example.com', 'rohan103', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
  UNION ALL SELECT 'STUDENT', 'Priya Singh', 'priya104@example.com', 'priya104', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
  UNION ALL SELECT 'STUDENT', 'Neha Kumari', 'neha105@example.com', 'neha_kumari', '3ce266088bbecfd5082100c41b80518b:4298c6a2f202edb65e97466e3f36c135d652d6bba8d0469abba21b26823c3c59ab304a988d89784d3fbfac8de462b5ebbdcea29f15b0fce277d6faf661ad2a7e', 'Active'
) u ON u.role_name = r.name
ON DUPLICATE KEY UPDATE
  role_id = VALUES(role_id),
  name = VALUES(name),
  email = VALUES(email),
  username = VALUES(username),
  password_hash = VALUES(password_hash),
  status = VALUES(status);

INSERT INTO teachers (user_id, department_id, employee_code, name, email, phone, qualification, designation, joining_date, status)
SELECT u.id, d.id, t.employee_code, t.name, t.email, t.phone, t.qualification, t.designation, t.joining_date, 'Active'
FROM (
  SELECT 'meera_teacher' AS username, 'CS' AS department_code, 'T-1001' AS employee_code, 'Dr. Meera Nair' AS name, 'meera.nair@example.com' AS email, '9876543210' AS phone, 'PhD Computer Science' AS qualification, 'Assistant Professor' AS designation, '2024-01-10' AS joining_date
  UNION ALL SELECT 'amit_teacher', 'GS', 'T-1002', 'Prof. Amit Joshi', 'amit.joshi@example.com', '9876543211', 'MSc Mathematics', 'Senior Teacher', '2023-07-15'
) t
JOIN users u ON t.username = u.username
JOIN departments d ON t.department_code = d.code
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  department_id = VALUES(department_id),
  name = VALUES(name),
  email = VALUES(email),
  phone = VALUES(phone),
  qualification = VALUES(qualification),
  designation = VALUES(designation),
  joining_date = VALUES(joining_date),
  status = VALUES(status);

INSERT INTO students (user_id, course_id, name, roll_no, login_id, login_username, gender, class_name, fees_status, attendance_status)
SELECT u.id, c.id, s.name, s.roll_no, s.login_id, s.login_username, s.gender, s.class_name, s.fees_status, s.attendance_status
FROM (
  SELECT 'rahul106' AS username, 'CLASS-10' AS course_code, 'Rahul Kumar' AS name, 'R-106' AS roll_no, 'STU-106' AS login_id, 'rahul106' AS login_username, 'Male' AS gender, '10th' AS class_name, 'Paid' AS fees_status, 'Present' AS attendance_status
  UNION ALL SELECT 'aarav101', 'CLASS-10', 'Aarav Sharma', 'R-101', 'STU-101', 'aarav101', 'Male', '10th', 'Paid', 'Present'
  UNION ALL SELECT 'ananya102', 'CLASS-10', 'Ananya Verma', 'R-102', 'STU-102', 'ananya102', 'Female', '10th', 'Paid', 'Present'
  UNION ALL SELECT 'rohan103', 'CLASS-10', 'Rohan Kumar', 'R-103', 'STU-103', 'rohan103', 'Male', '10th', 'Unpaid', 'Absent'
  UNION ALL SELECT 'priya104', 'CLASS-10', 'Priya Singh', 'R-104', 'STU-104', 'priya104', 'Female', '10th', 'Paid', 'Present'
  UNION ALL SELECT 'neha_kumari', 'CLASS-10', 'Neha Kumari', 'R-105', 'STU-105', 'neha_kumari', 'Female', '10th', 'Unpaid', 'Present'
) s
JOIN users u ON s.username = u.username
JOIN courses c ON s.course_code = c.code
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  course_id = VALUES(course_id),
  name = VALUES(name),
  login_id = VALUES(login_id),
  login_username = VALUES(login_username),
  gender = VALUES(gender),
  class_name = VALUES(class_name),
  fees_status = VALUES(fees_status),
  attendance_status = VALUES(attendance_status);

INSERT INTO enrollments (student_id, course_id, academic_year_id, semester_id, enrollment_no, enrollment_date, status)
SELECT st.id, c.id, ay.id, sem.id, CONCAT('ENR-', st.roll_no), '2026-01-05', 'Active'
FROM students st
JOIN courses c ON st.course_id = c.id
JOIN academic_years ay ON ay.year_name = '2026'
JOIN semesters sem ON sem.semester_name = 'Semester 1'
ON DUPLICATE KEY UPDATE
  course_id = VALUES(course_id),
  academic_year_id = VALUES(academic_year_id),
  semester_id = VALUES(semester_id),
  enrollment_date = VALUES(enrollment_date),
  status = VALUES(status);

INSERT INTO exams (exam_name, exam_type, course_id, academic_year_id, semester_id, start_date, end_date, status)
SELECT e.exam_name, e.exam_type, c.id, ay.id, sem.id, e.start_date, e.end_date, e.status
FROM (
  SELECT 'Class 10 Internal Test' AS exam_name, 'Internal' AS exam_type, 'CLASS-10' AS course_code, '2026' AS year_name, 'Semester 1' AS semester_name, '2026-05-01' AS start_date, '2026-05-05' AS end_date, 'Draft' AS status
  UNION ALL SELECT 'Class 10 Mid-Term Exam', 'Mid-Term', 'CLASS-10', '2026', 'Semester 1', '2026-06-10', '2026-06-15', 'Open'
  UNION ALL SELECT 'BCA Practical Exam', 'Practical', 'BCA', '2026', 'Semester 1', '2026-07-10', '2026-07-12', 'Published'
  UNION ALL SELECT 'Class 10 Final Exam', 'Final', 'CLASS-10', '2026', 'Semester 1', '2026-07-24', '2026-07-30', 'Closed'
  UNION ALL SELECT 'BCA Semester Exam', 'Semester', 'BCA', '2026', 'Semester 2', '2026-12-01', '2026-12-15', 'Published'
  UNION ALL SELECT 'MCA Semester 3 Exam', 'Semester', 'MCA', '2026-2027', 'Semester 3', '2027-03-01', '2027-03-10', 'Open'
) e
JOIN courses c ON c.code = e.course_code
JOIN academic_years ay ON ay.year_name = e.year_name
JOIN semesters sem ON sem.semester_name = e.semester_name
ON DUPLICATE KEY UPDATE
  exam_type = VALUES(exam_type),
  course_id = VALUES(course_id),
  academic_year_id = VALUES(academic_year_id),
  semester_id = VALUES(semester_id),
  start_date = VALUES(start_date),
  end_date = VALUES(end_date),
  status = VALUES(status);

INSERT INTO exam_subjects (exam_id, subject_id, teacher_id, exam_date, start_time, end_time, max_marks, passing_marks)
SELECT e.id, sub.id, t.id, es.exam_date, es.start_time, es.end_time, es.max_marks, es.passing_marks
FROM (
  SELECT 'Class 10 Internal Test' AS exam_name, 'ENG' AS subject_code, 'T-1002' AS employee_code, '2026-05-01' AS exam_date, '10:00:00' AS start_time, '12:00:00' AS end_time, 50 AS max_marks, 20 AS passing_marks
  UNION ALL SELECT 'Class 10 Mid-Term Exam', 'MATH', 'T-1002', '2026-06-10', '10:00:00', '13:00:00', 75, 30
  UNION ALL SELECT 'BCA Practical Exam', 'BCA-PF', 'T-1001', '2026-07-10', '09:00:00', '12:00:00', 100, 40
  UNION ALL SELECT 'Class 10 Final Exam', 'ENG', 'T-1002', '2026-07-24', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'Class 10 Final Exam', 'MATH', 'T-1002', '2026-07-25', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'Class 10 Final Exam', 'SCI', 'T-1002', '2026-07-26', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'Class 10 Final Exam', 'SOC', 'T-1002', '2026-07-27', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'Class 10 Final Exam', 'COMP', 'T-1001', '2026-07-28', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'BCA Semester Exam', 'BCA-DBMS', 'T-1001', '2026-12-01', '10:00:00', '13:00:00', 100, 40
  UNION ALL SELECT 'MCA Semester 3 Exam', 'MCA-JAVA', 'T-1001', '2027-03-01', '10:00:00', '13:00:00', 100, 40
) es
JOIN exams e ON e.exam_name = es.exam_name
JOIN subjects sub ON es.subject_code = sub.code
JOIN teachers t ON es.employee_code = t.employee_code
ON DUPLICATE KEY UPDATE
  teacher_id = VALUES(teacher_id),
  exam_date = VALUES(exam_date),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  max_marks = VALUES(max_marks),
  passing_marks = VALUES(passing_marks);

INSERT INTO marks (student_id, exam_id, subject_id, internal_marks, practical_marks, external_marks, total_marks, grade, result_status)
SELECT st.id, e.id, sub.id, m.internal_marks, m.practical_marks, m.external_marks,
  (m.internal_marks + m.practical_marks + m.external_marks) AS total_marks,
  CASE
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 90 THEN 'A+'
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 80 THEN 'A'
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 70 THEN 'B'
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 60 THEN 'C'
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 50 THEN 'D'
    WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 40 THEN 'E'
    ELSE 'F'
  END AS grade,
  CASE WHEN (m.internal_marks + m.practical_marks + m.external_marks) >= 40 THEN 'Pass' ELSE 'Fail' END AS result_status
FROM students st
JOIN exams e ON e.exam_name = 'Class 10 Final Exam'
JOIN (
  SELECT 'R-101' AS roll_no, 'ENG' AS subject_code, 18 AS internal_marks, 9 AS practical_marks, 58 AS external_marks
  UNION ALL SELECT 'R-101', 'MATH', 19, 10, 61
  UNION ALL SELECT 'R-101', 'SCI', 18, 10, 57
  UNION ALL SELECT 'R-101', 'SOC', 17, 9, 55
  UNION ALL SELECT 'R-101', 'COMP', 19, 10, 64
  UNION ALL SELECT 'R-102', 'ENG', 17, 9, 56
  UNION ALL SELECT 'R-102', 'MATH', 18, 9, 58
  UNION ALL SELECT 'R-102', 'SCI', 17, 10, 56
  UNION ALL SELECT 'R-102', 'SOC', 18, 9, 57
  UNION ALL SELECT 'R-102', 'COMP', 19, 10, 62
  UNION ALL SELECT 'R-103', 'ENG', 12, 7, 39
  UNION ALL SELECT 'R-103', 'MATH', 13, 7, 38
  UNION ALL SELECT 'R-103', 'SCI', 12, 8, 41
  UNION ALL SELECT 'R-103', 'SOC', 13, 7, 40
  UNION ALL SELECT 'R-103', 'COMP', 14, 8, 43
  UNION ALL SELECT 'R-104', 'ENG', 19, 10, 63
  UNION ALL SELECT 'R-104', 'MATH', 18, 10, 60
  UNION ALL SELECT 'R-104', 'SCI', 19, 9, 61
  UNION ALL SELECT 'R-104', 'SOC', 18, 9, 59
  UNION ALL SELECT 'R-104', 'COMP', 20, 10, 65
  UNION ALL SELECT 'R-105', 'ENG', 15, 8, 48
  UNION ALL SELECT 'R-105', 'MATH', 16, 8, 49
  UNION ALL SELECT 'R-105', 'SCI', 15, 9, 50
  UNION ALL SELECT 'R-105', 'SOC', 14, 8, 47
  UNION ALL SELECT 'R-105', 'COMP', 16, 9, 51
  UNION ALL SELECT 'R-106', 'ENG', 16, 9, 54
  UNION ALL SELECT 'R-106', 'MATH', 17, 9, 55
  UNION ALL SELECT 'R-106', 'SCI', 16, 8, 53
  UNION ALL SELECT 'R-106', 'SOC', 15, 8, 52
  UNION ALL SELECT 'R-106', 'COMP', 18, 10, 58
) m ON m.roll_no = st.roll_no
JOIN subjects sub ON sub.code = m.subject_code
ON DUPLICATE KEY UPDATE
  internal_marks = VALUES(internal_marks),
  practical_marks = VALUES(practical_marks),
  external_marks = VALUES(external_marks),
  total_marks = VALUES(total_marks),
  grade = VALUES(grade),
  result_status = VALUES(result_status);

INSERT INTO results (student_id, exam_id, total_marks, maximum_marks, percentage, gpa, cgpa, overall_grade, final_result, review_status, reviewed_by, reviewed_at, review_notes, published_by, published_at)
SELECT st.id, e.id, SUM(m.total_marks), SUM(es.max_marks),
  ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2),
  ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 10, 2),
  ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 10, 2),
  CASE
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 90 THEN 'A+'
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 80 THEN 'A'
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 70 THEN 'B+'
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 60 THEN 'B'
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 50 THEN 'C'
    WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 40 THEN 'D'
    ELSE 'F'
  END,
  CASE WHEN ROUND((SUM(m.total_marks) / SUM(es.max_marks)) * 100, 2) >= 40 THEN 'Pass' ELSE 'Fail' END,
  CASE st.roll_no
    WHEN 'R-101' THEN 'Published'
    WHEN 'R-102' THEN 'Approved'
    WHEN 'R-103' THEN 'Rejected'
    WHEN 'R-104' THEN 'Under Review'
    WHEN 'R-105' THEN 'Calculated'
    WHEN 'R-106' THEN 'Published'
    ELSE 'Calculated'
  END AS review_status,
  CASE WHEN st.roll_no IN ('R-101', 'R-102', 'R-103', 'R-104', 'R-106') THEN admin_user.id ELSE NULL END AS reviewed_by,
  CASE WHEN st.roll_no IN ('R-101', 'R-102', 'R-103', 'R-104', 'R-106') THEN CURRENT_TIMESTAMP ELSE NULL END AS reviewed_at,
  CASE st.roll_no
    WHEN 'R-101' THEN 'Reviewed and published.'
    WHEN 'R-102' THEN 'Reviewed and approved for publishing.'
    WHEN 'R-103' THEN 'Rejected for correction.'
    WHEN 'R-104' THEN 'Under admin review.'
    WHEN 'R-106' THEN 'Reviewed and published.'
    ELSE NULL
  END AS review_notes,
  CASE WHEN st.roll_no IN ('R-101', 'R-106') THEN admin_user.id ELSE NULL END AS published_by,
  CASE WHEN st.roll_no IN ('R-101', 'R-106') THEN CURRENT_TIMESTAMP ELSE NULL END AS published_at
FROM students st
JOIN marks m ON m.student_id = st.id
JOIN exam_subjects es ON es.exam_id = m.exam_id AND es.subject_id = m.subject_id
JOIN exams e ON m.exam_id = e.id
JOIN users admin_user ON admin_user.username = 'admin'
WHERE e.exam_name = 'Class 10 Final Exam'
GROUP BY st.id, e.id, admin_user.id
ON DUPLICATE KEY UPDATE
  total_marks = VALUES(total_marks),
  maximum_marks = VALUES(maximum_marks),
  percentage = VALUES(percentage),
  gpa = VALUES(gpa),
  cgpa = VALUES(cgpa),
  overall_grade = VALUES(overall_grade),
  final_result = VALUES(final_result),
  review_status = VALUES(review_status),
  reviewed_by = VALUES(reviewed_by),
  reviewed_at = VALUES(reviewed_at),
  review_notes = VALUES(review_notes),
  published_by = VALUES(published_by),
  published_at = VALUES(published_at);

INSERT INTO attendance (student_id, subject_id, teacher_id, academic_year_id, semester_id, attendance_date, status, remarks)
SELECT st.id, sub.id, t.id, ay.id, sem.id, a.attendance_date, a.status, a.remarks
FROM students st
JOIN (
  SELECT 'R-101' AS roll_no, 'ENG' AS subject_code, 'T-1002' AS employee_code, '2026-07-20' AS attendance_date, 'Present' AS status, 'On time' AS remarks
  UNION ALL SELECT 'R-102', 'ENG', 'T-1002', '2026-07-20', 'Present', 'On time'
  UNION ALL SELECT 'R-103', 'ENG', 'T-1002', '2026-07-20', 'Absent', 'Absent without leave'
  UNION ALL SELECT 'R-104', 'MATH', 'T-1002', '2026-07-21', 'Present', 'On time'
  UNION ALL SELECT 'R-105', 'COMP', 'T-1001', '2026-07-22', 'Late', 'Late by 10 minutes'
  UNION ALL SELECT 'R-106', 'COMP', 'T-1001', '2026-07-22', 'Present', 'On time'
) a ON a.roll_no = st.roll_no
JOIN subjects sub ON sub.code = a.subject_code
JOIN teachers t ON t.employee_code = a.employee_code
JOIN academic_years ay ON ay.year_name = '2026'
JOIN semesters sem ON sem.semester_name = 'Semester 1'
ON DUPLICATE KEY UPDATE
  teacher_id = VALUES(teacher_id),
  academic_year_id = VALUES(academic_year_id),
  semester_id = VALUES(semester_id),
  status = VALUES(status),
  remarks = VALUES(remarks);

INSERT INTO notices (title, message, target_audience, department_id, course_id, published_by, publish_date, expiry_date, status)
SELECT n.title, n.message, n.target_audience, d.id, c.id, u.id, n.publish_date, n.expiry_date, n.status
FROM users u
JOIN (
  SELECT 'Final Exam Schedule Published' AS title, 'Final exam schedule has been published.' AS message, 'Students' AS target_audience, 'GS' AS department_code, 'CLASS-10' AS course_code, 'admin' AS username, '2026-07-10' AS publish_date, '2026-07-30' AS expiry_date, 'Published' AS status
  UNION ALL SELECT 'Marks Submission Deadline', 'Teachers must submit marks before deadline.', 'Teachers', 'GS', NULL, 'admin', '2026-07-20', '2026-08-05', 'Published'
  UNION ALL SELECT 'Fee Payment Reminder', 'Please clear pending fees.', 'Students', 'GS', 'CLASS-10', 'admin', '2026-07-15', '2026-08-15', 'Published'
) n ON n.username = u.username
LEFT JOIN departments d ON d.code = n.department_code
LEFT JOIN courses c ON c.code = n.course_code
WHERE NOT EXISTS (SELECT 1 FROM notices x WHERE x.title = n.title);

INSERT INTO notifications (user_id, title, message, type, is_read, read_at)
SELECT u.id, n.title, n.message, n.type, n.is_read, n.read_at
FROM users u
JOIN (
  SELECT 'aarav101' AS username, 'Result Published' AS title, 'Your result for Class 10 Final Exam has been published.' AS message, 'Success' AS type, FALSE AS is_read, NULL AS read_at
  UNION ALL SELECT 'rahul106', 'Result Published', 'Your result for Class 10 Final Exam has been published.', 'Success', FALSE, NULL
  UNION ALL SELECT 'rohan103', 'Attendance Warning', 'Your attendance needs improvement.', 'Warning', FALSE, NULL
  UNION ALL SELECT 'meera_teacher', 'Marks Reminder', 'Please verify uploaded marks.', 'Info', TRUE, CURRENT_TIMESTAMP
) n ON n.username = u.username
WHERE NOT EXISTS (
  SELECT 1 FROM notifications x
  WHERE x.user_id = u.id AND x.title = n.title AND x.message = n.message
);

INSERT INTO documents (student_id, teacher_id, uploaded_by, title, document_type, file_name, file_path, mime_type, file_size, status)
SELECT st.id, t.id, u.id, d.title, d.document_type, d.file_name, d.file_path, d.mime_type, d.file_size, 'Active'
FROM students st
JOIN users u ON u.username = 'admin'
JOIN teachers t ON t.employee_code = 'T-1002'
JOIN (
  SELECT 'R-101' AS roll_no, 'Aarav ID Card' AS title, 'ID Card' AS document_type, 'aarav-id-card.pdf' AS file_name, '/documents/students/aarav-id-card.pdf' AS file_path, 'application/pdf' AS mime_type, 120000 AS file_size
  UNION ALL SELECT 'R-105', 'Neha Result Sheet', 'Result Sheet', 'neha-result.pdf', '/documents/students/neha-result.pdf', 'application/pdf', 140000
  UNION ALL SELECT 'R-101', 'Aarav Sharma Class 10 Final Exam Marksheet', 'Marksheet', 'marksheet-aarav101-class-10-final.json', '/marksheets/student-aarav101/class-10-final.json', 'application/json', 0
  UNION ALL SELECT 'R-106', 'Rahul Kumar Class 10 Final Exam Marksheet', 'Marksheet', 'marksheet-rahul106-class-10-final.json', '/marksheets/student-rahul106/class-10-final.json', 'application/json', 0
) d ON d.roll_no = st.roll_no
WHERE NOT EXISTS (SELECT 1 FROM documents x WHERE x.file_path = d.file_path);

UPDATE documents
SET teacher_id = (SELECT id FROM teachers WHERE employee_code = 'T-1002' LIMIT 1)
WHERE teacher_id IS NULL;

INSERT INTO documents (student_id, teacher_id, uploaded_by, title, document_type, file_name, file_path, mime_type, file_size, status)
SELECT NULL, t.id, u.id, 'Teacher Appointment Letter', 'Appointment', 'meera-appointment.pdf', '/documents/teachers/meera-appointment.pdf', 'application/pdf', 180000, 'Active'
FROM teachers t
JOIN users u ON u.username = 'admin'
WHERE t.employee_code = 'T-1001'
  AND NOT EXISTS (SELECT 1 FROM documents x WHERE x.file_path = '/documents/teachers/meera-appointment.pdf');

INSERT INTO audit_logs (user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent)
SELECT u.id, a.action, a.entity_name, a.entity_id, a.old_values, a.new_values, a.ip_address, a.user_agent
FROM users u
JOIN (
  SELECT 'admin' AS username, 'CREATE' AS action, 'exams' AS entity_name, 1 AS entity_id, NULL AS old_values, JSON_OBJECT('exam_name', 'Final Exam') AS new_values, '127.0.0.1' AS ip_address, 'Seed Script' AS user_agent
  UNION ALL SELECT 'amit_teacher', 'UPDATE', 'marks', 1, JSON_OBJECT('total_marks', 80), JSON_OBJECT('total_marks', 85), '127.0.0.1', 'Seed Script'
  UNION ALL SELECT 'admin', 'PUBLISH', 'notices', 1, NULL, JSON_OBJECT('status', 'Published'), '127.0.0.1', 'Seed Script'
) a ON a.username = u.username
WHERE NOT EXISTS (
  SELECT 1 FROM audit_logs x
  WHERE x.user_id = u.id AND x.action = a.action AND x.entity_name = a.entity_name AND x.entity_id = a.entity_id
);
