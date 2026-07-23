const STORAGE_KEY = "studentResults";
const SUBJECTS = ["english", "math", "science", "social", "computer"];
const SUBJECT_LABELS = {
    english: "English",
    math: "Math",
    science: "Science",
    social: "Social Studies",
    computer: "Computer"
};
const MAX_MARKS = SUBJECTS.length * 100;
const SAMPLE_STUDENTS = [
    {
        name: "Ayesha Khan",
        rollNo: "R-101",
        loginId: "STU-101",
        loginUsername: "ayesha101",
        loginPassword: "pass101",
        className: "10-A",
        gender: "Female",
        course: "Computer Science",
        feesStatus: "Paid",
        attendanceStatus: "Present",
        marks: { english: 88, math: 92, science: 85, social: 81, computer: 95 }
    },
    {
        name: "Rahul Sharma",
        rollNo: "R-102",
        loginId: "STU-102",
        loginUsername: "rahul102",
        loginPassword: "pass102",
        className: "10-A",
        gender: "Male",
        course: "Mathematics",
        feesStatus: "Unpaid",
        attendanceStatus: "Present",
        marks: { english: 76, math: 69, science: 73, social: 78, computer: 82 }
    },
    {
        name: "Priya Verma",
        rollNo: "R-103",
        loginId: "STU-103",
        loginUsername: "priya103",
        loginPassword: "pass103",
        className: "10-B",
        gender: "Female",
        course: "Science",
        feesStatus: "Paid",
        attendanceStatus: "Absent",
        marks: { english: 91, math: 87, science: 89, social: 84, computer: 90 }
    },
    {
        name: "Mohit Singh",
        rollNo: "R-104",
        loginId: "STU-104",
        loginUsername: "mohit104",
        loginPassword: "pass104",
        className: "10-B",
        gender: "Male",
        course: "Computer Science",
        feesStatus: "Unpaid",
        attendanceStatus: "Present",
        marks: { english: 38, math: 44, science: 41, social: 36, computer: 49 }
    }
];

let students = [];
let editingId = null;

const studentForm = document.getElementById("studentForm");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const searchInput = document.getElementById("searchInput");
const quickSearchInput = document.getElementById("quickSearchInput");
const quickSearchBtn = document.getElementById("quickSearchBtn");
const genderFilter = document.getElementById("genderFilter");
const feesFilter = document.getElementById("feesFilter");
const todayFilter = document.getElementById("todayFilter");
const statusFilter = document.getElementById("statusFilter");
const gradeFilter = document.getElementById("gradeFilter");
const tableBody = document.getElementById("resultTableBody");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");
const studentLoginForm = document.getElementById("studentLoginForm");
const studentRegisterForm = document.getElementById("studentRegisterForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const fields = {
    studentName: document.getElementById("studentName"),
    rollNo: document.getElementById("rollNo"),
    loginId: document.getElementById("loginId"),
    loginUsername: document.getElementById("loginUsername"),
    loginPassword: document.getElementById("loginPassword"),
    className: document.getElementById("className"),
    gender: document.getElementById("gender"),
    course: document.getElementById("course"),
    feesStatus: document.getElementById("feesStatus"),
    attendanceStatus: document.getElementById("attendanceStatus"),
    english: document.getElementById("english"),
    math: document.getElementById("math"),
    science: document.getElementById("science"),
    social: document.getElementById("social"),
    computer: document.getElementById("computer")
};

const loginFields = {
    studentLoginId: document.getElementById("studentLoginId"),
    studentLoginUsername: document.getElementById("studentLoginUsername"),
    studentLoginPassword: document.getElementById("studentLoginPassword")
};

const registerFields = {
    studentName: document.getElementById("registerStudentName"),
    rollNo: document.getElementById("registerRollNo"),
    loginId: document.getElementById("registerLoginId"),
    loginUsername: document.getElementById("registerLoginUsername"),
    loginPassword: document.getElementById("registerLoginPassword"),
    className: document.getElementById("registerClassName"),
    gender: document.getElementById("registerGender"),
    course: document.getElementById("registerCourse"),
    feesStatus: document.getElementById("registerFeesStatus"),
    attendanceStatus: document.getElementById("registerAttendanceStatus"),
    english: document.getElementById("registerEnglish"),
    math: document.getElementById("registerMath"),
    science: document.getElementById("registerScience"),
    social: document.getElementById("registerSocial"),
    computer: document.getElementById("registerComputer")
};

