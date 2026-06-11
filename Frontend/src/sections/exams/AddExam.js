import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchGradesByCourse, fetchAllCourses } from '../../integration/examApi';
import '../../Styles/Exam/AddExam.css';

const AddExamForm = ({ onSubmit, onCancel, initialData = {} }) => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id: null,                    // Critical: preserve exam ID when editing
    courseId: '',
    grade: '',
    startTime: '',
    endTime: '',
    examDate: '',
    examType: '',
    groupName: '',
    student_ids: [],
  });

  const [validationErrors, setValidationErrors] = useState({
    course: '',
    grade: '',
  });

  const [isGroupCreated, setIsGroupCreated] = useState(false);

  // Load all courses on mount
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const data = await fetchAllCourses();
        setCourses(data || []);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  // Populate form when initialData changes (from edit or from StudentSelection)
  useEffect(() => {
    if (Object.keys(initialData).length === 0) return;

    const formatted = {
      id: initialData.id || null, // This survives the round-trip!
      courseId: initialData.courseId || '',
      grade: initialData.grade || initialData.gradeId || '',
      startTime: initialData.startTime || '',
      endTime: initialData.endTime || '',
      examDate: initialData.examDate
        ? new Date(initialData.examDate).toISOString().split('T')[0]
        : '',
      examType: initialData.examType || '',
      groupName: initialData.groupName || '',
      student_ids: initialData.student_ids || [],
    };

    setFormData(formatted);
    setIsGroupCreated(!!formatted.groupName?.trim());
  }, [initialData]);

  // Load grades when course changes
  useEffect(() => {
    const loadGrades = async () => {
      if (!formData.courseId) {
        setGrades([]);
        return;
      }
      setLoadingGrades(true);
      try {
        const data = await fetchGradesByCourse(formData.courseId);
        setGrades(data || []);
      } catch (err) {
        console.error('Failed to fetch grades:', err);
        setGrades([]);
      } finally {
        setLoadingGrades(false);
      }
    };
    loadGrades();
  }, [formData.courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation errors
    if (name === 'courseId') setValidationErrors((prev) => ({ ...prev, course: '' }));
    if (name === 'grade') setValidationErrors((prev) => ({ ...prev, grade: '' }));
  };

  const handleCreateGroup = () => {
    // Validate course & grade
    let hasError = false;
    const errors = { course: '', grade: '' };

    if (!formData.courseId) {
      errors.course = 'Please select a course';
      hasError = true;
    }
    if (!formData.grade) {
      errors.grade = 'Please select a grade';
      hasError = true;
    }

    setValidationErrors(errors);
    if (hasError) return;

    const selectedCourse = courses.find((c) => c.id === Number(formData.courseId));
    const selectedGrade = grades.find((g) => g.id === Number(formData.grade));

    // Navigate to student selection with FULL data including exam ID
    navigate('/exam/student-selection', {
      replace: false,
      state: {
        formData: {
          ...formData,
          id: formData.id, // Critical: preserve when editing
          courseName: selectedCourse?.name || 'Unknown Course',
          gradeName: selectedGrade?.grade_name || selectedGrade?.name || 'Unknown Grade',
        },
      },
    });
  };

  const isFormValid = () =>
    formData.courseId &&
    formData.grade &&
    formData.examType &&
    formData.examDate &&
    formData.startTime &&
    formData.endTime &&
    formData.groupName.trim() &&
    formData.student_ids.length > 0 &&
    isGroupCreated;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      // onSubmit will receive full formData including `id`
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addexam-modal-overlay">
      <div className="addexam-modal-content">
        <h2>{formData.id ? 'Edit Exam' : 'Add New Exam'}</h2>
        <button className="addexam-close-btn" onClick={onCancel}>×</button>

        <form onSubmit={handleSubmit}>
          <div className="addexam-form-columns">
            {/* Left Column */}
            <div className="addexam-form-column">
              <div className="addexam-form-group">
                <label>Course <span className="addexam-required-star">*</span></label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                  disabled={loadingCourses}
                  className={validationErrors.course ? 'addexam-error-border' : ''}
                >
                  <option value="">
                    {loadingCourses ? 'Loading courses...' : 'Select Course'}
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                {validationErrors.course && (
                  <p className="addexam-error-text">{validationErrors.course}</p>
                )}
              </div>

              <div className="addexam-form-group">
                <label>Exam Type <span className="addexam-required-star">*</span></label>
                <select name="examType" value={formData.examType} onChange={handleChange}>
                  <option value="">Select Type</option>
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>

              <div className="addexam-form-group">
                <label>Start Time <span className="addexam-required-star">*</span></label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="addexam-form-column">
              <div className="addexam-form-group">
                <label>Grade <span className="addexam-required-star">*</span></label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  disabled={loadingGrades || !formData.courseId}
                  className={validationErrors.grade ? 'addexam-error-border' : ''}
                >
                  <option value="">
                    {loadingGrades
                      ? 'Loading grades...'
                      : formData.courseId
                      ? 'Select Grade'
                      : 'First select a course'}
                  </option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.grade_name || `Grade ${grade.id}`}
                    </option>
                  ))}
                </select>
                {validationErrors.grade && (
                  <p className="addexam-error-text">{validationErrors.grade}</p>
                )}
              </div>

              <div className="addexam-form-group">
                <label>Exam Date <span className="addexam-required-star">*</span></label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow clearing the field
                    if (!value) {
                      handleChange(e);
                      return;
                    }

                    const year = value.split('-')[0];

                    // Block if year has more than 4 digits
                    if (year.length > 4) {
                      return; // ignore invalid change
                    }

                    handleChange(e);
                  }}
                  required
                />
              </div>

              <div className="addexam-form-group">
                <label>End Time <span className="addexam-required-star">*</span></label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Group Name - shown only after group created */}
          {isGroupCreated && (
            <div className="addexam-form-group addexam-full-width">
              <label>Group Name</label>
              <input
                type="text"
                name="groupName"
                value={formData.groupName}
                onChange={handleChange}
                placeholder="e.g., Morning Batch, Violin Elite"
                readOnly
              />
            </div>
          )}

          {/* Button to select students */}
          <button
            type="button"
            className="addexam-create-group-btn"
            onClick={handleCreateGroup}
          >
            {formData.id ? 'Edit Group' : 'Create Group'}
          </button>

          {/* Final Submit */}
          <div className="addexam-modal-footer">
            <button
              type="submit"
              className="addexam-submit-btn"
              disabled={!isFormValid() || submitting}
            >
              {submitting
                ? 'Saving...'
                : formData.id
                ? 'Update Exam'
                : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExamForm;
