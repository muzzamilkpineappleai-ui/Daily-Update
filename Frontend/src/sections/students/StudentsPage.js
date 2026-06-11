import React, { useState, useEffect } from 'react';
import StudentsList from './StudentsList';
import AddStudentForm from './StudentFormStepper/AddStudentForm';
import { getAllStudents, deleteStudent } from '../integration/studentAPI';
import { useToast } from '../modals/ToastProvider';
import successIcon from '../../assets/icons/Success.png';
import errorIcon from '../../assets/icons/error.png';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const { showToast } = useToast();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await getAllStudents();
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format');
      }
      // Remove duplicates
      const uniqueStudents = Array.from(
        new Map(response.map((student) => [student.id, student])).values()
      );
      console.log('fetchStudents: Unique students fetched:', uniqueStudents);
      setStudents(uniqueStudents);
      setFilteredStudents(uniqueStudents);
      setError(null);
    } catch (e) {
      setError(`Failed to load students: ${e.message}`);
      showToast({
        title: 'Error',
        message: `Failed to load students: ${e.message}`,
        isError: true,
        icon: errorIcon,
      });
      setStudents([]);
      setFilteredStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [showToast]);

  useEffect(() => {
    let result = [...students];

    const trimmedQuery = (searchQuery || '').trim().toLowerCase();
    if (trimmedQuery) {
      result = result.filter((s) => {
        const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).trim().toLowerCase();
        const course = (s.course || '').trim().toLowerCase();
        const studentNo = (s.student_no || '').trim().toLowerCase();
        const email = (s.email || '').trim().toLowerCase();
        return (
          name.includes(trimmedQuery) ||
          course.includes(trimmedQuery) ||
          studentNo.includes(trimmedQuery) ||
          email.includes(trimmedQuery)
        );
      });
    }

    if (stateFilter) {
      const trimmedStateFilter = stateFilter.trim().toLowerCase();
      result = result.filter((s) => {
        const studentStatus = (s.status || 'active').trim().toLowerCase();
        return studentStatus === trimmedStateFilter;
      });
    }

    if (courseFilter) {
      const trimmedCourseFilter = courseFilter.trim().toLowerCase();
      result = result.filter((s) => {
        const matchesAssignedCourses = s.assignedCourses?.length > 0 &&
          s.assignedCourses.some((c) => (c.course || '').trim().toLowerCase() === trimmedCourseFilter);
        const courseStr = (s.course || '').trim().toLowerCase();
        const matchesCourseString = courseStr === trimmedCourseFilter ||
          courseStr.split(',').map(c => c.trim()).includes(trimmedCourseFilter);
        return matchesAssignedCourses || matchesCourseString;
      });
    }

    // Remove duplicates from filtered results
    const uniqueFiltered = Array.from(
      new Map(result.map((student) => [student.id, student])).values()
    );
    console.log('StudentsPage: Unique filtered students:', uniqueFiltered);
    setFilteredStudents(uniqueFiltered);
  }, [students, stateFilter, courseFilter, searchQuery]);

  const handleSaveStudent = async (data) => {
    console.log('StudentsPage: handleSaveStudent received:', data);
    const { fetchedUsers, ...userData } = data;
    let updatedStudents;
    if (fetchedUsers) {
      // Use re-fetched users
      updatedStudents = Array.from(
        new Map(fetchedUsers.map((student) => [student.id, student])).values()
      );
    } else {
      // Update or add locally
      const index = students.findIndex((s) => s.id === userData.id);
      if (index !== -1) {
        updatedStudents = students.map((s) =>
          s.id === userData.id ? { ...s, ...userData } : s
        );
      } else {
        updatedStudents = [...students, userData];
      }
      updatedStudents = Array.from(
        new Map(updatedStudents.map((student) => [student.id, student])).values()
      );
    }
    console.log('handleSaveStudent: Updated students:', updatedStudents);
    setStudents(updatedStudents);
    setFilteredStudents(updatedStudents);
    setIsAddOpen(false);
    setEditStudent(null);
    showToast({
      title: 'Success',
      message: 'Student saved successfully!',
      icon: successIcon,
    });
  };

  const handleEditStudent = (student) => {
    setEditStudent(student);
    setIsAddOpen(true);
  };

  const handleDeleteStudent = async (id) => {
    try {
      await deleteStudent(id);
      await fetchStudents();
      showToast({
        title: 'Success',
        message: 'Student deleted successfully!',
        isDelete: true,
        icon: successIcon,
      });
    } catch (error) {
      showToast({
        title: 'Error',
        message: `Failed to delete student: ${error.message}`,
        isError: true,
        icon: errorIcon,
      });
    }
  };

  return (
    <div>
      <h2>Students</h2>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={() => setIsAddOpen(true)} style={{ padding: '8px 16px' }}>
          Add Student
        </button>
        <input
          type="text"
          placeholder="Search by name, course, or student ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', width: '200px' }}
          aria-label="Search students"
        />
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          style={{ padding: '8px' }}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          style={{ padding: '8px' }}
          aria-label="Filter by course"
        >
          <option value="">All Courses</option>
          <option value="Violin">Violin</option>
          <option value="Piano">Piano</option>
          <option value="Guitar">Guitar</option>
          <option value="HNDIT">HNDIT</option>
          <option value="IT">IT</option>
          <option value="Software">Software</option>
        </select>
      </div>
      {loading && <div style={{ color: 'blue', marginBottom: '10px' }}>Loading students...</div>}
      
      {!loading && !error && filteredStudents.length === 0 && (
        <div style={{ color: 'orange', marginBottom: '10px' }}>
          No students found.
        </div>
      )}
      <StudentsList
        students={filteredStudents}
        onEditStudent={handleEditStudent}
        onDeleteStudent={handleDeleteStudent}
        onSaveStudent={handleSaveStudent}
      />
      <AddStudentForm
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditStudent(null);
        }}
        onAddStudent={handleSaveStudent}
        initialData={editStudent}
        isEditMode={!!editStudent}
      />
    </div>
  );
};

export default StudentsPage;