studentForm.addEventListener("submit", handleFormSubmit);
studentLoginForm.addEventListener("submit", handleStudentLoginSubmit);
studentRegisterForm.addEventListener("submit", handleStudentRegisterSubmit);
resetBtn.addEventListener("click", resetForm);
clearAllBtn.addEventListener("click", clearAllStudents);
searchInput.addEventListener("input", renderTable);
quickSearchBtn.addEventListener("click", handleQuickSearch);
quickSearchInput.addEventListener("keydown", handleQuickSearchKeydown);
genderFilter.addEventListener("change", renderTable);
feesFilter.addEventListener("change", renderTable);
todayFilter.addEventListener("change", renderTable);
statusFilter.addEventListener("change", renderTable);
gradeFilter.addEventListener("change", renderTable);

document.addEventListener("DOMContentLoaded", () => {
    loadStudents();
    renderApp();
});

function loadStudents() {
    const savedStudents = localStorage.getItem(STORAGE_KEY);

    if (!savedStudents) {
        students = getSampleStudents();
        return;
    }

    try {
        const parsedStudents = JSON.parse(savedStudents);
        students = Array.isArray(parsedStudents)
            ? parsedStudents.map((student, index) => normalizeStudent(student, index))
            : getSampleStudents();
        saveStudents();
    } catch (error) {
        students = getSampleStudents();
        saveStudents();
    }
}

function saveStudents() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function handleFormSubmit(event) {
    event.preventDefault();

    const studentData = createStudentFromForm();
    if (!studentData) {
        return;
    }

    const duplicateRoll = students.find((student) => {
        return student.rollNo.toLowerCase() === studentData.rollNo.toLowerCase() && student.id !== editingId;
    });

    if (duplicateRoll) {
        showMessage("A student with this roll number already exists.", "error");
        return;
    }

    const duplicateLoginId = students.find((student) => {
        return student.loginId.toLowerCase() === studentData.loginId.toLowerCase() && student.id !== editingId;
    });

    if (duplicateLoginId) {
        showMessage("A student with this login ID already exists.", "error");
        return;
    }

    const duplicateUsername = students.find((student) => {
        return student.loginUsername.toLowerCase() === studentData.loginUsername.toLowerCase() && student.id !== editingId;
    });

    if (duplicateUsername) {
        showMessage("A student with this username already exists.", "error");
        return;
    }

    if (editingId) {
        students = students.map((student) => {
            return student.id === editingId ? { ...studentData, id: editingId } : student;
        });
        showMessage("Student result updated successfully.", "success");
    } else {
        students.push({ ...studentData, id: createId() });
        showMessage("Student result added successfully.", "success");
    }

    saveStudents();
    renderApp();
    resetForm(false);
}

function handleStudentLoginSubmit(event) {
    event.preventDefault();

    const loginId = loginFields.studentLoginId.value.trim().toUpperCase();
    const username = loginFields.studentLoginUsername.value.trim();
    const password = loginFields.studentLoginPassword.value.trim();

    if (!loginId || !username || !password) {
        showLoginMessage("Please enter student ID, username, and password.", "error");
        return;
    }

    const matchedStudent = students.find((student) => {
        return student.loginId.toLowerCase() === loginId.toLowerCase() &&
            student.loginUsername.toLowerCase() === username.toLowerCase() &&
            student.loginPassword === password;
    });

    if (!matchedStudent) {
        showLoginMessage("Login details do not match any student record.", "error");
        return;
    }

    showLoginMessage(`Login successful for ${matchedStudent.name}. Result: ${matchedStudent.percentage}% (${matchedStudent.grade})`, "success");
    searchInput.value = matchedStudent.loginId;
    quickSearchInput.value = matchedStudent.loginId;
    renderTable();
    scrollToRecords();
}

