import React, { useState, useEffect, useRef, useMemo } from 'react';
import '../../Styles/Course-css.css/CourseList.css';
import filterIcon from '../../assets/icons/filter2.png';
import closeicon from '../../assets/icons/closeicon.png';
import CourseCatalog from '../course/AddCourseForm';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import deleteToastIcon from '../../assets/icons/Delete.png';
import successToastIcon from '../../assets/icons/Success.png';
import SearchIcon from '../../assets/icons/searchButton.png';
import CourseActions from '../course/CourseActions';
import { getCourses, addCourse, updateCourse, deleteCourse, deleteGradeAndFee, searchCourses, updateGrade, getBranches } from '../../integration/courseAPI';

// Grouping function for courses
const groupCourses = (courses) => {
  const groups = {};
  courses.forEach(course => {
    if (!groups[course.id]) {
      groups[course.id] = {
        id: course.id,
        uniqueId: course.uniqueId || course.id.toString(),
        name: course.name,
        status: course.status || 'Active',
        allGrades: (course.grades || []).map(grade => ({
          ...grade,
          courseUniqueId: course.uniqueId || course.id.toString(),
          branchId: grade.branchId || '1',
          branchName: grade.branchName || 'N/A'
        })),
        uniqueIds: [course.uniqueId || course.id.toString()],
        courseData: [course]
      };
    } else {
      const newGrades = (course.grades || []).map(grade => ({
        ...grade,
        courseUniqueId: course.uniqueId || course.id.toString(),
        branchId: grade.branchId || '1',
        branchName: grade.branchName || 'N/A'
      }));
      groups[course.id] = {
        ...groups[course.id],
        allGrades: [...groups[course.id].allGrades, ...newGrades],
        uniqueIds: [...groups[course.id].uniqueIds, course.uniqueId || course.id.toString()],
        courseData: [...groups[course.id].courseData, course]
      };
    }
  });
  return Object.values(groups);
};

