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
import {
  fetchAllExams,
  deleteExam,
  createExam,
  updateExam,
} from '../../integration/examApi';
import '../../Styles/Exam/examList.css';

const formatTimeRange = (start, end) => {
  const toSmartTime = (timeStr, showPeriod) => {
    const [h, m] = timeStr.split(':').map(Number);
    const hour12 = h % 12 || 12;
    const period = h >= 12 ? 'PM' : 'AM';
    const minutePart = m === 0 ? '' : `:${m.toString().padStart(2, '0')}`;
    const time = `${hour12}${minutePart}`;
    return showPeriod ? `${time} ${period}` : time;
  };

  const startFormatted = toSmartTime(start, false);  
  const endFormatted = toSmartTime(end, true);   

  return `${startFormatted} - ${endFormatted}`;
};

const ExamList = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [isAddingExam, setIsAddingExam] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toastData, settoastData] = useState({
    title: '',
    message: '',
    icon: Success,
    isDelete: false,
  });
  const [loading, setLoading] = useState(true);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [preservedFormData, setPreservedFormData] = useState({});  


  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const data = await fetchAllExams();

        const courseMap = {};
        data.forEach((exam) => {
          const courseId = exam.Grade?.Course?.id;
          const courseName = exam.Grade?.Course?.name || 'Unknown';
          if (!courseMap[courseId]) {
            courseMap[courseId] = { id: courseId, name: courseName, exams: [] };
          }
          courseMap[courseId].exams.push({
            id: exam.id,
            courseId,
            grade: exam.Grade?.grade_name || exam.grade_id,
            date: exam.exam_date,
            time: formatTimeRange(exam.start_time, exam.end_time),
            rawStart: exam.start_time,
            rawEnd: exam.end_time,
            type: exam.exam_type,
            groupName: exam.group_name,
            gradeId: exam.grade_id,
          });
        });

        setCourses(Object.values(courseMap));
        setExams(data);
      } catch (err) {
        showToastMsg('Error', 'Failed to load exams.', Error, false);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  useEffect(() => {
    const shouldOpen =
      !hasOpenedModal &&
      (location.state?.openModal ||
        (location.state?.fromStudentSelection && location.state?.formData));

    if (shouldOpen) {
      const incomingFormData = location.state.formData || {};
      setPreservedFormData(incomingFormData);

      setIsAddingExam(true);
      setEditingExam(null);
      setHasOpenedModal(true);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname, hasOpenedModal]);

  const showToastMsg = (title, message, icon, isDelete) => {
    settoastData({ title, message, icon, isDelete });
    setIsError(title === 'Error');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filterExams = (exams) =>
    exams.filter((exam) =>
      Object.values(exam).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

const handleFormSubmit = async (formData) => {
  try {
    const payload = {
      grade_id: formData.grade,
      group_name: formData.groupName,
      exam_type: formData.examType,
      exam_date: formData.examDate,
      start_time: formData.startTime,
      end_time: formData.endTime,
      student_ids: formData.student_ids || [],
    };

    if (formData.id) {
      await updateExam(formData.id, payload);
      showToastMsg('Success', 'Exam updated successfully.', Success, false);
    } else {
      await createExam(payload);
      showToastMsg('Success', 'Exam created successfully.', Success, false);
    }

    const data = await fetchAllExams();
    setExams(data);
    rebuildCourseList(data);

    setIsAddingExam(false);
    setEditingExam(null);
    setPreservedFormData({});
  } catch (err) {
    showToastMsg('Error', 'Failed to save exam.', Error, false);
  }
};

  const rebuildCourseList = (examData) => {
    const courseMap = {};
    examData.forEach((exam) => {
      const courseId = exam.Grade?.Course?.id;
      const courseName = exam.Grade?.Course?.name || 'Unknown';
      if (!courseMap[courseId]) {
        courseMap[courseId] = { id: courseId, name: courseName, exams: [] };
      }
      courseMap[courseId].exams.push({
        id: exam.id,
        courseId,
        grade: exam.Grade?.grade_name || exam.grade_id,
        date: exam.exam_date,
        time: formatTimeRange(exam.start_time, exam.end_time),
        rawStart: exam.start_time,
        rawEnd: exam.end_time,
        type: exam.exam_type,
        groupName: exam.group_name,
        gradeId: exam.grade_id,
      });
    });
    setCourses(Object.values(courseMap));
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setIsAddingExam(true);
    setHasOpenedModal(true);
  };

  const handleOpenDeleteModal = (exam) => {
    setExamToDelete(exam);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExam = async () => {
    try {
      await deleteExam(examToDelete.id);
      showToastMsg('Success', 'Exam deleted.', DeleteIcon, true);
      const data = await fetchAllExams();
      setExams(data);
      rebuildCourseList(data);
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (err) {
      showToastMsg('Error', 'Failed to delete.', Error, false);
    }
  };

  const handleViewMore = (courseName, exams, courseId) => {
    navigate('/exam/detail', { state: { courseId } });
  };

  const handleCancel = () => {
    setIsAddingExam(false);
    setEditingExam(null);
    setHasOpenedModal(false);
    setPreservedFormData({});
  };

  const ExamRow = ({ exam }) => (
    <tr className="exam-row">
      <td data-label="Grade"><span className="exam-grade-badge">{exam.grade}</span></td>
      <td data-label="Date">{new Date(exam.date).toLocaleDateString()}</td>
      <td data-label="Time"><span className="exam-time-badge">{exam.time}</span></td>
      <td data-label="Exam Type"><span className="exam-type-list">{exam.type}</span></td>
      <td data-label="Group">{exam.groupName}</td>
      <td data-label="Actions">
        <div className="exam-action-buttons">
          <button className="exam-btn btn-edit" onClick={() => handleEditExam(exam)} title="Edit">
            <img src={EditIcon} className="exam-edit-icon" alt="Edit" />
          </button>
          <button className="exam-btn btn-delete" onClick={() => handleOpenDeleteModal(exam)} title="Delete">
            <img src={DeleteIcon} className="exam-delete-icon" alt="Delete" />
          </button>
        </div>
      </td>
    </tr>
  );

  const SubjectSection = ({ title, exams, sectionId }) => {
    const filtered = filterExams(exams);
    const display = filtered.slice(0, 3);

    return (
      <div className="subject-section">
        <div className="subject-header">
          <h2 className="subject-title">{title}</h2>
        </div>
        <div className="table-container">
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
              {display.length > 0 ? (
                display.map((exam) => <ExamRow key={exam.id} exam={exam} />)
              ) : (
                <tr>
                  <td colSpan="6" className="no-exams-message">
                    No exams found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 3 && (
          <div className="view-more" onClick={() => handleViewMore(title, filtered, sectionId)}>
            View More
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="exam-container">Loading exams...</div>;

  return (
    <div className="exam-container">
      <div className="exam-header">
        <div className="exam-search-container">
          <img src={SearchIcon} className="search-icon1" alt="Search" />
          <input
            type="text"
            className="exam-search-input"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="exam-add-btn"
          onClick={() => {
            setIsAddingExam(true);
            setEditingExam(null);
            setHasOpenedModal(true);
            setPreservedFormData({});
            navigate('/exam', { replace: true });
          }}
        >
          + Add Exam
        </button>
      </div>

      {isAddingExam && (
        <AddExamForm
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          initialData={
            editingExam
              ? {
                  id: editingExam.id,
                  courseId: editingExam.courseId,
                  grade: editingExam.gradeId,
                  startTime: editingExam.rawStart,
                  endTime: editingExam.rawEnd,
                  examDate: editingExam.date,
                  examType: editingExam.type,
                  groupName: editingExam.groupName,
                }
              : preservedFormData
          }
        />
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExamToDelete(null);
        }}
        onDelete={handleDeleteExam}
      />

      <Toast
        showToast={showToast}
        isError={isError}
        onClose={() => setShowToast(false)}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />

      {courses.length > 0 ? (
        courses.map((course) => (
          <SubjectSection
            key={course.id}
            title={course.name}
            exams={course.exams}
            sectionId={course.id}
          />
        ))
      ) : (
        <div className="no-exams">No courses or exams available.</div>
      )}
    </div>
  );
};

export default ExamList;