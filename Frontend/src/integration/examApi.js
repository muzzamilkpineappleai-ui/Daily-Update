import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/exam"; 
const API_IMAGE_URL = "http://localhost:5000";

export const fetchAllExams = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}`);
    return res.data;
  } catch (error) {
    console.error("Error fetching exams:", error);
    throw error;
  }
};

export const fetchExamById = async (examId) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/${examId}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching exam ${examId}:`, error);
    throw error;
  }
};

export const createExam = async (examData) => {
  try {
    const res = await axios.post(`${API_BASE_URL}`, examData);
    return res.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      const msg = error.response.data?.message || "Exam already exists";
      console.warn(msg);
      throw new Error(msg); // cleaner message
    }
    console.error("Error creating exam:", error);
    throw error;
  }
};


export const updateExam = async (examId, examData) => {
  try {
    const res = await axios.patch(`${API_BASE_URL}/${examId}`, examData);
    return res.data;
  } catch (error) {
    console.error("Error updating exam:", error);
    throw error;
  }
};

export const deleteExam = async (examId) => {
  try {
    const res = await axios.delete(`${API_BASE_URL}/${examId}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting exam:", error);
    throw error;
  }
};

export const fetchStudentsByCourseAndGrade = async (courseId, gradeId) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/students`, {
      params: { courseId, gradeId },  
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};


export const fetchSelectedStudents = async (examId) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/${examId}/students`);
    return res.data;
  } catch (error) {
    console.error("Error fetching selected students:", error);
    throw error;
  }
};

export const fetchGradesByCourse = async (courseId) => {
  try {
    const res = await axios.get(`${API_BASE_URL}/grades/course/${courseId}`);
    return res.data;  
  } catch (error) {
    console.error(`Error fetching grades for course ${courseId}:`, error);
    throw error;
  }
};

export const fetchAllCourses = async () => {
    try{
     const res = await axios.get(`${API_BASE_URL}/courses`);
     return res.data;
    } catch (error){
     console.error("Error fetching courses:", error);
     throw error;
    }

};

export {API_IMAGE_URL}