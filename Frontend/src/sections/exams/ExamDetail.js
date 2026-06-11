import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EditIcon from '../../assets/icons/Edit.png';
import DeleteIcon from '../../assets/icons/delete2.png';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import BackIcon from '../../assets/icons/back.png'
import AddExamForm from '../exams/AddExam';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import {
  fetchAllExams,
  deleteExam,
  updateExam,
} from '../../integration/examApi';
import '../../Styles/Exam/examDetail.css';

const ExamDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const { courseId } = state || {};
  const [courseName, setCourseName] = useState('Loading...');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isEditingExam, setIsEditingExam] = useState(false);
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

  // Load exams for this course
  useEffect(() => {
    const loadExams = async () => {
      if (!courseId) {
        navigate('/exam');
        return;
      }

      try {
        setLoading(true);
        const allExams = await fetchAllExams();

        const courseExams = allExams.filter(
          (exam) => exam.Grade?.Course?.id === courseId
        );

        if (courseExams.length > 0) {
          setCourseName(courseExams[0].Grade.Course.name);
        }

        const formatted = courseExams.map((exam) => ({
          id: exam.id,
          grade: exam.Grade?.grade_name || exam.grade_id,
          gradeId: exam.grade_id,
          date: exam.exam_date,
          time: `${exam.start_time}-${exam.end_time}`,
          type: exam.exam_type,
          groupName: exam.group_name,
        }));

        setExams(formatted);
      } catch (err) {
        showToastMsg('Error', 'Failed to load exams.', Error, false);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [courseId, navigate]);

  const showToastMsg = (title, message, icon, isDelete) => {
    setToastData({ title, message, icon, isDelete });
    setIsError(title === 'Error');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const refreshExams = async () => {
    try {
      const allExams = await fetchAllExams();
      const courseExams = allExams.filter(
        (exam) => exam.Grade?.Course?.id === courseId
      );
      const formatted = courseExams.map((exam) => ({
        id: exam.id,
        grade: exam.Grade?.grade_name || exam.grade_id,
        gradeId: exam.grade_id,
        date: exam.exam_date,
        time: `${exam.start_time}-${exam.end_time}`,
        type: exam.exam_type,
        groupName: exam.group_name,
      }));
      setExams(formatted);
    } catch (err) {
      showToastMsg('Error', 'Failed to refresh exams.', Error, false);
    }
  };

  const handleEditExam = (exam) => {
    setEditingExam(exam);
    setIsEditingExam(true);
  };

  const handleOpenDeleteModal = (exam) => {
    setExamToDelete(exam);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteExam = async () => {
    try {
      await deleteExam(examToDelete.id);
      showToastMsg('Success', 'Exam deleted successfully.', DeleteIcon, true);
      await refreshExams();
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (err) {
      showToastMsg('Error', 'Failed to delete exam.', Error, false);
    }
  };

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

      await updateExam(editingExam.id, payload);
      showToastMsg('Success', 'Exam updated successfully.', Success, false);
      await refreshExams();
      setIsEditingExam(false);
      setEditingExam(null);
    } catch (err) {
      showToastMsg('Error', 'Failed to update exam.', Error, false);
    }
  };

  if (loading) {
    return (
      <div className="exam-detail-container">
        <div className="exam-detail-header">
          <button className="exam-back-btn" onClick={() => navigate(-1)}>
            Back to List
          </button>
        </div>
        <p>Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="exam-detail-container">
      <div className="exam-detail-header">
        <button className='exam-back-icon' onClick={() => navigate(-1)}>
          <img src={BackIcon} alt='Back Icon' className='exam-back-icon'/>
        </button>
      </div>

      <h2>{courseName}</h2>

      <table className="exam-detail-table">
        <thead>
          <tr>
            <th>Grade</th>
            <th>Date</th>
            <th>Time</th>
            <th>Exam Type</th>
            <th>Group Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {exams.length > 0 ? (
            exams.map((exam) => (
              <tr key={exam.id}>
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
                      <img src={EditIcon} className="exam-edit-icon" alt="Edit" />
                    </button>
                    <button
                      className="exam-btn btn-delete"
                      onClick={() => handleOpenDeleteModal(exam)}
                      title="Delete exam"
                    >
                      <img src={DeleteIcon} className="exam-delete-icon" alt="Delete" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No exams scheduled for this course.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Form Only */}
      {isEditingExam && (
        <AddExamForm
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsEditingExam(false);
            setEditingExam(null);
          }}
          initialData={{
            id: editingExam.id,
            courseId,
            grade: editingExam.gradeId,
            startTime: editingExam.time.split('-')[0],
            endTime: editingExam.time.split('-')[1],
            examDate: editingExam.date,
            examType: editingExam.type,
            groupName: editingExam.groupName || '',
          }}
        />
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExamToDelete(null);
        }}
        onDelete={handleDeleteExam}
      />

      {/* Toast */}
      <Toast
        showToast={showToast}
        isError={isError}
        onClose={() => setShowToast(false)}
        title={toastData.title}
        message={toastData.message}
        icon={toastData.icon}
        isDelete={toastData.isDelete}
      />
    </div>
  );
};

export default ExamDetail;