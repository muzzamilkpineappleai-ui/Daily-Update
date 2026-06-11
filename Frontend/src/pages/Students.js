import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import StudentsList from '../sections/students/StudentsList';
import AddStudentForm from '../sections/students/AddStudentForm';
import StudentDetailsPopup from '../sections/students/editStepper/StudentDetailsPopup';
import Pagination from '../Components/Pagination'; 
import deleteToastIcon from '../assets/icons/Delete.png';
import { useToast } from '../modals/ToastProvider';
import {
  getAllUsers,
  getDropdownOptions,
  deleteUser as deleteUserAPI,
  updateUser as updateUserAPI,
} from '../integration/studentAPI';
import SearchIcon from '../assets/icons/searchButton.png';
import successIcon from '../assets/icons/Success.png';
import '../Styles/Students-css/Students.css';

const Students = () => {
  const { showToast } = useToast();

  // Data
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('student');

  // dropdowns
  const [courses, setCourses] = useState([]);
  const [roles, setRoles] = useState([]);

  // loading + form
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editMode, setEditMode] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(); 
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Fetch dropdowns (courses, roles)
  const fetchDropdownOptions = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        getDropdownOptions('courses'),
        getDropdownOptions('roles'),
      ]);

      const fetchedCourses =
        results[0].status === "fulfilled" ? results[0].value : [];
      const fetchedRoles =
        results[1].status === "fulfilled" ? results[1].value : [];

      setCourses(fetchedCourses);
      setRoles(fetchedRoles);
    } catch (error) {
      console.error('Error fetching dropdown options:', error);
    }
  }, []);

  // ❗ FIX: Reset course filter when no courses exist
  useEffect(() => {
    if (courses.length === 0) {
      setCourseFilter('');
    }
  }, [courses]);

  // Fetch users (paginated)
  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const { users: fetchedUsers, pagination } = await getAllUsers(
          page,
          limit,
          roleFilter || null
        );

        const uniqueUsers = Array.from(
          new Map(fetchedUsers.map((u) => [u.id, u])).values()
        );

        setUsers(uniqueUsers);
        setFilteredUsers(uniqueUsers);
        setCurrentPage(pagination.page || page);
        setTotalPages(pagination.totalPages || 1);
        setTotalUsers(pagination.total || uniqueUsers.length);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
        setFilteredUsers([]);
        setTotalPages(1);
        setTotalUsers(0);
      } finally {
        setLoading(false);
      }
    },
    [limit, roleFilter]
  );

  useEffect(() => {
    fetchDropdownOptions();
  }, [fetchDropdownOptions]);

  useEffect(() => {
    fetchUsers(currentPage);
    setSearchQuery('');
  }, [fetchUsers, currentPage, roleFilter]);

  // Local search (debounced)
  const handleSearch = useCallback(
    async (query) => {
      const q = query?.trim()?.toLowerCase() || '';
      if (!q) {
        applyAllFilters(users);
        return;
      }

      const matched = users.filter(
        (u) =>
          (u.name || `${u.first_name} ${u.last_name}` || '')
            .toLowerCase()
            .includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.student_no || '').toLowerCase().includes(q)
      );

      const unique = Array.from(new Map(matched.map((m) => [m.id, m])).values());
      setFilteredUsers(unique);
    },
    [users]
  );

  const debouncedSearch = useCallback(
    debounce((q) => handleSearch(q), 300),
    [handleSearch]
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Filters
  const applyAllFilters = useCallback(
    (baseUsers = users) => {
      let filtered = [...baseUsers];

      if (roleFilter) {
        filtered = filtered.filter(
          (u) => (u.role_name || '').toLowerCase() === roleFilter.toLowerCase()
        );
      }

      if (statusFilter) {
        filtered = filtered.filter(
          (u) => (u.status || '').toLowerCase() === statusFilter.toLowerCase()
        );
      }

      if (courseFilter) {
        filtered = filtered.filter((u) =>
          (u.assignedCourses || []).some(
            (ac) =>
              (ac.course || '').toLowerCase() === courseFilter.toLowerCase()
          )
        );
      }

      const uniqueFiltered = Array.from(
        new Map(filtered.map((user) => [user.id, user])).values()
      );

      setFilteredUsers(uniqueFiltered);
    },
    [roleFilter, statusFilter, courseFilter, users]
  );

  useEffect(() => {
    applyAllFilters();
  }, [statusFilter, courseFilter, roleFilter, users, applyAllFilters]);

  // Handlers
  const handleStatusFilter = (status) => setStatusFilter(status);
  const handleCourseFilter = (course) => setCourseFilter(course);
  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    setCurrentPage(1);
    setSearchQuery('');
  };

  const addUser = async (userData) => {
    try {
      if (userData && Array.isArray(userData.fetchedUsers)) {
        const uniqueUsers = Array.from(
          new Map(userData.fetchedUsers.map((u) => [u.id, u])).values()
        );
        setUsers(uniqueUsers);
        applyAllFilters(uniqueUsers);
      } else {
        await fetchUsers(currentPage);
      }

      setSearchQuery('');
      setIsFormOpen(false);
      setSelectedUser(null);
      setEditMode(false);

      showToast({
        title: 'Success',
        message: `${userData?.role_name || 'User'} added successfully!`,
        icon: successIcon,
      });
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      if (userData && Array.isArray(userData.fetchedUsers)) {
        const uniqueUsers = Array.from(
          new Map(userData.fetchedUsers.map((u) => [u.id, u])).values()
        );
        setUsers(uniqueUsers);
        applyAllFilters(uniqueUsers);
      } else {
        await fetchUsers(currentPage);
      }

      setIsFormOpen(false);
      setSelectedUser(null);
      setEditMode(false);

      showToast({
        title: 'Success',
        message: `${userData?.role_name || 'User'} updated successfully!`,
        icon: successIcon,
      });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteUserAPI(userId);
      await fetchUsers(currentPage);

      if (filteredUsers.length === 0 && currentPage > 1) {
        const prev = Math.max(1, currentPage - 1);
        setCurrentPage(prev);
        await fetchUsers(prev);
      }

      setSelectedUser(null);
      showToast({
        title: 'Deleted',
        message: 'User deleted successfully!',
        isDelete: true,
        icon: deleteToastIcon,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setIsFormOpen(false);
  };

  const handleEditUser = () => {
    setIsFormOpen(true);
    setEditMode(true);
  };

  if (loading) return <div className="students-page">Loading users...</div>;

  return (
    <div className="students-container">
      <div className="search-add-row">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or student number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
          <img src={SearchIcon} alt="Search" className="search-img" />
        </div>
        <div className="add-btn-wrapper">
          <button
            className="add-student-btn"
            onClick={() => {
              setSelectedUser(null);
              setEditMode(false);
              setIsFormOpen(true);
            }}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* FILTER DROPDOWNS */}
      <div className="filter-buttons">
        <select
          value={roleFilter}
          onChange={(e) => handleRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.role_name}>
              {r.role_name.charAt(0).toUpperCase() + r.role_name.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={courseFilter}
          onChange={(e) => handleCourseFilter(e.target.value)}
          className="filter-select"
          disabled={courses.length === 0}
        >
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.name}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      <StudentsList
        students={filteredUsers}
        onStudentClick={handleUserClick}
        onEditStudent={handleEditUser}
        onDeleteStudent={deleteUser}
        onSaveStudent={updateUser}
      />

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
          }}
        />
      </div>

      <AddStudentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditMode(false);
          setSelectedUser(null);
        }}
        onAddStudent={editMode ? updateUser : addUser}
        initialData={editMode ? selectedUser : null}
        isEditMode={editMode}
      />

      <StudentDetailsPopup
        isOpen={!!selectedUser && !editMode && !isFormOpen}
        onClose={() => {
          setSelectedUser(null);
          setEditMode(false);
        }}
        student={selectedUser}
        onSave={updateUser}
        onDelete={deleteUser}
        onEdit={handleEditUser}
      />
    </div>
  );
};

export default Students;