function handleStudentRegisterSubmit(event) {
    event.preventDefault();

    const studentData = createStudentFromRegisterForm();
    if (!studentData) {
        return;
    }

    const duplicateRoll = students.find((student) => {
        return student.rollNo.toLowerCase() === studentData.rollNo.toLowerCase();
    });

    if (duplicateRoll) {
        showRegisterMessage("A student with this roll number already exists.", "error");
        return;
    }

    const duplicateLoginId = students.find((student) => {
        return student.loginId.toLowerCase() === studentData.loginId.toLowerCase();
    });

    if (duplicateLoginId) {
        showRegisterMessage("A student with this login ID already exists.", "error");
        return;
    }

    const duplicateUsername = students.find((student) => {
        return student.loginUsername.toLowerCase() === studentData.loginUsername.toLowerCase();
    });

    if (duplicateUsername) {
        showRegisterMessage("A student with this username already exists.", "error");
        return;
    }

    students.push({ ...studentData, id: createId() });
    saveStudents();
    renderApp();
    studentRegisterForm.reset();
    showRegisterMessage("Student registered successfully. You can login with these details now.", "success");
}

function handleQuickSearch() {
    searchInput.value = quickSearchInput.value.trim();
    renderTable();
    scrollToRecords();
}

function handleQuickSearchKeydown(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        handleQuickSearch();
    }
}

function createStudentFromForm() {
    const name = fields.studentName.value.trim();
    const rollNo = fields.rollNo.value.trim();
    const loginId = fields.loginId.value.trim().toUpperCase();
    const loginUsername = fields.loginUsername.value.trim();
    const loginPassword = fields.loginPassword.value.trim();
    const className = fields.className.value.trim();
    const gender = fields.gender.value;
    const course = fields.course.value.trim();
    const feesStatus = fields.feesStatus.value;
    const attendanceStatus = fields.attendanceStatus.value;

    if (!name || !rollNo || !loginId || !loginUsername || !loginPassword || !className || !gender || !course || !feesStatus || !attendanceStatus) {
        showMessage("Please fill in student details, gender, course, fees status, attendance, and class.", "error");
        return null;
    }

    const marks = {};

    for (const subject of SUBJECTS) {
        const value = Number(fields[subject].value);

        if (fields[subject].value === "" || Number.isNaN(value) || value < 0 || value > 100) {
            showMessage("Please enter valid marks from 0 to 100 for every subject.", "error");
            fields[subject].focus();
            return null;
        }

        marks[subject] = value;
    }

    const result = calculateResult(marks);

    return {
        name,
        rollNo,
        loginId,
        loginUsername,
        loginPassword,
        className,
        gender,
        course,
        feesStatus,
        attendanceStatus,
        marks,
        ...result
    };
}

function createStudentFromRegisterForm() {
    const name = registerFields.studentName.value.trim();
    const rollNo = registerFields.rollNo.value.trim();
    const loginId = registerFields.loginId.value.trim().toUpperCase();
    const loginUsername = registerFields.loginUsername.value.trim();
    const loginPassword = registerFields.loginPassword.value.trim();
    const className = registerFields.className.value.trim();
    const gender = registerFields.gender.value;
    const course = registerFields.course.value.trim();
    const feesStatus = registerFields.feesStatus.value;
    const attendanceStatus = registerFields.attendanceStatus.value;

    if (!name || !rollNo || !loginId || !loginUsername || !loginPassword || !className || !gender || !course || !feesStatus || !attendanceStatus) {
        showRegisterMessage("Please fill in student details, gender, course, fees status, attendance, and class.", "error");
        return null;
    }

    const marks = {};

    for (const subject of SUBJECTS) {
        const value = Number(registerFields[subject].value);

        if (registerFields[subject].value === "" || Number.isNaN(value) || value < 0 || value > 100) {
            showRegisterMessage("Please enter valid marks from 0 to 100 for every subject.", "error");
            registerFields[subject].focus();
            return null;
        }

        marks[subject] = value;
    }

    const result = calculateResult(marks);

    return {
        name,
        rollNo,
        loginId,
        loginUsername,
        loginPassword,
        className,
        gender,
        course,
        feesStatus,
        attendanceStatus,
        marks,
        ...result
    };
}

