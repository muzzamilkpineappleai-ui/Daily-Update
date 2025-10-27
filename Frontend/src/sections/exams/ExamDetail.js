import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EditIcon from '../../assets/icons/Edit.png';
import DeleteIcon from '../../assets/icons/delete2.png';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import AddExamForm from '../exams/AddExam';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import '../../Styles/Exam/examDetail.css';

const ExamDetail = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { courseName, exams, courseId } = state || { courseName: 'Unknown Course', exams: [], courseId: null };
  
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
  const [localExams, setLocalExams] = useState(exams);

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
      setLocalExams(localExams.filter(e => e.id !== examToDelete.id));
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

  const handleFormSubmit = (formData) => {
    if (editingExam) {
      setLocalExams(localExams.map(exam =>
        exam.id === editingExam.id ? { ...exam, ...formData, id: exam.id, date: formData.examDate, time: `${formData.startTime}-${formData.endTime}` } : exam
      ));
      setToastData({
        title: 'Success',
        message: 'Exam updated successfully.',
        icon: Success,
        isDelete: false,
      });
      setIsError(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setEditingExam(null);
    }
    setIsAddingExam(false);
  };

  return (
    <div className="exam-detail-container">
      <div className="exam-detail-header">
        <button className="exam-back-btn" onClick={() => navigate(-1)}>
          Back to Exam List
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
          {localExams.length > 0 ? (
            localExams.map(exam => (
              <tr key={exam.id}>
                <td>
                  <span className="grade-badge">{exam.grade}</span>
                </td>
                <td>{exam.date}</td>
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
            ))
          ) : (
            <tr>
              <td colSpan="6">No exams available for this course</td>
            </tr>
          )}
        </tbody>
      </table>

      {isAddingExam && (
        <AddExamForm
          onSubmit={handleFormSubmit}
          onCancel={() => { setIsAddingExam(false); setEditingExam(null); }}
          courses={[{ id: courseId, name: courseName }]}
          initialData={editingExam ? {
            courseId,
            grade: editingExam.grade,
            startTime: editingExam.time.split('-')[0],
            endTime: editingExam.time.split('-')[1],
            examDate: editingExam.date,
            examType: editingExam.type,
            groupName: editingExam.groupName || '',
          } : { courseId }}
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
    </div>
  );
};

export default ExamDetail;