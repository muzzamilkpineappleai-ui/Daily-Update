import React, { useState, useEffect } from "react";
import axios from "axios";
import closeIcon from "../../../assets/icons/Close.png";
import "../../../Styles/Report/AddResultsModal.css";

const AddResultsModal = ({ onClose }) => {
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [students, setStudents] = useState([]);
  const [studentResults, setStudentResults] = useState({});
  
  useEffect(() => {
    // Fetch courses and all students on component mount
    fetchCourses();
    fetchAllStudents();
  }, []);
  
  const fetchCourses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/results/courses");
      setCourses(response.data);
    } catch (error) {
      console.error("❌ Error fetching courses", error);
    }
  };
  
  const fetchGradesByCourse = async (courseId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/exam/grades/course/${courseId}`);
      setGrades(response.data);
    } catch (error) {
      console.error("❌ Error fetching grades by course", error);
    }
  };
  
  const fetchExamsByCourseAndGrade = async (courseId, gradeId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/exam/exams/course-grade?courseId=${courseId}&gradeId=${gradeId}`
      );
      setExams(response.data);
    } catch (error) {
      console.error("❌ Error fetching exams by course and grade", error);
    }
  };
  
  const fetchStudentsForExam = async (examId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/results/students-for-exam?exam_id=${examId}`);
      setStudents(response.data);
      
      // Initialize student results with existing values
      // If result is 'A', treat it as a default and initialize with 'AB' instead
      const initialResults = {};
      response.data.forEach(student => {
        if (student.result === 'A') {
          // If the result is 'A', it might be a default from the database
          // Initialize with 'AB' to indicate absence until user explicitly sets a grade
          initialResults[student.id] = "AB";
        } else if (student.result !== null && student.result !== undefined && student.result !== '') {
          // Use the actual result if it's not 'A' and not empty
          initialResults[student.id] = student.result;
        } else {
          // Default to 'AB' for null, undefined, or empty results
          initialResults[student.id] = "AB";
        }
      });
      setStudentResults(initialResults);
    } catch (error) {
      console.error("❌ Error fetching students for exam", error);
    }
  };
  
  // Fetch students for a specific grade (for when only grade is selected)
  const fetchStudentsForGrade = async (gradeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/results/students?grade_id=${gradeId}`);
      setStudents(response.data);
      
      // Initialize student results with default 'AB'
      const initialResults = {};
      response.data.forEach(student => {
        initialResults[student.id] = "AB";
      });
      setStudentResults(initialResults);
    } catch (error) {
      console.error("❌ Error fetching students for grade", error);
    }
  };
  
  // Fetch all students (for when no filters are selected)
  const fetchAllStudents = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users?page=1&limit=1000`); // Get all users
      // Filter to only get students
      const students = response.data.data.filter(user => user.role_name === 'student');
      setStudents(students);
      
      // Initialize student results with default 'AB'
      const initialResults = {};
      students.forEach(student => {
        initialResults[student.id] = "AB";
      });
      setStudentResults(initialResults);
    } catch (error) {
      console.error("❌ Error fetching all students", error);
    }
  };
  
  // Fetch students for a specific course (for when only course is selected)
  const fetchStudentsForCourse = async (courseId) => {
    try {
      // Since there's no direct API for students by course, we'll need to get grades for the course first
      // and then get students for those grades
      const gradesResponse = await axios.get(`http://localhost:5000/api/exam/grades/course/${courseId}`);
      const gradeIds = gradesResponse.data.map(grade => grade.id);
      
      // For each grade, fetch the students
      let allStudents = [];
      for (const gradeId of gradeIds) {
        try {
          const studentsResponse = await axios.get(`http://localhost:5000/api/results/students?grade_id=${gradeId}`);
          allStudents = allStudents.concat(studentsResponse.data);
        } catch (error) {
          console.error(`Error fetching students for grade ${gradeId}:`, error);
        }
      }
      
      setStudents(allStudents);
      
      // Initialize student results with default 'AB'
      const initialResults = {};
      allStudents.forEach(student => {
        initialResults[student.id] = "AB";
      });
      setStudentResults(initialResults);
    } catch (error) {
      console.error("❌ Error fetching students for course", error);
    }
  };
  
  // Fetch students for a specific course and grade combination
  const fetchStudentsForCourseAndGrade = async (courseId, gradeId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/results/students?grade_id=${gradeId}`);
      setStudents(response.data);
      
      // Initialize student results with default 'AB'
      const initialResults = {};
      response.data.forEach(student => {
        initialResults[student.id] = "AB";
      });
      setStudentResults(initialResults);
    } catch (error) {
      console.error("❌ Error fetching students for course and grade", error);
    }
  };
  
  // Handle course selection
  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    setSelectedGrade(""); // Reset grade when course changes
    setSelectedExam(""); // Reset exam when course changes
    setGrades([]);
    setExams([]);
    setStudents([]);
    setStudentResults({});
    
    if (courseId) {
      fetchGradesByCourse(courseId);
      // Fetch students for the selected course
      fetchStudentsForCourse(courseId);
    } else {
      // If no course is selected, fetch all students
      fetchAllStudents();
    }
  };
  
  // Handle grade selection
  const handleGradeChange = (e) => {
    const gradeId = e.target.value;
    setSelectedGrade(gradeId);
    setSelectedExam(""); // Reset exam when grade changes
    setExams([]);
    setStudents([]);
    setStudentResults({});
    
    if (gradeId && selectedCourse) {
      fetchExamsByCourseAndGrade(selectedCourse, gradeId);
      // Fetch students for the course and grade combination
      fetchStudentsForCourseAndGrade(selectedCourse, gradeId);
    } else if (selectedCourse) {
      // If only course is selected (grade is unselected), fetch students for the course
      fetchStudentsForCourse(selectedCourse);
    } else {
      // If no course is selected, fetch all students
      fetchAllStudents();
    }
  };
  
  // Handle exam selection
  const handleExamChange = (e) => {
    const examId = e.target.value;
    setSelectedExam(examId);
    setStudents([]);
    setStudentResults({});
    
    if (examId) {
      fetchStudentsForExam(examId);
    } else if (selectedGrade && selectedCourse) {
      // If exam is unselected but course and grade are selected, fetch students for course and grade
      fetchStudentsForCourseAndGrade(selectedCourse, selectedGrade);
    } else if (selectedCourse) {
      // If only course is selected, fetch students for that course
      fetchStudentsForCourse(selectedCourse);
    } else {
      // If no filters are selected, fetch all students
      fetchAllStudents();
    }
  };
  
  const handleResultChange = (studentId, result) => {
    setStudentResults(prev => ({
      ...prev,
      [studentId]: result
    }));
  };
  
  const handleSaveResults = async () => {
    if (!selectedExam) {
      alert("Please select an exam");
      return;
    }
    
    try {
      // Prepare results data
      const resultsData = [];
      students.forEach(student => {
        const resultValue = studentResults[student.id];
        // Include all students, even if they have 'AB' (absent) as result
        if (resultValue !== undefined && resultValue !== null) {
          resultsData.push({
            user_id: student.id,
            result: resultValue
          });
        }
      });
      
      if (resultsData.length === 0) {
        alert("No results to save");
        return;
      }
      
      // Send results to backend
      await axios.post("http://localhost:5000/api/results", {
        exam_id: selectedExam,
        results: resultsData
      });
      
      alert("Results saved successfully");
      onClose();
    } catch (error) {
      console.error("❌ Error saving results", error);
      alert("Error saving results");
    }
  };
  
  return (
    <div className="rr-add-overlay" onClick={onClose}>
      <div
        className="rr-add-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="rr-add-header">
          <h3>Add Results</h3>
          <img src={closeIcon} alt="Close" onClick={onClose} />
        </div>

        {/* COURSE, GRADE, AND EXAM SELECTION */}
        <div className="rr-add-body">
          <div className="rr-add-select-wrapper" style={{width: '120px', marginRight: '10px'}}>
            <select
              className="rr-add-dropdown"
              value={selectedCourse}
              onChange={handleCourseChange}
            >
              <option value="">Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            <span className="rr-add-arrow">▾</span>
          </div>
          
          <div className="rr-add-select-wrapper" style={{width: '120px', marginRight: '10px'}}>
            <select
              className="rr-add-dropdown"
              value={selectedGrade}
              onChange={handleGradeChange}
              disabled={!selectedCourse}
            >
              <option value="">Grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.grade_name}
                </option>
              ))}
            </select>
            <span className="rr-add-arrow">▾</span>
          </div>
          
          <div className="rr-add-select-wrapper" style={{width: '120px'}}>
            <select
              className="rr-add-dropdown"
              value={selectedExam}
              onChange={handleExamChange}
              disabled={!selectedGrade}
            >
              <option value="">Exam</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.group_name}
                </option>
              ))}
            </select>
            <span className="rr-add-arrow">▾</span>
          </div>
        </div>

        {/* 👇 SHOW TABLE PROGRESSIVELY BASED ON FILTERS */}
        {(selectedCourse || (!selectedCourse && students.length > 0)) && (
          <>
            <div className="rr-add-table-container">
              <table className="rr-add-table">
                <thead>
                  <tr>
                    <th className="rr-add-table-header-name">Name</th>
                    <th className="rr-add-table-header-result">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(
                    students.reduce((acc, student) => {
                      const key = student.id;
                      
                      // If this student id doesn't exist in accumulator, add the student
                      if (!acc[key]) {
                        acc[key] = { ...student };
                      }
                      
                      return acc;
                    }, {})
                  ).map((student) => {
                    const key = `${student.id}`; // Using just student id since we have one result per student
                    return (
                      <tr className="rr-add-table-row" key={student.id}>
                        <td className="rr-add-table-name">{student.first_name} {student.last_name}</td>
                        <td className="rr-add-table-result">
                          <select 
                            className="rr-add-result-dropdown"
                            value={studentResults[key] || ""}
                            onChange={(e) => handleResultChange(student.id, e.target.value)}
                            disabled={!selectedExam} // Disable the dropdown when exam is not selected
                          >
                            <option value="AB">AB</option>
                            <option value="">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="F">F</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rr-add-footer">
              <button 
                className="rr-update-btn" 
                onClick={handleSaveResults}
                disabled={!selectedExam} // Disable save button when exam is not selected
              >
                Update
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddResultsModal;