function calculateResult(marks) {
    const total = SUBJECTS.reduce((sum, subject) => sum + Number(marks[subject] || 0), 0);
    const percentage = Number(((total / MAX_MARKS) * 100).toFixed(2));
    const grade = getGrade(percentage);
    const status = percentage >= 40 ? "Pass" : "Fail";

    return { total, percentage, grade, status };
}

function getGrade(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    if (percentage >= 40) return "E";
    return "F";
}

function renderApp() {
    renderStats();
    renderOverview();
    renderTable();
}

function renderStats() {
    const totalStudents = students.length;
    const totalGirls = students.filter((student) => normalizeText(student.gender) === "female").length;
    const totalBoys = students.filter((student) => normalizeText(student.gender) === "male").length;
    const totalCourses = new Set(students
        .map((student) => normalizeText(student.course))
        .filter(Boolean)).size;
    const feesPending = students.filter((student) => {
        const feesStatus = normalizeText(student.feesStatus);
        return feesStatus === "unpaid" || feesStatus === "pending";
    }).length;
    const presentToday = students.filter((student) => normalizeText(student.attendanceStatus) === "present").length;

    document.getElementById("totalStudents").textContent = totalStudents;
    document.getElementById("totalGirls").textContent = totalGirls;
    document.getElementById("totalBoys").textContent = totalBoys;
    document.getElementById("totalCourses").textContent = totalCourses;
    document.getElementById("feesPending").textContent = feesPending;
    document.getElementById("presentToday").textContent = presentToday;
}

function renderOverview() {
    const topPerformer = [...students].sort((first, second) => second.percentage - first.percentage)[0];
    const subjectAverages = calculateSubjectAverages();
    const topSubject = subjectAverages.reduce((best, subject) => {
        return subject.average > best.average ? subject : best;
    }, { label: "-", average: 0 });
    const passedStudents = students.filter((student) => student.status === "Pass").length;
    const passRate = students.length ? (passedStudents / students.length) * 100 : 0;

    document.getElementById("topPerformer").textContent = topPerformer ? topPerformer.name : "-";
    document.getElementById("topPerformerScore").textContent = topPerformer
        ? `${topPerformer.percentage}% with grade ${topPerformer.grade}`
        : "No data available";
    document.getElementById("topSubject").textContent = topSubject.label;
    document.getElementById("topSubjectScore").textContent = students.length
        ? `${topSubject.average.toFixed(1)} average marks`
        : "No data available";
    document.getElementById("passRate").textContent = `${passRate.toFixed(1)}%`;
    document.getElementById("passRateText").textContent = students.length
        ? `${passedStudents} out of ${students.length} students passed`
        : "No students added yet";

    renderSubjectAverages(subjectAverages);
}

function calculateSubjectAverages() {
    return SUBJECTS.map((subject) => {
        const total = students.reduce((sum, student) => sum + Number(student.marks[subject] || 0), 0);
        const average = students.length ? total / students.length : 0;

        return {
            key: subject,
            label: SUBJECT_LABELS[subject],
            average
        };
    });
}

function renderSubjectAverages(subjectAverages) {
    const subjectAveragesEl = document.getElementById("subjectAverages");

    subjectAveragesEl.innerHTML = subjectAverages.map((subject) => {
        const width = Math.max(0, Math.min(subject.average, 100));

        return `
            <div class="subject-row">
                <div class="subject-row-top">
                    <span>${subject.label}</span>
                    <strong>${subject.average.toFixed(1)}%</strong>
                </div>
                <div class="progress-track" aria-label="${subject.label} average ${subject.average.toFixed(1)} percent">
                    <span style="width: ${width}%"></span>
                </div>
            </div>
        `;
    }).join("");
}

