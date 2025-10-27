import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SearchIcon from '../../assets/icons/searchButton.png';
import EditIcon from '../../assets/icons/Edit.png';
import DeleteIcon from '../../assets/icons/delete2.png';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import AddExamForm from '../exams/AddExam';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import '../../Styles/Exam/examList.css';

const ExamList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([
    {
      id: 1,
      name: 'Piano',
      exams: [
        {
          id: 1,
          grade: '02',
          date: '2025-07-12',
          time: '09:00-10:00',
          type: 'Theory',
          groupName: 'Piano first group',
        },
        {
          id: 2,
          grade: '02',
          date: '2025-07-15',
          time: '09:00-11:00',
          type: 'Practical',
          groupName: 'Piano first group',
        },
        {
          id: 3,
          grade: '05',
          date: '2025-07-23',
          time: '08:00-10:00',
          type: 'Theory',
          groupName: 'Piano first group',
        },
        {
          id: 4,
          grade: '05',
          date: '2025-07-23',
          time: '08:00-10:00',
          type: 'Theory',
          groupName: 'Piano View group',
        },
      ],
    },
    {
      id: 2,
      name: 'Violin',
      exams: [
        {
          id: 5,
          grade: '02',
          date: '2025-07-12',
          time: '09:00-10:00',
          type: 'Theory',
          groupName: 'Violin a group',
        },
        {
          id: 6,
          grade: '02',
          date: '2025-07-12',
          time: '09:00-10:00',
          type: 'Theory',
          groupName: 'Violin first group',
        },
        {
          id: 7,
          grade: '02',
          date: '2025-07-15',
          time: '09:00-11:00',
          type: 'Practical',
          groupName: 'Violin C group',
        },
      ],
    },
    {
      id: 3,
      name: 'Keyboard',
      exams: [],
    },
  ]);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toastData, setToastData] = useState({
    title: '',
    message: '',
    icon: Success,
    isDelete: false,
  });

  useEffect(() => {
    if (location.state?.openModal) {
      setIsAddingExam(true);
    } else {
      setIsAddingExam(false);
      setEditingExam(null);
    }
  }, [location.state]);

  const filterExams = (exams) => {
    return exams.filter((exam) =>
      Object.values(exam).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  const handleFormSubmit = (formData) => {
    const courseId = parseInt(formData.courseId, 10);
    const newExam = {
      id: editingExam ? editingExam.id : Date.now(),
      grade: formData.grade,
      date: formData.examDate,
      time: `${formData.startTime}-${formData.endTime}`,
      type: formData.examType,
      groupName: formData.groupName,
    };

    setCourses((prevCourses) =>
      prevCourses.map((course) =>
        course.id === courseId
          ? {
              ...course,
              exams: editingExam
                ? course.exams.map((exam) =>
                    exam.id === editingExam.id ? newExam : exam
                  )
                : [...course.exams, newExam],
            }
          : course
      )
    );

    setToastData({
      title: 'Success',
      message: editingExam ? 'Exam updated successfully.' : 'Exam added successfully.',
      icon: Success,
      isDelete: false,
    });
    setIsError(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setIsAddingExam(false);
    setEditingExam(null);
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setIsAddingExam(true);
  };

  const handleOpenDeleteModal = (exam) => {
    setExamToDelete(exam);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExam = () => {
    try {
      setCourses((prevCourses) =>
        prevCourses.map((course) => ({
          ...course,
          exams: course.exams.filter((e) => e.id !== examToDelete.id),
        }))
      );
      setToastData({
        title: 'Success',
        message: 'Exam deleted successfully.',
        icon: DeleteIcon,
        isDelete: true,
      });
      setIsError(false);
      setShowToast(true);
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastData({
        title: 'Error',
        message: 'Failed to delete exam.',
        icon: Error,
        isDelete: false,
      });
      setIsError(true);
      setShowToast(true);
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleCloseModal = () => {
    setIsDeleteModalOpen(false);
    setExamToDelete(null);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const handleViewMore = (courseName, exams, courseId) => {
    navigate('/exam/detail', { state: { courseName, exams, courseId } });
  };

  const ExamRow = ({ exam, courseId }) => (
    <tr className="exam-row">
      <td>
        <span className="grade-badge">{exam.grade}</span>
      </td>
      <td>{new Date(exam.date).toLocaleDateString()}</td>
      <td>
        <span className="time-badge">{exam.time}</span>
      </td>
      <td>
        <span className="exam-type">{exam.type}</span>
      </td>
      <td>{exam.groupName}</td>
      <td>
        <div className="exam-action-buttons">
          <button
            className="exam-btn btn-edit"
            onClick={() => handleEditExam(exam)}
            title="Edit exam"
          >
            <img src={EditIcon} className="exam-edit-icon" alt="Edit exam" />
          </button>
          <button
            className="exam-btn btn-delete"
            onClick={() => handleOpenDeleteModal(exam)}
            title="Delete exam"
          >
            <img src={DeleteIcon} className="exam-delete-icon" alt="Delete exam" />
          </button>
        </div>
      </td>
    </tr>
  );

  const SubjectSection = ({ title, exams, sectionId }) => {
    const filteredExams = filterExams(exams);
    const displayExams = filteredExams.slice(0, 3);

    return (
      <div className="subject-section">
        <div className="subject-header">
          <h2 className="subject-title">{title}</h2>
        </div>
        <table className="exam-table">
          <thead className="exam-table-header">
            <tr>
              <th>Grade</th>
              <th>Date</th>
              <th>Time</th>
              <th>Exam type</th>
              <th>Group Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayExams.map((exam) => (
              <ExamRow key={exam.id} exam={exam} courseId={sectionId} />
            ))}
            {displayExams.length === 0 && (
              <tr>
                <td colSpan="6">No exams found</td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredExams.length > 3 && (
          <div
            className="view-more"
            onClick={() => handleViewMore(title, filteredExams, sectionId)}
          >
            View More
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div className="exam-search-container">
          <img src={SearchIcon} className="search-icon1" alt="Search exams" />
          <input
            type="text"
            className="exam-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="exam-add-btn"
          onClick={() => {
            setIsAddingExam(true);
            setEditingExam(null);
          }}
        >
          + Add Exam
        </button>
      </div>

      {isAddingExam && (
        <AddExamForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsAddingExam(false);
            setEditingExam(null);
          }}
          courses={courses}
          initialData={
            editingExam
              ? {
                  courseId: courses.find((c) => c.exams.includes(editingExam)).id,
                  grade: editingExam.grade,
                  startTime: editingExam.time.split('-')[0],
                  endTime: editingExam.time.split('-')[1],
                  examDate: editingExam.date,
                  examType: editingExam.type,
                  groupName: editingExam.groupName || '',
                }
              : {}
          }
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onDelete={handleDeleteExam}
      />

      <Toast
        showToast={showToast}
        isError={isError}
        onClose={handleToastClose}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />

      {courses.map((course) => (
        <SubjectSection
          key={course.id}
          title={course.name}
          exams={course.exams}
          sectionId={course.id}
        />
      ))}
    </div>
  );
};

export default ExamList;