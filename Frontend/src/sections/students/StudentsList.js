import React, { useMemo, useState } from 'react';
import StudentProfilePopup from './StudentProfilePopup';
import '../../Styles/Students-css/StudentsList.css';
import Delete from '../../assets/icons/Delete.png';
import { useToast } from '../../modals/ToastProvider';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import errorIcon from '../../assets/icons/error.png';

const baseImageUrl = 'http://localhost:5000/uploads/';

const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('/uploads/')
  );
};

const StudentImage = ({ photo_url, first_name, last_name }) => {
  let fullImageUrl = '';
  if (photo_url) {
    if (!photo_url.startsWith('http') && !photo_url.startsWith('data:image/')) {
      fullImageUrl = baseImageUrl + photo_url.replace(/^\/?uploads\//i, '');
    } else {
      fullImageUrl = photo_url;
    }
  }

  const suspicious = ['https/:', 'wallpaper', 'undefined', 'null'];
  const shouldLog = suspicious.some((sub) => fullImageUrl?.includes(sub));

  if (!isValidImageUrl(fullImageUrl)) {
    if (shouldLog) {
      console.warn(
        `Invalid image URL for user: ${first_name} ${last_name}`,
        `Raw value: "${fullImageUrl}"`
      );
    }
    fullImageUrl = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
  }

  return (
    <img
      src={fullImageUrl}
      alt={`${first_name} ${last_name}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
      }}
      className='profile-img'
    />
  );
};

const StudentsList = ({ students, onEditStudent, onDeleteStudent, onSaveStudent, onStudentClick }) => {
  console.log('StudentsList: Received users prop:', students);
  // Check for duplicate IDs
  const idCounts = students.reduce((acc, user) => {
    acc[user.id] = (acc[user.id] || 0) + 1;
    return acc;
  }, {});
  const duplicates = Object.entries(idCounts).filter(([id, count]) => count > 1);
  if (duplicates.length > 0) {
    console.warn('StudentsList: Detected duplicate user IDs:', duplicates);
  }

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const { showToast } = useToast();

  const handleProfileClick = (user) => {
    setSelectedUser(user);
    setIsPopupOpen(true);
    if (onStudentClick) {
      onStudentClick(user);
    }
  };

  const handleEdit = (userData) => {
    console.log('StudentsList: Triggering edit for user=', JSON.stringify(userData, null, 2));
    if (onEditStudent) {
      onEditStudent();
    }
    setIsPopupOpen(false);
  };

  const handleDeleteClick = (e, userId) => {
    e.stopPropagation();
    console.log('handleDeleteClick: userId =', userId);
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) {
      console.error('handleDelete: No user ID provided');
      showToast({
        title: 'Error',
        message: 'No user selected for deletion',
        isError: true,
        icon: errorIcon,
      });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      return;
    }

    try {
      await onDeleteStudent(userToDelete);
      setIsPopupOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('handleDelete: Error deleting user:', err);
      showToast({
        title: 'Error',
        message: err.message || 'Failed to delete user',
        isError: true,
        icon: errorIcon,
      });
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const sortedUsers = useMemo(() => {
    return [...students].sort((a, b) => {
      const statusA = (a.status || '').toLowerCase();
      const statusB = (b.status || '').toLowerCase();
      return statusA === 'active' ? -1 : statusB === 'active' ? 1 : 0;
    });
  }, [students]);

  return (
    <div className='main-content'>
      <div className='container1'>
        {sortedUsers.length === 0 ? (
          <div className='empty-message'>No users found.</div>
        ) : (
          <div className='card-grid'>
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className={`profile-card ${user.status === 'inactive' ? 'inactive-card' : ''}`}
                onClick={() => handleProfileClick(user)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <StudentImage
                  photo_url={user.photo_url}
                  first_name={user.first_name}
                  last_name={user.last_name}
                />
                <p className='student-name1'>
                  {user.name || `${user.first_name} ${user.last_name}`}
                </p>
                <p className='student-course1'>
                  {user.role_name === 'student' ? `Course: ${user.course || 'N/A'}` : null}
                </p>
                {user.status === 'inactive' && (
                  <span className='inactive-label'>Inactive</span>
                )}
                <img
                  src={Delete}
                  className='delete-btn'
                  onClick={(e) => handleDeleteClick(e, user.id)}
                  style={{
                    position: 'absolute',
                    height: '26px',
                    top: '8px',
                    right: '8px',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <StudentProfilePopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedUser(null);
        }}
        studentData={selectedUser}
        onEdit={handleEdit}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default StudentsList;