function renderTable() {
    const filteredStudents = getFilteredStudents();

    tableBody.innerHTML = "";

    if (filteredStudents.length === 0) {
        emptyState.classList.add("show");
        return;
    }

    emptyState.classList.remove("show");

    filteredStudents.forEach((student, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="#">${index + 1}</td>
            <td data-label="Name">${escapeHtml(student.name)}</td>
            <td data-label="Roll No">${escapeHtml(student.rollNo)}</td>
            <td data-label="Login ID"><span class="login-pill">${escapeHtml(student.loginId)}</span></td>
            <td data-label="Username">${escapeHtml(student.loginUsername)}</td>
            <td data-label="Password"><button type="button" class="password-pill password-toggle" data-password="${escapeHtml(student.loginPassword)}" data-hidden="true" onclick="togglePasswordVisibility(this)" aria-label="Show password">••••••</button></td>
            <td data-label="Class">${escapeHtml(student.className)}</td>
            <td data-label="Gender">${escapeHtml(student.gender)}</td>
            <td data-label="Course">${escapeHtml(student.course)}</td>
            <td data-label="Fees"><span class="badge ${student.feesStatus === "Pending" ? "badge-grade-mid" : "badge-pass"}">${escapeHtml(student.feesStatus)}</span></td>
            <td data-label="Today"><span class="badge ${student.attendanceStatus === "Present" ? "badge-pass" : "badge-fail"}">${escapeHtml(student.attendanceStatus)}</span></td>
            <td data-label="English">${student.marks.english}</td>
            <td data-label="Math">${student.marks.math}</td>
            <td data-label="Science">${student.marks.science}</td>
            <td data-label="Social">${student.marks.social}</td>
            <td data-label="Computer">${student.marks.computer}</td>
            <td data-label="Total">${student.total}/${MAX_MARKS}</td>
            <td data-label="Percentage">${student.percentage}%</td>
            <td data-label="Grade"><span class="badge ${getGradeBadgeClass(student.grade)}">${student.grade}</span></td>
            <td data-label="Result"><span class="badge ${student.status === "Pass" ? "badge-pass" : "badge-fail"}">${student.status}</span></td>
            <td data-label="Actions">
                <div class="action-group">
                    <button type="button" class="btn btn-small btn-edit" onclick="editStudent('${student.id}')"><i class="bi bi-pencil-square" aria-hidden="true"></i> Edit</button>
                    <button type="button" class="btn btn-small btn-danger" onclick="deleteStudent('${student.id}')"><i class="bi bi-trash3" aria-hidden="true"></i> Delete</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function getFilteredStudents() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedGender = genderFilter.value;
    const selectedFees = feesFilter.value;
    const selectedToday = todayFilter.value;
    const selectedStatus = statusFilter.value;
    const selectedGrade = gradeFilter.value;

    return students.filter((student) => {
        const studentFeesStatus = normalizeText(student.feesStatus);
        const matchesSearch =
            student.name.toLowerCase().includes(searchTerm) ||
            student.rollNo.toLowerCase().includes(searchTerm) ||
            student.loginId.toLowerCase().includes(searchTerm) ||
            student.loginUsername.toLowerCase().includes(searchTerm) ||
            student.className.toLowerCase().includes(searchTerm) ||
            student.gender.toLowerCase().includes(searchTerm) ||
            student.course.toLowerCase().includes(searchTerm) ||
            student.feesStatus.toLowerCase().includes(searchTerm) ||
            student.attendanceStatus.toLowerCase().includes(searchTerm);
        const matchesGender = selectedGender === "all" || student.gender === selectedGender;
        const matchesFees = selectedFees === "all" ||
            student.feesStatus === selectedFees ||
            (selectedFees === "Unpaid" && studentFeesStatus === "pending");
        const matchesToday = selectedToday === "all" || student.attendanceStatus === selectedToday;
        const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
        const matchesGrade = selectedGrade === "all" || student.grade === selectedGrade;

        return matchesSearch && matchesGender && matchesFees && matchesToday && matchesStatus && matchesGrade;
    });
}

function editStudent(id) {
    const student = students.find((item) => item.id === id);

    if (!student) {
        return;
    }

    editingId = id;
    fields.studentName.value = student.name;
    fields.rollNo.value = student.rollNo;
    fields.loginId.value = student.loginId;
    fields.loginUsername.value = student.loginUsername;
    fields.loginPassword.value = student.loginPassword;
    fields.className.value = student.className;
    fields.gender.value = student.gender;
    fields.course.value = student.course;
    fields.feesStatus.value = student.feesStatus;
    fields.attendanceStatus.value = student.attendanceStatus;

    SUBJECTS.forEach((subject) => {
        fields[subject].value = student.marks[subject];
    });

    submitBtn.innerHTML = '<i class="bi bi-pencil-square" aria-hidden="true"></i> Update Result';
    document.getElementById("form-title").textContent = "Update Student Result";
    showMessage("Editing mode is active. Update the form and submit.", "success");
    studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function togglePasswordVisibility(button) {
    const isHidden = button.dataset.hidden === "true";

    button.textContent = isHidden ? button.dataset.password : "••••••";
    button.dataset.hidden = isHidden ? "false" : "true";
    button.setAttribute("aria-label", isHidden ? "Hide password" : "Show password");
}

function deleteStudent(id) {
    const student = students.find((item) => item.id === id);

    if (!student) {
        return;
    }

    const confirmed = confirm(`Delete result for ${student.name}?`);
    if (!confirmed) {
        return;
    }

    students = students.filter((item) => item.id !== id);
    saveStudents();
    renderApp();

    if (editingId === id) {
        resetForm(false);
    }

    showMessage("Student result deleted successfully.", "success");
}

function clearAllStudents() {
    if (students.length === 0) {
        showMessage("There are no records to clear.", "error");
        return;
    }

    const confirmed = confirm("Are you sure you want to delete all student records?");
    if (!confirmed) {
        return;
    }

    students = [];
    saveStudents();
    resetForm(false);
    renderApp();
    showMessage("All student records have been cleared.", "success");
}

function resetForm(clearMessage = true) {
    studentForm.reset();
    editingId = null;
    submitBtn.innerHTML = '<i class="bi bi-plus-circle-fill" aria-hidden="true"></i> Add Result';
    document.getElementById("form-title").textContent = "Add Student Result";

    if (clearMessage) {
        showMessage("", "");
    }
}

function showMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-note ${type}`.trim();
}

function showLoginMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `form-note ${type}`.trim();
}

function showRegisterMessage(message, type) {
    registerMessage.textContent = message;
    registerMessage.className = `form-note ${type}`.trim();
}

function scrollToRecords() {
    document.getElementById("records").scrollIntoView({ behavior: "smooth", block: "start" });
}

function getGradeBadgeClass(grade) {
    if (["A+", "A", "B"].includes(grade)) {
        return "badge-grade-good";
    }

    if (["C", "D", "E"].includes(grade)) {
        return "badge-grade-mid";
    }

    return "badge-grade-low";
}

function getSampleStudents() {
    return SAMPLE_STUDENTS.map((student, index) => normalizeStudent(student, index));
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function normalizeStudent(student, index) {
    const marks = {};

    SUBJECTS.forEach((subject) => {
        marks[subject] = Number(student.marks && student.marks[subject] ? student.marks[subject] : 0);
    });

    return {
        id: student.id || createId(),
        name: student.name || `Student ${index + 1}`,
        rollNo: student.rollNo || `R-${index + 101}`,
        loginId: (student.loginId || createFallbackLoginId(student, index)).toUpperCase(),
        loginUsername: student.loginUsername || createFallbackUsername(student, index),
        loginPassword: student.loginPassword || createFallbackPassword(student, index),
        className: student.className || "Not Assigned",
        gender: student.gender || "Unknown",
        course: student.course || "General",
        feesStatus: student.feesStatus || "Paid",
        attendanceStatus: student.attendanceStatus || "Absent",
        marks,
        ...calculateResult(marks)
    };
}

function createFallbackLoginId(student, index) {
    if (student.rollNo) {
        return `LOGIN-${String(student.rollNo).replace(/\s+/g, "-")}`;
    }

    return `STU-${index + 101}`;
}

function createFallbackUsername(student, index) {
    if (student.name) {
        return String(student.name).toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12) || `student${index + 101}`;
    }

    return `student${index + 101}`;
}

function createFallbackPassword(student, index) {
    if (student.rollNo) {
        return `pass-${String(student.rollNo).replace(/\s+/g, "-")}`;
    }

    return `pass${index + 101}`;
}

function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
