import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../Styles/Exam/AddExam.css';

const AddExamForm = ({ onSubmit, onCancel, courses, initialData = {} }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    courseId: '',
    grade: '',
    startTime: '',
    endTime: '',
    examDate: '',
    examType: '',
    groupName: '',
  });
  const [isGroupCreated, setIsGroupCreated] = useState(false);

  useEffect(() => {
    // Initialize form with default values
    const initialForm = {
      courseId: '',
      grade: '',
      startTime: '',
      endTime: '',
      examDate: '',
      examType: '',
      groupName: '',
    };

    // Convert initialData.examDate to YYYY-MM-DD format if present
    const formattedInitialData = {
      ...initialData,
      examDate: initialData.examDate
        ? new Date(initialData.examDate).toISOString().split('T')[0]
        : '',
    };

    // Merge initialData and location.state.formData, prioritizing initialData
    const updatedFormData = {
      ...initialForm,
      ...formattedInitialData,
      ...location.state?.formData,
    };

    setFormData(updatedFormData);

    // Check if groupName exists and is non-empty
    setIsGroupCreated(
      updatedFormData.groupName && updatedFormData.groupName.trim() !== ''
    );
  }, [initialData, location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'groupName') {
      setIsGroupCreated(value.trim() !== '');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onCancel();
    // navigate('/exam', { replace: true, state: {} });
  };

  const handleCreateGroup = () => {
    navigate('/exam/student-selection', { state: { formData } });
  };

  const isFormValid = () => {
    return (
      formData.courseId &&
      formData.grade &&
      formData.startTime &&
      formData.endTime &&
      formData.examDate &&
      formData.examType &&
      formData.groupName &&
      formData.groupName.trim() !== '' &&
      isGroupCreated
    );
  };

  const handleClose = () => {
    onCancel();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{initialData.courseId ? 'Edit Exam' : 'Add Exam'}</h2>
          <button className="close-btn-top-right" onClick={handleClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label>Course</label>
                <select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleChange}
                >
                  <option value="">Select Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Exam Type</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                >
                  <option value="">e.g. Practical</option>
                  <option value="Theory">Theory</option>
                  <option value="Practical">Practical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  placeholder="e.g. 6:00 AM"
                />
              </div>
            </div>
            <div className="form-column">
              <div className="form-group">
                <label>Grade</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                >
                  <option value="">e.g. 02</option>
                  <option value="02">02</option>
                  <option value="05">05</option>
                </select>
              </div>
              <div className="form-group">
                <label>Exam Date</label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  placeholder="e.g. 12/02/2025"
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  placeholder="e.g. 6:00 AM"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              name="groupName"
              value={formData.groupName}
              onChange={handleChange}
            />
          </div>

          <button
            type="button"
            className="create-group-btn"
            onClick={handleCreateGroup}
          >
            Create Group
          </button>

          <div className="modal-footer">
            <button
              type="submit"
              className="submit-btn"
              disabled={!isFormValid()}
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExamForm;