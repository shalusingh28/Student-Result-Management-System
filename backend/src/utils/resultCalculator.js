const calculateGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
};

const calculateResult = (marks) => {
  const totalMarks = marks.reduce((sum, mark) => sum + Number(mark.total_marks || 0), 0);
  const maximumMarks = marks.reduce((sum, mark) => sum + Number(mark.max_marks || 100), 0);
  const percentage = maximumMarks ? Number(((totalMarks / maximumMarks) * 100).toFixed(2)) : 0;
  const gpa = Number((percentage / 10).toFixed(2));

  return {
    total_marks: totalMarks,
    maximum_marks: maximumMarks,
    percentage,
    gpa,
    cgpa: gpa,
    overall_grade: calculateGrade(percentage),
    final_result: percentage >= 40 ? "Pass" : "Fail",
    published_at: new Date(),
  };
};

module.exports = {
  calculateGrade,
  calculateResult,
};
