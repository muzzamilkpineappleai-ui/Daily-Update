import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../../../Styles/Report/resultReport.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

import viewIcon from "../../../assets/icons/view.png";
import closeIcon from "../../../assets/icons/Close.png";
import searchIcon from "../../../assets/icons/searchButton.png";

import AddResultsModal from "./AddResultsModal";

const StudentResults = () => {
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [grade, setGrade] = useState("");
  const [exam, setExam] = useState("");

  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [exams, setExams] = useState([]);
  const [allExams, setAllExams] = useState([]);

  const [studentsMap, setStudentsMap] = useState({}); // { userId: { name, results: {examId: result} } }

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const pdfRef = useRef(null);

  // ===============================
  // INITIAL FETCHES
  // ===============================
  useEffect(() => {
    fetchCourses();
    fetchAllGrades();
    fetchAllResults(); // Load everything on mount
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/courses");
      setCourses(res.data);
    } catch (error) {
      console.error("Error fetching courses", error);
    }
  };

  const fetchAllGrades = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/results/grades");
      setGrades(res.data);
    } catch (error) {
      console.error("Error fetching grades", error);
    }
  };

  // ===============================
  // UNIFIED RESULT FETCHING & NORMALIZATION
  // ===============================
  const normalizeAndSetStudents = (studentsData, examsData = []) => {
    const map = {};

    studentsData.forEach((item) => {
      const userId = item.user_id || item.id || item.user.id;
      const name = item.user_name || `${item.user?.first_name || item.first_name} ${item.user?.last_name || item.last_name}`;

      if (!map[userId]) {
        map[userId] = {
          userId,
          name,
          results: {}, // { examId: result }
        };
      }

      // Determine result and exam ID
      let result = null;
      let examId = null;

      if (item.results && typeof item.results === "object") {
        Object.assign(map[userId].results, item.results);
      } else if (item.result !== undefined && item.result !== null && item.result !== "") {
        examId = item.exam_id || examsData[0]?.id;
        result = item.result;
      } else if (item.exam_id && item.result !== undefined) {
        result = item.result === "" || item.result === null ? "AB" : item.result;
        examId = item.exam_id;
      }

      if (examId && result !== undefined) {
        map[userId].results[examId] = result === "" || result === null || result === "A" ? "AB" : result;
      }
    });

    setStudentsMap(map);
    if (examsData.length > 0) setAllExams(examsData);
  };

  const fetchAllResults = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/results/all");
      normalizeAndSetStudents(res.data.students || [], res.data.exams || []);
    } catch (error) {
      console.error("Error fetching all results", error);
    }
  };

  const fetchByCourse = async (courseId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/results/by-course?course_id=${courseId}`);
      normalizeAndSetStudents(res.data.students || [], res.data.exams || []);
    } catch (error) {
      console.error("Error fetching by course", error);
    }
  };

  const fetchByCourseAndGrade = async (courseId, gradeId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/results/by-course-grade?course_id=${courseId}&grade_id=${gradeId}`);
      normalizeAndSetStudents(res.data.students || [], res.data.exams || []);
    } catch (error) {
      console.error("Error fetching by course & grade", error);
    }
  };

  const fetchByExam = async (examId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/results/students-for-exam?exam_id=${examId}`);
      const normalized = res.data.map((s) => ({
        user_id: s.id,
        user_name: `${s.first_name} ${s.last_name}`,
        result: s.result === null || s.result === "" ? "AB" : s.result,
        exam_id: examId,
      }));
      normalizeAndSetStudents(normalized);
    } catch (error) {
      console.error("Error fetching by exam", error);
    }
  };

  // ===============================
  // FILTER HANDLERS
  // ===============================
  const handleCourseChange = async (e) => {
    const val = e.target.value;
    setCourse(val);
    setGrade("");
    setExam("");
    setExams([]);

    if (val) {
      try {
        const res = await axios.get(`http://localhost:5000/api/exam/grades/course/${val}`);
        setGrades(res.data);
      } catch (err) {
        console.error(err);
      }
      fetchByCourse(val);
    } else {
      setGrades([]); // Or refetch all grades if needed
      fetchAllResults();
    }
  };

  const handleGradeChange = async (e) => {
    const val = e.target.value;
    setGrade(val);
    setExam("");
    setExams([]);

    if (val && course) {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/exam/exams/course-grade?courseId=${course}&gradeId=${val}`
        );
        setExams(res.data);
      } catch (err) {
        console.error(err);
      }
      fetchByCourseAndGrade(course, val);
    } else if (course) {
      fetchByCourse(course);
    } else {
      fetchAllResults();
    }
  };

  const handleExamChange = (e) => {
    const val = e.target.value;
    setExam(val);

    if (val) {
      fetchByExam(val);
    } else if (grade && course) {
      fetchByCourseAndGrade(course, grade);
    } else if (course) {
      fetchByCourse(course);
    } else {
      fetchAllResults();
    }
  };

  // ===============================
  // FILTERED & SEARCHED STUDENTS
  // ===============================
  const studentList = Object.values(studentsMap)
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get current result for table (priority: selected exam → any result → AB)
  const getCurrentResult = (student) => {
    if (exam && student.results[exam] !== undefined) {
      return student.results[exam];
    }
    const anyResult = Object.values(student.results).find((r) => r && r !== "AB");
    return anyResult || Object.values(student.results)[0] || "AB";
  };

  // ===============================
  // PDF GENERATION
  // ===============================
  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);

    setTimeout(async () => {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, width, height);
      pdf.save("Student_Results_Report.pdf");

      setIsGeneratingPDF(false);
    }, 500);
  };

  return (
    <div className="rr-report-container">
      {/* TOP SECTION */}
      <div className="rr-top-section">
        <div>
          <div className="rr-search-container">
            <input
              type="text"
              placeholder="Search..."
              className="rr-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <img src={searchIcon} alt="search" className="rr-search-icon-right" />
          </div>

          <div className="rr-dropdown-row">
            <div className="rr-select-wrapper">
              <select value={course} onChange={handleCourseChange} className="rr-dropdown">
                <option value="">Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="rr-arrow">▾</span>
            </div>

            <div className="rr-select-wrapper">
              <select
                value={grade}
                onChange={handleGradeChange}
                className="rr-dropdown"
                disabled={!course}
              >
                <option value="">Grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.grade_name}
                  </option>
                ))}
              </select>
              <span className="rr-arrow">▾</span>
            </div>

            <div className="rr-select-wrapper">
              <select
                value={exam}
                onChange={handleExamChange}
                className="rr-dropdown"
                disabled={!grade}
              >
                <option value="">Exam</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.group_name}
                  </option>
                ))}
              </select>
              <span className="rr-arrow">▾</span>
            </div>
          </div>
        </div>

        <button className="rr-add-btn" onClick={() => setShowAddModal(true)}>
          + Add
        </button>
      </div>

      {/* FILTER DISPLAY */}
      <div className="rr-course-grade">
        {course && <p>Course: {courses.find((c) => c.id == course)?.name}</p>}
        {grade && <p>Grade: {grades.find((g) => g.id == grade)?.grade_name}</p>}
        {exam && <p>Exam: {exams.find((e) => e.id == exam)?.group_name || allExams.find((e) => e.id == exam)?.group_name}</p>}
      </div>

      {/* PDF CONTENT */}
      <div ref={pdfRef} className="pdf-content">
        {/* PDF-only header */}
        {isGeneratingPDF && (
          <div className="pdf-header">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <div>
                <h2>ARADANA</h2>
                <p>Music Academy</p>
              </div>
              <div>Date: {new Date().toLocaleDateString("en-GB")}</div>
            </div>
            <p style={{ fontWeight: "bold" }}>
              {course && `Course: ${courses.find((c) => c.id == course)?.name}`}
              {grade && ` | Grade: ${grades.find((g) => g.id == grade)?.grade_name}`}
              {exam && ` | Exam: ${(exams.find((e) => e.id == exam) || allExams.find((e) => e.id == exam))?.group_name}`}
            </p>
            <hr style={{ margin: "10px 0" }} />
          </div>
        )}

        {/* TABLE */}
        <table className="rr-table">
          <thead>
            <tr>
              <th className="rr-th">Name</th>
              <th className="rr-th">Result</th>
              {!isGeneratingPDF && <th className="rr-th">Action</th>}
            </tr>
          </thead>
          <tbody>
            {studentList.length === 0 ? (
              <tr>
                <td colSpan={isGeneratingPDF ? 2 : 3} className="rr-td">
                  No students found
                </td>
              </tr>
            ) : (
              studentList.map((student) => (
                <tr key={student.userId}>
                  <td className="rr-td">{student.name}</td>
                  <td className="rr-td">{getCurrentResult(student)}</td>
                  {!isGeneratingPDF && (
                    <td className="rr-td">
                      <img
                        src={viewIcon}
                        alt="View"
                        className="icon"
                        onClick={() => setSelectedStudent(student)}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Button - hidden during PDF generation */}
      {!isGeneratingPDF && (
        <button className="rr-generate-btn" onClick={handleGeneratePDF} disabled={isGeneratingPDF}>
          Generate PDF
        </button>
      )}

      {/* VIEW MODAL */}
      {selectedStudent && !isGeneratingPDF && (
        <div className="rr-modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="rr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rr-modal-header">
              <h3>Result Details</h3>
              <img src={closeIcon} alt="Close" className="rr-close-icon" onClick={() => setSelectedStudent(null)} />
            </div>
            <p>
              <strong>{selectedStudent.name}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {(exam ? [exams.find((e) => e.id == exam) || allExams.find((e) => e.id == exam)].filter(Boolean) : exams.length > 0 ? exams : allExams).map(
                  (e) => (
                    <tr key={e.id}>
                      <td>
                        {e.group_name} ({e.exam_type})
                      </td>
                      <td>{selectedStudent.results[e.id] || "-"}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {showAddModal && !isGeneratingPDF && <AddResultsModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default StudentResults;