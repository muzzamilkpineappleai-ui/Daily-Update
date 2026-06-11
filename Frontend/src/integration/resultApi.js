import axios from "axios";

const API_URL = "http://localhost:5000/api/results"; // ✅ FIXED

// =======================
// COURSES
// =======================
export const getCourses = async () => {
  return axios.get(`${API_URL}/courses`);
};

// =======================
// GRADES BY COURSE
// =======================
export const getGradesByCourse = async (courseId) => {
  return axios.get(`${API_URL}/grades/${courseId}`);
};

// =======================
// STUDENTS BY GRADE
// =======================
export const getStudentsByGrade = async (gradeId) => {
  return axios.get(`${API_URL}/students?grade_id=${gradeId}`);
};
