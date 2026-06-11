import React, { useState, useEffect, useMemo } from 'react';
import '../../Styles/Course-css.css/AddCourseForm.css';
import closeicon from '../../assets/icons/closeicon.png';
import pencilIcon from '../../assets/icons/pencil_line.png';
import deleteIcon from '../../assets/icons/Delete.png';
import Toast from '../../modals/ToastModel';
import successToastIcon from '../../assets/icons/Success.png';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import deleteToastIcon from '../../assets/icons/Delete.png';
import { getCourses, addCourse, getBranches } from '../../integration/courseAPI';

const CourseCatalog = ({ onSubmit, onClose, initialCourse }) => {
  const [formData, setFormData] = useState({
    courseId: '',
    courseName: '',
    grade: '',
    status: 'Active',
    fees: '',
    branchId: '',
  });
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [hasCourses, setHasCourses] = useState(!!initialCourse);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await getBranches();
        const branchesData = Array.isArray(response) ? response : 
                            (response.data || []);
        setBranches(branchesData);
      } catch (error) {
        console.log('Failed to fetch branches.', error);
      }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    if (initialCourse) {
      const courseData = {
        courseId: initialCourse.id || '',
        courseName: initialCourse.name || '',
        grade: initialCourse.grade || '',
        status: initialCourse.status || 'Active',
        fees: initialCourse.fees?.toString() || '',
        branchId: initialCourse.branchId?.toString() || (branches.length > 0 ? branches[0].id.toString() : ''),
      };
      setFormData(courseData);
      if (initialCourse.id || initialCourse.name) {
        setCourses([courseData]);
        setEditIndex(0);
      }
    }
  }, [initialCourse, branches]);

  useEffect(() => {
    setHasCourses(courses.length > 0);
  }, [courses]);

  const showToastNotification = (message, isSuccess = true) => {
    setToastMessage(message);
    setIsSuccess(isSuccess);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { courseId, courseName, grade, status, fees, branchId } = formData;
    if (!courseId || !courseName || !grade || !status || !fees || !branchId) {
      showToastNotification('Please fill in all fields.', false);
      return;
    }
    if (isNaN(fees) || parseFloat(fees) <= 0) {
      showToastNotification('Fees must be a positive number.', false);
      return;
    }
    if (editIndex !== null) {
      handleUpdate();
    } else {
      setCourses([...courses, { ...formData }]);
      setFormData({ 
        courseId: '', 
        courseName: '', 
        grade: '', 
        status: 'Active', 
        fees: '', 
        branchId: branches.length > 0 ? branches[0].id.toString() : '' 
      });
      showToastNotification('Course added to list!');
    }
  };

  const handleClose = () => {
    if (formData.courseId || formData.courseName || formData.grade || 
        formData.status !== 'Active' || formData.fees || 
        formData.branchId !== (branches.length > 0 ? branches[0].id.toString() : '')) {
             onClose();
    } else {
      onClose();
    }
  };

  // ⭐⭐⭐ FIXED FINAL SUBMIT — toast logic moved to parent
  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (!courses.length) {
        showToastNotification('No courses to submit.', false);
        return;
      }

      const validCourses = courses.filter((course) => {
        const isValid =
          course.courseId?.trim() &&
          course.courseName?.trim() &&
          course.grade?.trim() &&
          course.status?.trim() &&
          course.fees?.toString().trim() &&
          course.branchId?.trim() &&
          !isNaN(parseFloat(course.fees)) &&
          parseFloat(course.fees) > 0;
        if (!isValid) console.warn('Skipping invalid course:', course);
        return isValid;
      });

      if (!validCourses.length) {
        showToastNotification('All course entries are invalid.', false);
        return;
      }

      const courseToSubmit = {
        id: validCourses[0].courseId,
        name: validCourses[0].courseName,
        status: validCourses[0].status || 'Active',
        grades: validCourses.map(course => ({
          grade_name: course.grade,
          fees: parseFloat(course.fees),
          status: course.status || 'Active',
          branch_id: parseInt(course.branchId, 10),
        })),
      };

      await addCourse(courseToSubmit);

      const { data: updatedCourses } = await getCourses();

      // ❗ REMOVE this toast — parent will show it instead
      // showToastNotification('Courses submitted successfully!');

      // ⭐ Send message + updated list to parent
      onSubmit(updatedCourses, "Courses submitted successfully!");

      setCourses([]);
      setFormData({ 
        courseId: '', 
        courseName: '', 
        grade: '', 
        status: 'Active', 
        fees: '', 
        branchId: branches.length > 0 ? branches[0].id.toString() : '' 
      });

      onClose();

    } catch (error) {
      console.error('Submit Error:', error);
      showToastNotification(error.message || 'Failed to prepare courses.', false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (index) => {
    setFormData({ ...courses[index] });
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setCourses(courses.filter((_, i) => i !== deleteIndex));
    showToastNotification('Course removed from list!');
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteIndex(null);
  };

  const handleUpdate = () => {
    if (editIndex !== null) {
      const updatedCourses = [...courses];
      updatedCourses[editIndex] = { ...formData };
      setCourses(updatedCourses);
      setFormData({ 
        courseId: '', 
        courseName: '', 
        grade: '', 
        status: 'Active', 
        fees: '', 
        branchId: branches.length > 0 ? branches[0].id.toString() : '' 
      });
      setEditIndex(null);
      showToastNotification('Course updated in list!');
    }
  };

  const courseTable = useMemo(
    () => (
      <tbody className="addCourseForm-table-body">
        {courses.map((course, index) => (
          <tr key={index}>
            <td>{course.grade}</td>
            <td>{course.status}</td>
            <td>{course.fees}</td>
            <td>
              {branches.find(b => b.id.toString() === course.branchId)?.branch_name || 
               branches.find(b => b.id.toString() === course.branchId)?.name || 
               'Unknown'}
            </td>
            <td>
              <button className="addCourseForm-action-btn addCourseForm-edit" onClick={() => handleEdit(index)} aria-label={`Edit course ${course.courseId}`}>
                <img src={pencilIcon} alt="Edit" />
              </button>
              <button className="addCourseForm-action-btn addCourseForm-delete" onClick={() => handleDelete(index)} aria-label={`Delete course ${course.courseId}`}>
                <img src={deleteIcon} alt="Delete" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    ),
    [courses, branches]
  );

  return (
    <div className="addCourseForm-course-catalog-overlay">
      <div className={`addCourseForm-course-catalog-modal ${hasCourses ? 'addCourseForm-expanded' : ''}`}>
        <div className="addCourseForm-course-catalog-header">
          <h3>{initialCourse ? 'Edit Course' : 'Course Catalog'}</h3>
          <button className="addCourseForm-close-btn" onClick={handleClose} aria-label="Close modal">
            <img src={closeicon} alt="Close" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className='addCourseForm-course-form'>
          <div className="addCourseForm-course-form-row">
            <div className="addCourseForm-form-group">
              <label htmlFor="courseId">Course Code</label>
              <input
                id="courseId"
                type="text"
                name="courseId"
                value={formData.courseId}
                onChange={handleChange}
                placeholder="eg.099"
                required
                aria-required="true"
              />
            </div>
            <div className="addCourseForm-form-group">
              <label htmlFor="courseName">Course Name</label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                placeholder="eg. Piano"
                value={formData.courseName}
                onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setFormData({ ...formData, courseName: value });
                }}
                required
              />
            </div>
          </div>
          <div className="addCourseForm-form-group">
            <label htmlFor="branchId">Branch</label>
            <select
              id="branchId"
              name="branchId"
              value={formData.branchId}
              onChange={handleChange}
              required
              aria-required="true"
            >
              <option value="" disabled>Select a Branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id.toString()}>
                  {branch.branch_name || branch.name}
                </option>
              ))}
            </select>
          </div>
          
          <h3>Course Record</h3>
          <div className="addCourseForm-course-form-row">
            <div className="addCourseForm-form-group">
              <label htmlFor="grade">Grade</label>
              <input
                id="grade"
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                placeholder="eg.02"
                required
                aria-required="true"
              />
            </div>
            <div className="addCourseForm-form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                aria-required="true"
              >
                <option value="" disabled>Select the Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="addCourseForm-course-form-row">
            <div className="addCourseForm-form-group">
              <label htmlFor="fees">Fees</label>
              <input
                id="fees"
                type="text"
                name="fees"
                value={formData.fees}
                onChange={handleChange}
                placeholder="eg.3000"
                required
                aria-required="true"
              />
            </div>
          </div>
          <button type="submit" className="addCourseForm-button-btn">
            {editIndex !== null ? 'Update Course' : 'Add Course'}
          </button>
        </form>
        {courses.length > 0 && (
          <div className="addCourseForm-added-courses">
            <table className="addCourseForm-sepecifc-courses-table">
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Fees(Rs)</th>
                  <th>Branch</th>
                  <th>Action</th>
                </tr>
              </thead>
              {courseTable}
            </table>
            <button
              type="button"
              className="addCourseForm-submit-btn"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        )}
      </div>
      <Toast
        showToast={showToast}
        isError={!isSuccess}
        onClose={() => setShowToast(false)}
        title={isSuccess ? 'Success' : 'Error'}
        message={toastMessage}
        icon={toastMessage.includes('deleted') ? deleteToastIcon : successToastIcon}
      />
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onDelete={confirmDelete}
      />
    </div>
  );
};

export default CourseCatalog;