// Custom BranchDropdown component
const ClstBranchDropdown = ({ branches = [], selectedBranchId, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  console.log('ClstBranchDropdown props:', { branches, selectedBranchId, disabled, isOpen });

  useEffect(() => {
    if (!branches.length) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log('Click outside detected, closing dropdown');
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [branches.length]);

  useEffect(() => {
    if (!branches.length || !isOpen) return;

    const dropdownMenu = dropdownRef.current?.querySelector('.clst-dropdown-menu');
    console.log('Dropdown menu DOM:', dropdownMenu, 'Styles:', dropdownMenu?.style);
  }, [isOpen, branches.length]);

  if (!branches.length) {
    return (
      <div className="clst-branch-dropdown clst-disabled">
        <div className="clst-dropdown-trigger">No Branches Available</div>
      </div>
    );
  }

  // Normalize branch.id to string for comparison
  const selectedBranch = branches.find((branch) => (branch.id || branch.branchId)?.toString() === selectedBranchId?.toString());
  const displayText = selectedBranch ? (selectedBranch.branch_name || selectedBranch.name || 'Select Branch') : `Unknown Branch (ID: ${selectedBranchId})`;

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
      console.log('Dropdown toggled via keyboard, isOpen:', !isOpen);
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleOptionKeyDown = (event, branchId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(branchId);
      setIsOpen(false);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      setIsOpen(prev => !prev);
      console.log('Dropdown toggled, isOpen:', !isOpen);
    }
  };

  return (
    <div
      className={`clst-branch-dropdown ${disabled ? 'clst-disabled' : ''}`}
      ref={dropdownRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="clst-dropdown-trigger">
        {disabled ? 'No Branches Available' : displayText}
      </div>
      {isOpen && !disabled && (
        <ul className="clst-dropdown-menu" role="listbox">
          <li
            className="clst-dropdown-item clst-disabled"
            role="option"
            aria-disabled="true"
          >
            Select Branch
          </li>
          {branches.map((branch) => {
            const branchId = (branch.id || branch.branchId)?.toString();
            const isSelected = branchId === selectedBranchId?.toString();
            return (
              <li
                key={branchId}
                className={`clst-dropdown-item ${isSelected ? 'clst-selected' : ''}`}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => {
                  onChange(branchId);
                  setIsOpen(false);
                }}
                onKeyDown={(e) => handleOptionKeyDown(e, branchId)}
              >
                {branch.branch_name || branch.name || 'Unnamed Branch'}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editCourse, setEditCourse] = useState(null);
  const [detailEditCourse, setDetailEditCourse] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [courseFilter, setCourseFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseCatalog, setShowCourseCatalog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [toast, setToast] = useState({
    showToast: false,
    isError: false,
    isDelete: false,
    title: '',
    message: '',
    icon: null,
  });

  const courseOptions = ['All', 'Piano', 'Mridangam', 'Keyboard', 'Violin'];
  const statusOptions = ['Active', 'Inactive', 'Completed'];

  const groupedCourses = useMemo(() => groupCourses(courses), [courses]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseResponse, branchResponse] = await Promise.all([
          getCourses(),
          getBranches()
        ]);
        console.log('Fetched branches:', JSON.stringify(branchResponse.data, null, 2));
        setCourses(courseResponse.data || []);
        setBranches(branchResponse.data || []);
      } catch (error) {
        console.error('Fetch data error:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        setToast({
          showToast: true,
          isError: true,
          title: 'Error',
          message: 'Failed to fetch branches. Please check the server and try again.',
          icon: deleteToastIcon,
        });
        setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
        setBranches([]);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isDeleting || isUpdating || showCourseCatalog || editCourse || detailEditCourse) {
      return;
    }
    const fetchSearchResults = async () => {
      try {
        const response = searchTerm ? await searchCourses(searchTerm) : await getCourses();
        setCourses(response.data);
      } catch (error) {
        console.error('Search error:', error);
      }
    };
    fetchSearchResults();
  }, [searchTerm, isDeleting, isUpdating, showCourseCatalog, editCourse, detailEditCourse]);

  const refreshCourses = async () => {
    try {
      const response = await getCourses();
      setCourses(response.data);
      return response.data;
    } catch (error) {
      console.error('Refresh courses error:', error);
      return [];
    }
  };

  const handleGroupDelete = async (courseId) => {
    try {
      setIsDeleting(true);
      const group = groupedCourses.find(g => g.id === courseId);
      if (!group) return;

      await Promise.all(group.uniqueIds.map(id => deleteCourse(id)));
      
      await refreshCourses();
      setShowDeleteConfirm(null);
      setSelectedCourse(null);
      setToast({
        showToast: true,
        isError: false,
        isDelete: true,
        title: 'Success',
        message: 'Course and all grades deleted successfully',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } catch (error) {
      console.error('Delete group error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDetailDeleteConfirm = async (courseUniqueId, gradeFeeId) => {
    try {
      setIsDeleting(true);
      if (!gradeFeeId || isNaN(parseInt(gradeFeeId))) {
        throw new Error('Invalid grade fee ID');
      }
      const response = await deleteGradeAndFee(courseUniqueId, gradeFeeId);
      
      const updatedCourses = await refreshCourses();
      
      if (selectedCourse) {
        const newGroups = groupCourses(updatedCourses);
        const updatedGroup = newGroups.find(g => g.id === selectedCourse.id);
        setSelectedCourse(updatedGroup || null);
      }

      setShowDeleteConfirm(null);
      setToast({
        showToast: true,
        isError: false,
        isDelete: true,
        title: 'Success',
        message: response.message,
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
    } catch (error) {
      console.error('Delete grade fee error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
    setIsDeleting(false);
  };

  const handleCourseFilterClick = () => {
    setShowCourseDropdown(!showCourseDropdown);
    setShowStatusDropdown(false);
  };

  const handleStatusFilterClick = () => {
    setShowStatusDropdown(!showStatusDropdown);
    setShowCourseDropdown(false);
  };

  const handleOptionClick = (option) => {
    setCourseFilter(option === 'All' ? null : option);
    setShowCourseDropdown(false);
  };

  const handleStatusOptionClick = (option) => {
    setStatusFilter(option === 'All' ? null : option);
    setShowStatusDropdown(false);
  };

  const handleAddCourseClick = () => {
    setEditCourse(null);
    setShowCourseCatalog(true);
  };
const handleCourseCatalogSubmit = async (updatedCourses, message) => {
    try {
        setCourses(updatedCourses);

        setToast({
            showToast: true,
            isError: false,
            isDelete: false,
            title: 'Success',
            message: message,       // <-- Toast now works
            icon: successToastIcon,
        });

        setTimeout(() =>
            setToast((prev) => ({ ...prev, showToast: false }))
        , 3000);

        setShowCourseCatalog(false);
        setEditCourse(null);
    } catch (err) {
        console.error('Course Catalog Submit Error:', err);
    }
};


  const handleCourseCatalogClose = () => {
    setShowCourseCatalog(false);
    setEditCourse(null);
  };

  const handleMainEditFormSubmit = async (e) => {
    e.preventDefault();

    if (!editCourse || !editCourse.uniqueId) {
      console.error("No course selected for editing or missing ID. Current editCourse:", editCourse);
      setToast({
        showToast: true,
        isError: true,
        title: 'Error',
        message: 'No course selected for editing. Please try again.',
        icon: deleteToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      return;
    }

    try {
      setIsUpdating(true);

      const courseCode = e.target.courseCode.value.trim();
      const courseName = e.target.courseName.value.trim();
      const status = e.target.status.value;
      const branchId = e.target.branchId?.value;

      if (!courseCode || !courseName) {
        throw new Error("Course code and name are required");
      }

      const payload = {
        course_code: courseCode,
        name: courseName,
        status: status,
        grades: editCourse.allGrades.map(grade => ({
          id: grade.uniqueId,
          grade_name: grade.grade,
          status: grade.status,
          gradeFees: [{
            id: grade.gradeFeeId,
            fee: grade.fees,
            branch_id: branchId ? parseInt(branchId, 10) : grade.branchId || 1
          }]
        }))
      };

      await updateCourse(editCourse.uniqueId, payload);
      await refreshCourses();

      setToast({
        showToast: true,
        isError: false,
        isDelete: false,
        title: 'Success',
        message: 'Course and branch updated successfully',
        icon: successToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      setEditCourse(null);
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDetailEditFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const grade = e.target.grade.value.trim();
      const fees = e.target.fees.value.trim();
      const branchId = e.target.branchId.value;
      const courseId = detailEditCourse.courseUniqueId;
      const gradeId = detailEditCourse.id;
      const gradeFeeId = detailEditCourse.gradeFeeId;

      if (!grade || !fees || isNaN(parseFloat(fees)) || parseFloat(fees) <= 0) {
        throw new Error('Valid grade and fees are required');
      }
      if (!branchId) {
        throw new Error('Branch is required');
      }

      const payload = {
        gradeId: gradeId,
        grade: grade,
        fees: parseFloat(fees),
        gradeFeeId: gradeFeeId,
        branchId: parseInt(branchId, 10)
      };

      await updateGrade(courseId, payload);
      
      const updatedCourses = await refreshCourses();
      
      if (selectedCourse) {
        const newGroups = groupCourses(updatedCourses);
        const updatedGroup = newGroups.find(g => g.id === selectedCourse.id);
        setSelectedCourse(updatedGroup || null);
      }

      setToast({
        showToast: true,
        isError: false,
        isDelete: false,
        title: 'Success',
        message: 'Grade details and branch updated successfully',
        icon: successToastIcon,
      });
      setTimeout(() => setToast((prev) => ({ ...prev, showToast: false })), 3000);
      setDetailEditCourse(null);
    } catch (error) {
      console.error('Detail update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToastClose = () => {
    setToast({ ...toast, showToast: false });
  };

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target) &&
        !event.target.closest('.clst-branch-dropdown')
      ) {
        setShowCourseDropdown(false);
        setShowStatusDropdown(false);
        if (editCourse) setEditCourse(null);
        if (detailEditCourse) setDetailEditCourse(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editCourse, detailEditCourse]);

  const filteredCourses = useMemo(() => {
    return groupedCourses.filter((course) => {
      const matchesSearch =
        course.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.status?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCourse = courseFilter ? course.name === courseFilter : true;
      const matchesStatus = statusFilter ? course.status === statusFilter : true;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [groupedCourses, searchTerm, courseFilter, statusFilter]);

  return (
    <div className="clst-list-table-container" ref={wrapperRef}>
      <div className="clst-table-header">
        <div className="clst-search-container">
  <input
    type="text"
    placeholder="Search..."
    className="clst-search-input"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <img
    src={SearchIcon}
    alt="Search"
    className="clst-search-icon"
  />
</div>

        <button className="clst-add-btn1" onClick={handleAddCourseClick}>
          + Add Course
        </button>
      </div>
      <div className="clst-table-container1">
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>
                Course Name
                <img
                  src={filterIcon}
                  alt="Filter"
                  className="clst-icon clst-filter-icon"
                  onClick={handleCourseFilterClick}
                />
                {showCourseDropdown && (
                  <div className="clst-dropdown">
                    {courseOptions.map((option) => (
                      <div
                        key={option}
                        className="clst-dropdown-item"
                        onClick={() => handleOptionClick(option)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>
                Status
                <img
                  src={filterIcon}
                  alt="Filter"
                  className="clst-icon clst-filter-icon"
                  onClick={handleStatusFilterClick}
                />
                {showStatusDropdown && (
                  <div className="clst-dropdown1">
                    <div className="clst-dropdown-item" onClick={() => handleStatusOptionClick('All')}>
                      All
                    </div>
                    <div className="clst-dropdown-item" onClick={() => handleStatusOptionClick('Active')}>
                      Active
                    </div>
                    <div className="clst-dropdown-item" onClick={() => handleStatusOptionClick('Inactive')}>
                      Inactive
                    </div>
                    <div className="clst-dropdown-item" onClick={() => handleStatusOptionClick('Completed')}>
                      Completed
                    </div>
                  </div>
                )}
              </th>
              <th>Action</th>
            </tr>
          </thead>
            <tbody>
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#777" }}>
                    No available courses
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course, index) => (
                  <tr key={`${course.id}-${index}`}>
                    <td>{course.id}</td>
                    <td>{course.name}</td>
                    <td>{course.status}</td>
                    <td className="clst-action-icons">
                      <CourseActions
                        course={course}
                        setSelectedCourse={setSelectedCourse}
                        setEditCourse={setEditCourse}
                        setShowDeleteConfirm={setShowDeleteConfirm}
                        isDetailView={false}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
        </table>
        {selectedCourse && !showDeleteConfirm && (
          <div className="clst-course-details-popup1">
            <div className="clst-popup-content1">
              <img
                src={closeicon}
                alt="Close"
                className="clst-close-btn"
                onClick={() => setSelectedCourse(null)}
              />
              <p>
                <strong>Course Code: </strong>{selectedCourse.id}
              </p>
              <p>
                <strong>Course: </strong>{selectedCourse.name}
              </p>
              <p>
                <strong>Status: </strong>{selectedCourse.status}
              </p>
              {/* <p>
                <strong>Branch: </strong>
                {[...new Set(selectedCourse.allGrades.map(detail => detail.branchName || 'N/A'))].join(', ')}
              </p> */}
              <div className="clst-details-table">
                <table>
                  <thead>
                    <tr>
                      <th>Grade</th>
                      <th>Fees(Rs)</th>
                      <th>Branch</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCourse.allGrades.map((detail, index) => (
                      <tr key={`${detail.courseUniqueId}-${detail.gradeFeeId}-${index}`}>
                        <td>{detail.grade || 'N/A'}</td>
                        <td>{detail.fees || '0'}</td>
                        <td>{detail.branchName || 'N/A'}</td>
                        <td className="clst-action-icons1">
                          <CourseActions
                            course={{ 
                              ...detail, 
                              courseUniqueId: detail.courseUniqueId,
                              gradeFeeId: detail.gradeFeeId,
                              id: detail.uniqueId || detail.id,
                              branchId: detail.branchId || '1',
                              branchName: detail.branchName || 'N/A'
                            }}
                            setSelectedCourse={setSelectedCourse}
                            setEditCourse={setDetailEditCourse}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            hideView={true}
                            isDetailView={true}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {editCourse && (
          <div className="clst-course-details-popup">
            <div className="clst-popup-content">
              <img
                src={closeicon}
                alt="Close"
                className="clst-close-btn"
                onClick={() => setEditCourse(null)}
              />
              <h3>Edit Course</h3>
              <form onSubmit={handleMainEditFormSubmit}>
                <div className="clst-form-row">
                  <div className="clst-form-group">
                    <label>Course Code</label>
                    <input
                      type="text"
                      name="courseCode"
                      defaultValue={editCourse.id || ''}
                      required
                    />
                  </div>
                  <div className="clst-form-group">
                    <label>Course Name</label>
                    <input
                      type="text"
                      name="courseName"
                      defaultValue={editCourse.name || ''}
                      required
                    />
                  </div>
                </div>
                <div className="clst-form-row">
                  <div className="clst-form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      defaultValue={editCourse.status || 'Active'}
                      required
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="clst-update-button" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        )}
        {detailEditCourse && (
          <div className="clst-course-details-popup">
            <div className="clst-popup-content">
              <img
                src={closeicon}
                alt="Close"
                className="clst-close-btn"
                onClick={() => setDetailEditCourse(null)}
              />
              <h3>Edit Details</h3>
              <form onSubmit={handleDetailEditFormSubmit}>
                <div className="clst-form-row">
                  <div className="clst-form-group">
                    <label>Grade</label>
                    <input
                      type="text"
                      name="grade"
                      defaultValue={detailEditCourse.grade || ''}
                      required
                    />
                  </div>
                  <div className="clst-form-group">
                    <label>Fees</label>
                    <input
                      type="text"
                      name="fees"
                      defaultValue={detailEditCourse.fees || ''}
                      required
                    />
                  </div>
                </div>
                <div className="clst-form-row">
                  <div className="clst-form-group">
                    <label>Branch</label>
                    <ClstBranchDropdown
                      branches={branches}
                      selectedBranchId={detailEditCourse.branchId || '1'}
                      onChange={(branchId) => {
                        const branchInput = document.querySelector('input[name="branchId"]');
                        if (branchInput) {
                          branchInput.value = branchId;
                        }
                        setDetailEditCourse(prev => ({
                          ...prev,
                          branchId: branchId
                        }));
                      }}
                      disabled={branches.length === 0}
                    />
                    <input
                      type="hidden"
                      name="branchId"
                      defaultValue={detailEditCourse.branchId || '1'}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="clst-update-button1"
                  disabled={isUpdating || branches.length === 0}
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </form>
            </div>
          </div>
        )}
        <DeleteConfirmModal
          isOpen={!!showDeleteConfirm}
          onClose={handleDeleteCancel}
          onDelete={() => {
            if (typeof showDeleteConfirm === 'string') {
              handleGroupDelete(showDeleteConfirm);
            } else if (showDeleteConfirm && showDeleteConfirm.courseId && showDeleteConfirm.detailId) {
              handleDetailDeleteConfirm(showDeleteConfirm.courseId, showDeleteConfirm.detailId);
            }
          }}
        />
        {showCourseCatalog && (
          <CourseCatalog
            onSubmit={handleCourseCatalogSubmit}
            onClose={handleCourseCatalogClose}
            initialCourse={
              editCourse
                ? {
                    id: editCourse.id,
                    name: editCourse.name,
                    grade: editCourse.allGrades?.[0]?.grade || '',
                    fees: editCourse.allGrades?.[0]?.fees?.toString() || '',
                    status: editCourse.status,
                    branchId: editCourse.allGrades?.[0]?.branchId || '1'
                  }
                : null
            }
          />
        )}
        <Toast
          showToast={toast.showToast}
          isError={toast.isError}
          isDelete={toast.isDelete}
          title={toast.title}
          message={toast.message}
          icon={toast.icon}
          onClose={handleToastClose}
        />
      </div>
    </div>
  );
};

export default CourseList;