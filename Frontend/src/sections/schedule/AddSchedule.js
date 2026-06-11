import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../Styles/Schedule/AddSchedule.css';
import Toast from '../../modals/ToastModel';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import Close from '../../assets/icons/Close.png';
import Dropdown from '../../assets/icons/Filter.png';
import pencilIcon from '../../assets/icons/pencil_line.png';
import deleteIcon from '../../assets/icons/Delete.png';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import {
  createSchedule,
  updateSchedule,
  fetchCourses,
  fetchGrades,
  fetchLecturers,
  fetchBranches
} from '../../integration/scheduleAPI';

const AddSchedule = ({ isOpen, onClose, schedule, onUpdate, onAdd }) => {
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dayDropdownRef = useRef(null);

  const daysOfWeek = [
    { id: 1, name: 'Monday' },
    { id: 2, name: 'Tuesday' },
    { id: 3, name: 'Wednesday' },
    { id: 4, name: 'Thursday' },
    { id: 5, name: 'Friday' },
    { id: 6, name: 'Saturday' },
    { id: 7, name: 'Sunday' }
  ];

  const [formData, setFormData] = useState({
    user_id: '',
    course_id: '',
    grade_id: '',
    branch_id: '',
    days: [],
    startTime: '',
    endTime: '',
    slot_id: ''
  });

  const [toastData, setToastData] = useState({ title: '', message: '', icon: '' });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target)) {
        setIsDayDropdownOpen(false);
      }
    };

    if (isDayDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDayDropdownOpen]);

  // Fetch master data when modal opens
  useEffect(() => {
    const fetchMasterData = async () => {
      setLoading(true);
      try {
        const [coursesData, gradesData, lecturersData, branchesData] = await Promise.all([
          fetchCourses(),
          fetchGrades(),
          fetchLecturers(),
          fetchBranches()
        ]);

        setCourses(coursesData);
        setAllGrades(gradesData);
        setFilteredGrades(gradesData);
        setLecturers(lecturersData);
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to fetch master data:', error);
        setToastData({
          icon: Error,
          title: 'Error',
          message: error.message || 'Failed to load data'
        });
        setIsError(true);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchMasterData();
    }
  }, [isOpen]);

  // Filter grades by selected course
  useEffect(() => {
    if (formData.course_id) {
      const filtered = allGrades.filter(grade => grade.course_id === parseInt(formData.course_id));
      setFilteredGrades(filtered);
      if (!filtered.some(grade => grade.id === parseInt(formData.grade_id))) {
        setFormData(prev => ({ ...prev, grade_id: '' }));
      }
    } else {
      setFilteredGrades(allGrades);
    }
  }, [formData.course_id, allGrades]);

  // Pre-fill form when editing existing schedule
  useEffect(() => {
    if (schedule && isOpen) {
      const preparedFormData = {
        user_id: schedule.user_id?.toString() || '',
        course_id: schedule.course_id?.toString() || '',
        grade_id: schedule.grade_id?.toString() || '',
        branch_id: schedule.branch_id?.toString() || '',
        days: Array.isArray(schedule.days)
          ? schedule.days
          : schedule.day
          ? [schedule.day]
          : [],
        startTime: schedule.startTime || (schedule.time?.split('-')[0]?.trim() || ''),
        endTime: schedule.endTime || (schedule.time?.split('-')[1]?.trim() || ''),
        slot_id: schedule.slot_id || schedule.id || ''
      };
      setFormData(preparedFormData);
      setSchedules([preparedFormData]);
      setEditIndex(0);
    } else if (isOpen && !schedule) {
      setFormData({
        user_id: '',
        course_id: '',
        grade_id: '',
        branch_id: '',
        days: [],
        startTime: '',
        endTime: '',
        slot_id: ''
      });
      setSchedules([]);
      setEditIndex(null);
    }
  }, [schedule, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        days: checked
          ? [...prev.days, value]
          : prev.days.filter(day => day !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isValidTimeRange = () => {
    if (!formData.startTime || !formData.endTime) return true;
    const start = new Date(`2025-01-01T${formData.startTime}`);
    const end = new Date(`2025-01-01T${formData.endTime}`);
    return end > start;
  };

  const isDuplicateSchedule = (newSchedule, schedulesToCheck) => {
    return schedulesToCheck.some(
      (sch, index) =>
        index !== editIndex &&
        sch.branch_id === newSchedule.branch_id &&
        sch.course_id === newSchedule.course_id &&
        sch.grade_id === newSchedule.grade_id &&
        sch.user_id === newSchedule.user_id &&
        sch.days.some(day => newSchedule.days.includes(day)) &&
        sch.startTime === newSchedule.startTime &&
        sch.endTime === newSchedule.endTime
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.user_id ||
      !formData.course_id ||
      !formData.grade_id ||
      !formData.branch_id ||
      !formData.days.length ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setIsError(true);
      setToastData({
        icon: Error,
        title: 'Error',
        message: 'Please fill all required fields',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
      return;
    }

    if (!isValidTimeRange()) {
      setIsError(true);
      setToastData({
        icon: Error,
        title: 'Error',
        message: 'End time must be after start time',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
      return;
    }

    const newSchedule = { ...formData };

    if (!schedule && isDuplicateSchedule(newSchedule, schedules)) {
      setIsError(true);
      setToastData({
        icon: Error,
        title: 'Error',
        message: 'This schedule already exists in the list.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
      return;
    }

    if (!schedule) {
      if (editIndex !== null) {
        const updatedSchedules = [...schedules];
        updatedSchedules[editIndex] = newSchedule;
        setSchedules(updatedSchedules);
        setToastData({
          icon: Success,
          title: 'Success',
          message: 'Schedule updated in the list.',
        });
      } else {
        setSchedules([...schedules, newSchedule]);
        setToastData({
          icon: Success,
          title: 'Success',
          message: 'Schedule added to list.',
        });
      }

      setFormData({
        user_id: '',
        course_id: '',
        grade_id: '',
        branch_id: '',
        days: [],
        startTime: '',
        endTime: '',
        slot_id: '',
      });
      setEditIndex(null);
      setIsError(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...schedules[index] });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setSchedules(schedules.filter((_, i) => i !== deleteIndex));
    setToastData({
      icon: deleteIcon,
      title: 'Success',
      message: 'Schedule removed from list!',
    });
    setIsError(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1000);
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!schedules.length) {
        setIsError(true);
        setToastData({
          icon: Error,
          title: 'Error',
          message: 'No schedules to submit.',
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1000);
        return;
      }

      const validSchedules = schedules.filter((sch) => {
        const isValid =
          sch.user_id?.trim() &&
          sch.course_id?.trim() &&
          sch.grade_id?.trim() &&
          sch.branch_id?.trim() &&
          sch.days.length &&
          sch.startTime?.trim() &&
          sch.endTime?.trim();
        if (!isValid) console.warn('Skipping invalid schedule:', sch);
        return isValid;
      });

      if (!validSchedules.length) {
        setIsError(true);
        setToastData({
          icon: Error,
          title: 'Error',
          message: 'All schedule entries are invalid.',
        });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 1000);
        return;
      }

      if (schedule && validSchedules[0].slot_id) {
        const updatedSchedule = await updateSchedule(
          validSchedules[0].slot_id,
          { ...validSchedules[0], lecturers, courses, allGrades }
        );
        onUpdate(updatedSchedule);
        setToastData({
          icon: Success,
          title: 'Success',
          message: 'Schedule updated successfully.',
        });
      } else {
        for (const sch of validSchedules) {
          const result = await createSchedule(sch);
          onAdd(result);
        }
        setToastData({
          icon: Success,
          title: 'Success',
          message: 'Schedules added successfully.',
        });
      }

      setSchedules([]);
      setFormData({
        user_id: '',
        course_id: '',
        grade_id: '',
        branch_id: '',
        days: [],
        startTime: '',
        endTime: '',
        slot_id: ''
      });
      setEditIndex(null);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Submit Error:', error);
      setIsError(true);
      setToastData({
        icon: Error,
        title: 'Error',
        message: 'Failed to submit schedules.',
      });
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const getNameById = (id, collection, key = 'name') => {
    const item = collection.find(i => i.id === parseInt(id));
    return item ? item[key] : 'Unknown';
  };

  const scheduleTable = useMemo(
    () => (
      <tbody>
        {schedules.map((sch, index) => (
          <tr key={index}>
            <td>{getNameById(sch.course_id, courses)}</td>
            <td>{getNameById(sch.grade_id, allGrades, 'label')}</td>
            <td>{sch.days.join(', ')}</td>
            <td>{sch.startTime}</td>
            <td>{sch.endTime}</td>
            <td>
              <button className="addScheduleForm-action-btn addScheduleForm-edit" onClick={() => handleEdit(index)} aria-label="Edit schedule">
                <img src={pencilIcon} alt="Edit" />
              </button>
              <button className="addScheduleForm-action-btn addScheduleForm-delete" onClick={() => handleDelete(index)} aria-label="Delete schedule">
                <img src={deleteIcon} alt="Delete" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    ),
    [schedules, branches, lecturers, courses, allGrades]
  );

  if (!isOpen) return null;

  return (
    <div className="addScheduleForm-modal-overlay">
      <div className={`addScheduleForm-modal-content ${!schedule && schedules.length > 0 ? 'addScheduleForm-expanded' : ''}`}>
        <div className="addScheduleForm-modal-header">
          <h2>{schedule ? 'Edit Schedule' : 'Add Schedule'}</h2>
          <button className="addScheduleForm-cancel-btn" onClick={() => {
            setFormData({
              user_id: '',
              course_id: '',
              grade_id: '',
              branch_id: '',
              days: [],
              startTime: '',
              endTime: '',
              slot_id: ''
            });
            setSchedules([]);
            onClose();
          }}>
            <img src={Close} alt='close' className="addScheduleForm-cancel-icon" />
          </button>
        </div>

        {loading ? (
          <div className="addScheduleForm-loading-container">
            <p>Loading form data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="addScheduleForm-form-row">
              <div className="addScheduleForm-form-group">
                <label>Branch</label>
                <select
                  id="branch_id"
                  name="branch_id"
                  value={formData.branch_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="addScheduleForm-form-group">
                <label>Lecturer Name</label>
                <select
                  id="user_id"
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(lecturer => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="addScheduleForm-form-group">
                <label>Course Name</label>
                <select
                  id="course_id"
                  name="course_id"
                  value={formData.course_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="addScheduleForm-form-row">
              <div className="addScheduleForm-form-group">
                <label>Grade</label>
                <select
                  id="grade_id"
                  name="grade_id"
                  value={formData.grade_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.course_id}
                >
                  <option value="">Select Grade</option>
                  {filteredGrades.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.label || grade.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="addScheduleForm-form-group">
                <label>Day</label>
                <div 
                  ref={dayDropdownRef} 
                  className={`addScheduleForm-custom-dropdown ${isDayDropdownOpen ? 'addScheduleForm-active' : ''}`}
                >
                  <div
                    className="addScheduleForm-dropdown-toggle"
                    onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                  >
                    {formData.days.length > 0
                      ? formData.days.join(', ')
                      : 'Select days'}
                    <img src={Dropdown} alt='dropdown' className='addScheduleForm-dropdown-icon' />
                  </div>
                  {isDayDropdownOpen && (
                    <div className="addScheduleForm-dropdown-menu">
                      {daysOfWeek.map(day => (
                        <label key={day.id} className="addScheduleForm-checkbox-label">
                          <input
                            type="checkbox"
                            name="days"
                            value={day.name}
                            checked={formData.days.includes(day.name)}
                            onChange={handleChange}
                            className="addScheduleForm-custom-checkbox"
                          />
                          {day.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="addScheduleForm-form-row">
              <div className="addScheduleForm-form-group">
                <label>Start Time</label>
                <div className="addScheduleForm-time-input-group">
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="addScheduleForm-form-group">
                <label>End Time</label>
                <div className="addScheduleForm-time-input-group">
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {!schedule && (
              <div className="addScheduleForm-modal-actions">
                <button type="submit" className="addScheduleForm-button-btn">
                  {editIndex !== null ? 'Update Schedule' : 'Add Schedule'}
                </button>
              </div>
            )}
          </form>
        )}

        {!schedule && schedules.length > 0 && (
          <div className="addScheduleForm-added-schedules">
            <table className="addScheduleForm-schedules-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Grade</th>
                  <th>Days</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              {scheduleTable}
            </table>
            <button
              type="button"
              className="addScheduleForm-submit-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}

        {schedule && schedules.length > 0 && (
          <div className="addScheduleForm-modal-actions">
            <button
              type="button"
              className="addScheduleForm-button-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Update'}
            </button>
          </div>
        )}

        <Toast
          showToast={showToast}
          isError={isError}
          onClose={handleToastClose}
          title={toastData.title}
          message={toastData.message}
          icon={toastData.icon}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onDelete={confirmDelete}
        />
      </div>
    </div>
  );
};

export default AddSchedule;