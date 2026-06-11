import React, { useState, useEffect, useCallback } from 'react';
import '../../../Styles/Students-css/StudentFormStepper/Step4AcademicDetails.css';
import FilterIcon from '../../../assets/icons/Filter.png';
import { useToast } from '../../../modals/ToastProvider';
import { getDropdownOptions, checkStudentNoExists } from '../../../integration/studentAPI';
import EditIcon from '../../../assets/icons/Edit.png';
import DeleteIcon from '../../../assets/icons/Delete.png';
import successIcon from '../../../assets/icons/Success.png';
import errorIcon from '../../../assets/icons/error.png';
import FormLabel from '../../../Components/FormLabel';
import { debounce } from 'lodash';

const Step4AcademicDetails = ({ 
  formData, 
  onChange, 
  errors, 
  setErrors,
  originalStudentNo 
}) => {
  const { showToast } = useToast();

  const [scheduleInput, setScheduleInput] = useState({
    branch: formData.branch || '',
    student_no: formData.student_no || '',
    schedule_day: '',
    schedule_time: '',
  });

  const [dropdownOptions, setDropdownOptions] = useState({ branches: [], slots: [] });
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Student ID validation states
  const [studentNoError, setStudentNoError] = useState('');
  const [checkingStudentNo, setCheckingStudentNo] = useState(false);

  // Debounced uniqueness check — now accepts originalStudentNo
const debouncedCheckStudentNo = useCallback(
  debounce(async (currentStudentNo, originalStudentNo) => {
    const trimmed = currentStudentNo?.trim();

    // Clear error if empty or unchanged
    if (!trimmed || (originalStudentNo && trimmed === originalStudentNo.trim())) {
      setStudentNoError('');
      setErrors?.(prev => {
        const newErr = { ...prev };
        delete newErr.student_no;
        return newErr;
      });
      setCheckingStudentNo(false);
      return;
    }

    setCheckingStudentNo(true);
    try {
      const exists = await checkStudentNoExists(trimmed);
      if (exists) {
        const message = 'This Student ID is already taken.';
        setStudentNoError(message);
        setErrors?.(prev => ({ ...prev, student_no: message }));
      } else {
        setStudentNoError('');
        setErrors?.(prev => {
          const newErr = { ...prev };
          delete newErr.student_no;
          return newErr;
        });
      }
    } catch (err) {
      console.error('Failed to check student_no:', err);
      setStudentNoError('');
      setErrors?.(prev => {
        const newErr = { ...prev };
        delete newErr.student_no;
        return newErr;
      });
      showToast({
        title: 'Warning',
        message: 'Could not verify Student ID. Proceeding anyway.',
        isError: false,
      });
    } finally {
      setCheckingStudentNo(false);
    }
  }, 700),
  [showToast, setErrors] // ← Add setErrors to deps
);

  // Trigger validation when student_no changes
  useEffect(() => {
    debouncedCheckStudentNo(scheduleInput.student_no, originalStudentNo || formData.student_no);
  }, [scheduleInput.student_no, originalStudentNo, formData.student_no, debouncedCheckStudentNo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => debouncedCheckStudentNo.cancel();
  }, [debouncedCheckStudentNo]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const branches = await getDropdownOptions('branches');
        setDropdownOptions(prev => ({ ...prev, branches: Array.isArray(branches) ? branches : [] }));
      } catch (error) {
        showToast({ title: 'Error', message: 'Failed to load branches', isError: true, icon: errorIcon });
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, [showToast]);

  // Fetch slots when branch or courses change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!scheduleInput.branch || !formData.assignedCourses || formData.assignedCourses.length === 0) {
        setDropdownOptions(prev => ({ ...prev, slots: [] }));
        return;
      }

      const firstCourse = formData.assignedCourses[0];
      const selectedBranch = dropdownOptions.branches.find(b => b.branch_name === scheduleInput.branch);
      if (!selectedBranch) return;

      try {
        setLoadingSlots(true);
        const params = {
          branchId: selectedBranch.id,
          courseId: firstCourse.course_id,
          gradeId: firstCourse.grade_id,
        };

        const slots = await getDropdownOptions('slots', params);
        setDropdownOptions(prev => ({ ...prev, slots: Array.isArray(slots) ? slots : [] }));

        if (!slots.length) {
          showToast({
            title: 'No Slots',
            message: 'No available slots for this course in the selected branch.',
            isError: false,
          });
        }
      } catch (error) {
        showToast({ title: 'Error', message: 'Failed to load time slots', isError: true, icon: errorIcon });
        setDropdownOptions(prev => ({ ...prev, slots: [] }));
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [scheduleInput.branch, dropdownOptions.branches, formData.assignedCourses, showToast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setScheduleInput(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'branch' || name === 'schedule_day' ? { schedule_time: '' } : {})
    }));

    if (name === 'student_no') {
      onChange({ ...formData, student_no: value });
      if (errors.student_no) {
        setErrors?.(prev => ({ ...prev, student_no: '' }));
      }
    } else if (name === 'branch') {
      onChange({ ...formData, branch: value });
    }
  };

  const handleAssign = () => {
    const { branch, student_no, schedule_day, schedule_time } = scheduleInput;

    if (!branch || !student_no || !schedule_day || !schedule_time) {
      showToast({ title: 'Error', message: 'All fields are required', isError: true, icon: errorIcon });
      return;
    }

    if (studentNoError) {
      showToast({ title: 'Error', message: 'Please resolve Student ID error', isError: true, icon: errorIcon });
      return;
    }

    const firstCourse = formData.assignedCourses[0];
    const selectedSlot = dropdownOptions.slots.find(s => s.day === schedule_day && s.time === schedule_time);
    if (!selectedSlot) {
      showToast({ title: 'Error', message: 'Invalid time slot selected', isError: true, icon: errorIcon });
      return;
    }

    const newSchedule = {
      id: selectedSlot.id,
      branch,
      studentId: student_no,
      day: schedule_day,
      time: schedule_time,
      course: firstCourse.course,
      grade: firstCourse.grade,
    };

    onChange({
      ...formData,
      schedules: [...(formData.schedules || []), newSchedule],
    });

    showToast({ title: 'Success', message: 'Schedule assigned successfully!', icon: successIcon });

    setScheduleInput(prev => ({ ...prev, schedule_day: '', schedule_time: '' }));
  };

  const handleEditCourse = (id) => {
    const sched = formData.schedules.find(s => s.id === id);
    if (sched) {
      setScheduleInput({
        branch: sched.branch,
        student_no: sched.studentId,
        schedule_day: sched.day,
        schedule_time: sched.time,
      });
      onChange({
        ...formData,
        branch: sched.branch,
        student_no: sched.studentId,
        schedules: formData.schedules.filter(s => s.id !== id),
      });
    }
  };

  const handleDeleteCourse = (id) => {
    onChange({
      ...formData,
      schedules: formData.schedules.filter(s => s.id !== id),
    });
  };

  const availableDays = [...new Set(dropdownOptions.slots.map(s => s.day))].sort();

  return (
    <div className="step-four-fields">
      <h3 className="section-header">Academic Details</h3>

      <div className="stu-form-row">
        <div className="form-group">
          <FormLabel htmlFor="branch" label="Branch" isRequired={true} />
          <div className="input-icon-container">
            <select
              name="branch"
              value={scheduleInput.branch}
              onChange={handleInputChange}
              disabled={loadingBranches}
            >
              <option value="">Select Branch</option>
              {dropdownOptions.branches.map(b => (
                <option key={b.id} value={b.branch_name}>{b.branch_name}</option>
              ))}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
          {errors.branch && <span className="error">{errors.branch}</span>}
        </div>

        {/* Student ID Field */}
        <div className="form-group">
          <FormLabel htmlFor="student_no" label="Student ID" isRequired={true} />
          <div className="input-with-status">
            <input
              name="student_no"
              type="text"
              value={scheduleInput.student_no}
              onChange={handleInputChange}
              placeholder="e.g. ST-001"
              className={(studentNoError || errors.student_no) ? 'error-input' : ''}
              disabled={checkingStudentNo}
            />
            {checkingStudentNo && <span className="checking-text">Checking...</span>}
          </div>

          {(studentNoError || errors.student_no) && (
            <span className="error">
              {studentNoError || errors.student_no}
            </span>
          )}
        </div>
      </div>

      <div className="stu-form-row">
        <div className="form-group">
          <FormLabel htmlFor="schedule_day" label="Schedule Day" isRequired={true} />
          <div className="input-icon-container">
            <select
              name="schedule_day"
              value={scheduleInput.schedule_day}
              onChange={handleInputChange}
              disabled={loadingSlots || !scheduleInput.branch}
            >
              <option value="">Select Day</option>
              {availableDays.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
        </div>

        <div className="form-group">
          <FormLabel htmlFor="schedule_time" label="Schedule Time" isRequired={true} />
          <div className="input-icon-container">
            <select
              name="schedule_time"
              value={scheduleInput.schedule_time}
              onChange={handleInputChange}
              disabled={loadingSlots || !scheduleInput.schedule_day}
            >
              <option value="">Select Time</option>
              {dropdownOptions.slots
                .filter(s => scheduleInput.schedule_day ? s.day === scheduleInput.schedule_day : true)
                .map(s => (
                  <option key={`${s.id || s.day}-${s.time}`} value={s.time}>
                    {s.time}
                  </option>
                ))}
            </select>
            <img src={FilterIcon} alt="dropdown" className="input-icon dropdown-icon" />
          </div>
        </div>
      </div>

      <button
        type="button"
        className="assign-btn"
        onClick={handleAssign}
        disabled={
          !scheduleInput.branch ||
          !scheduleInput.student_no ||
          !scheduleInput.schedule_day ||
          !scheduleInput.schedule_time ||
          checkingStudentNo ||
          !!studentNoError
        }
      >
        Assign Schedule
      </button>

      {errors.schedules && <p className="error-msg">{errors.schedules}</p>}

      {formData.schedules?.length > 0 ? (
        <div className="assigned-table-wrapper">
          <table className="assigned-table">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Student ID</th>
                <th>Day</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formData.schedules.map(({ id, branch, studentId, day, time }) => (
                <tr key={id}>
                  <td>{branch}</td>
                  <td>{studentId}</td>
                  <td>{day}</td>
                  <td>{time}</td>
                  <td>
                    <img src={EditIcon} alt="Edit" className="icon-btn edit-icon" onClick={() => handleEditCourse(id)} />
                    <img src={DeleteIcon} alt="Delete" className="icon-btn delete-icon" onClick={() => handleDeleteCourse(id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-schedules-msg">No schedules assigned yet.</p>
      )}
    </div>
  );
};

export default Step4AcademicDetails;