import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  fetchStudentsByCourseAndGrade,
  fetchSelectedStudents,
  API_IMAGE_URL,
} from "../../integration/examApi";
import "../../Styles/Exam/studentSelection.css";
import CloseIcon from "../../assets/icons/Close.png";
import GroupName from "../../assets/icons/GroupName.png";

const StudentSelection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialFormData = location.state?.formData || {};

  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(initialFormData.student_ids || []);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [groupName, setGroupName] = useState(initialFormData.groupName || "");

  const selectedCourseId = initialFormData.courseId || initialFormData.course;
  const selectedGradeId = initialFormData.grade || initialFormData.gradeId;
  const courseName = initialFormData.courseName || "Unknown Course";
  const gradeName = initialFormData.gradeName || "Unknown Grade";
  const examId = initialFormData.id || null;

  useEffect(() => {
    const loadStudents = async () => {
      try {
        if (!selectedCourseId || !selectedGradeId) return;

        const data = await fetchStudentsByCourseAndGrade(selectedCourseId, selectedGradeId);
        let selectedIds = initialFormData.student_ids || [];

        if (examId && selectedIds.length === 0) {
          const res = await fetchSelectedStudents(examId);
          selectedIds = res.selected || [];
        }

        const selectedSet = new Set(selectedIds);

        const sorted = [...data].sort((a, b) => {
          const aSelected = selectedSet.has(a.id);
          const bSelected = selectedSet.has(b.id);
          if (aSelected && !bSelected) return -1;
          if (!aSelected && bSelected) return 1;
          return a.first_name.localeCompare(b.first_name);
        });

        setStudents(sorted);
        setSelectedStudents(selectedIds);
        setGroupName(initialFormData.groupName || "");
      } catch (error) {
        console.error("Failed to load students:", error);
      }
    };

    loadStudents();
  }, [selectedCourseId, selectedGradeId, initialFormData.student_ids, examId]);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name || ""} ${student.last_name || ""}`.trim().toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const getStudentImage = (student) => {
    const photoPath = student.StudentDetail?.photo_url;
    if (!photoPath || photoPath.includes("default-avatar")) {
      return "https://www.gravatar.com/avatar/?d=mp";
    }
    if (photoPath.startsWith("http")) return photoPath;
    const base = API_IMAGE_URL || "";
    return `${base}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`;
  };

  const handleCheckboxChange = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDeleteStudent = (id) => {
    setSelectedStudents((prev) => prev.filter((s) => s !== id));
  };

  const handleNext = () => {
    if (selectedStudents.length === 0) return;
    setShowConfirmation(true);
  };

  const handleCreate = () => {
    navigate("/exam", {
      replace: true,
      state: {
        formData: {
          ...initialFormData,
          id: examId, // ← CRITICAL: Preserve exam ID!
          groupName: groupName.trim() || initialFormData.groupName || "",
          student_ids: selectedStudents,
          courseId: selectedCourseId,
          grade: selectedGradeId,
          courseName,
          gradeName,
          examType: initialFormData.examType,
          examDate: initialFormData.examDate,
          startTime: initialFormData.startTime,
          endTime: initialFormData.endTime,
        },
        openModal: true,
        fromStudentSelection: true,
      },
    });
  };

  return (
    <div className="student-selection-container">
      {!showConfirmation ? (
        <>
          <div className="student-header">
            <input
              type="text"
              className="student-search-input"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="student-filters">
              <div>Course: <b>{courseName}</b></div>
              <div>Grade: <b>{gradeName}</b></div>
            </div>
          </div>

          <div className="exam-student-cards">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <div
                    key={student.id}
                    className={`exam-student-card ${isSelected ? "selected" : ""}`}
                  >
                    <img
                      src={getStudentImage(student)}
                      alt={`${student.first_name} ${student.last_name}`}
                      className="exam-student-image"
                    />
                    <div className="student-info">
                      <p>{`${student.first_name} ${student.last_name}`}</p>
                    </div>
                    {student.group_name && (
                      <p className="student-group-label">
                        Group: <b>{student.group_name}</b>
                      </p>
                    )}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCheckboxChange(student.id)}
                    />
                  </div>
                );
              })
            ) : (
              <p className="no-students">No students found for this course/grade.</p>
            )}
          </div>

          <div className="button-row">
            <button
              className="next-btn"
              onClick={handleNext}
              disabled={selectedStudents.length === 0}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="confirmation-content">
            <div className="form-group">
              <div className="exam-group-name">
                <img src={GroupName} alt="Group" className="exam-groupname-img" />
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter Group Name (Required)"
                />
              </div>
            </div>

            <div className="exam-student-cards">
              {selectedStudents.map((id) => {
                const student = students.find((s) => s.id === id);
                if (!student) return null;
                return (
                  <div key={id} className="exam-student-card">
                    <button
                      className="stu-delete-btn"
                      onClick={() => handleDeleteStudent(id)}
                    >
                      <img src={CloseIcon} alt="close" className="exam-close-icon" />
                    </button>
                    <img
                      src={getStudentImage(student)}
                      alt={`${student.first_name} ${student.last_name}`}
                      className="exam-student-image"
                    />
                    <div className="student-info">
                      <p>{`${student.first_name} ${student.last_name}`}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="create-btn floating-create-btn"
            disabled={!groupName.trim()}
            onClick={handleCreate}
          >
            {examId ? "Update Group & Save" : "Create Group"}
          </button>
        </>
      )}
    </div>
  );
};

export default StudentSelection;