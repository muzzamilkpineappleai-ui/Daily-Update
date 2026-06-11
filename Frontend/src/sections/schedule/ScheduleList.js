import React, { useState, useEffect, useMemo } from 'react';
import '../../Styles/Schedule/Schedule.css';
import View from '../../assets/icons/Eye.png';
import Edit from '../../assets/icons/pencil_line.png';
import DeleteIcon from '../../assets/icons/delete2.png';
import Success from '../../assets/icons/Success.png';
import Error from '../../assets/icons/error.png';
import SearchIcon from '../../assets/icons/searchButton.png';
import AddSchedule from './AddSchedule';
import DeleteConfirmModal from '../../modals/DeleteConfirmModal';
import Toast from '../../modals/ToastModel';
import SpecificScheduleView from './SpecificScheduleView';
import {
  fetchSchedules,
  deleteSchedule,
  fetchCourses,
  fetchLecturers,
  fetchGrades,
  fetchBranches
} from '../../integration/scheduleAPI';

function ScheduleList() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [schedulesToView, setSchedulesToView] = useState([]);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [targetDay, setTargetDay] = useState('');
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [isError, setIsError] = useState(false);
  const [toastData, setToastData] = useState({
    title: '',
    message: '',
    icon: Success,
    isDelete: false,
  });

  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [branches, setBranches] = useState([]);
  const [applyFilter, setApplyFilter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ];

  // Load schedules
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await fetchSchedules(branches);
        setSchedule(data);
      } catch (error) {
        console.error('Failed to load schedules:', error);
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };
    loadSchedules();
  }, [branches]);

  // Load master data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [lecturersData, coursesData, gradesData, branchesData] = await Promise.all([
          fetchLecturers(),
          fetchCourses(),
          fetchGrades(),
          fetchBranches(),
        ]);
        setLecturers(lecturersData);
        setCourses(coursesData);
        setGrades(gradesData);
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to load master data:', error);
      }
    };
    fetchMasterData();
  }, []);

  // Set default day (today or tomorrow)
  useEffect(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDayIndex = now.getDay();
    const dayToShow =
      currentHour < 18
        ? daysOfWeek[currentDayIndex]
        : daysOfWeek[(currentDayIndex + 1) % 7];
    setSelectedDay(dayToShow);
    setTargetDay(dayToShow);
  }, []);

  const filteredSchedules = useMemo(() => {
    let results = schedule;
    if (applyFilter && selectedDay) {
      results = results.filter(
        (s) => Array.isArray(s.days) && s.days.includes(selectedDay)
      );
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(term)) ||
          (s.course && s.course.toLowerCase().includes(term)) ||
          (s.grade && s.grade.toLowerCase().includes(term)) ||
          (s.branch && s.branch.toLowerCase().includes(term)) ||
          (Array.isArray(s.days) && s.days.some(day => day && day.toLowerCase().includes(term))) ||
          (s.time && s.time.toLowerCase().includes(term))
      );
    }
    return results;
  }, [schedule, applyFilter, searchTerm, selectedDay]);

  const handleSearch = (term) => setSearchTerm(term);

  const handleAddBtnClick = () => {
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  // FIXED: Correctly map grade_id using .label (used in AddSchedule)
  const handleEdit = (scheduleItem) => {
    const lecturerId = lecturers.find((l) => l.name === scheduleItem.name)?.id?.toString() || '';
    const courseId = courses.find((c) => c.name === scheduleItem.course)?.id?.toString() || '';

    // This is the KEY FIX: grades use .label in AddSchedule component
    const gradeId = grades.find((g) => {
      const gradeLabel = (g.label || g.name || '').trim();
      const displayedGrade = (scheduleItem.grade || '').trim();
      return gradeLabel === displayedGrade;
    })?.id?.toString() || '';

    // Optional: Debug if grade not found
    // if (!gradeId) {
    //   console.warn('Grade ID not found for:', scheduleItem.grade, grades);
    // }

    setSelectedSchedule({
      ...scheduleItem,
      slot_id: scheduleItem.slot_id || scheduleItem.id,
      user_id: lecturerId,
      course_id: courseId,
      grade_id: gradeId, // Now correctly set
      branch_id: scheduleItem.branch_id || '',
      startTime: scheduleItem.start_time || scheduleItem.time?.split('-')[0]?.trim() || '',
      endTime: scheduleItem.end_time || scheduleItem.time?.split('-')[1]?.trim() || '',
      days: Array.isArray(scheduleItem.days)
        ? scheduleItem.days
        : scheduleItem.day
        ? [scheduleItem.day]
        : [],
    });

    setIsViewModalOpen(false);
    setIsModalOpen(true);
  };

  const handleView = (selectedSchedule) => {
    setApplyFilter(false);
    const filteredSchedules = schedule.filter((s) => s.name === selectedSchedule.name);
    setSchedulesToView(filteredSchedules);
    setIsViewModalOpen(true);
  };

  const handleOpenDeleteModal = (schedule) => {
    setScheduleToDelete(schedule);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteSchedule(scheduleToDelete.slot_id);
      setSchedule((prev) => prev.filter((s) => s.slot_id !== scheduleToDelete.slot_id));
      setSchedulesToView((prev) => prev.filter((s) => s.slot_id !== scheduleToDelete.slot_id));

      setToastData({
        title: 'Success',
        message: 'Schedule deleted successfully.',
        icon: DeleteIcon,
        isDelete: true
      });
      setIsError(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setToastData({ title: 'Error', message: error.message || 'Delete failed', icon: Error });
      setIsError(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setScheduleToDelete(null);
      setIsViewModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedSchedule(null);
    setScheduleToDelete(null);
    setSchedulesToView([]);
    setApplyFilter(false);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setIsError(false);
  };

  const handleUpdateSchedule = async (updatedSchedule) => {
    setSchedule((prev) =>
      prev.map((s) => (s.slot_id === updatedSchedule.slot_id ? updatedSchedule : s))
    );
    setSchedulesToView((prev) =>
      prev.map((s) => (s.slot_id === updatedSchedule.slot_id ? updatedSchedule : s))
    );

    setToastData({ title: 'Success', message: 'Schedule updated successfully.', icon: Success });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Refetch to stay in sync
    try {
      const data = await fetchSchedules(branches);
      setSchedule(data);
    } catch (err) {
      console.error('Refetch failed:', err);
    }
  };

const handleAddSchedule = async (newSchedules) => {
    setSchedule((prev) => [...prev, ...newSchedules]);
    setToastData({ title: 'Success', message: 'Schedule added successfully.', icon: Success });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    try {
      const data = await fetchSchedules(branches);
      setSchedule(data);
    } catch (err) {
      console.error('Refetch failed:', err);
    }
  };

  return (
    <div className="layout-container">
      <div className="schedule-action-row">
        <div className="schedule-search-box">
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => handleSearch(e.target.value)}
            value={searchTerm}
          />
          <img src={SearchIcon} alt="Search" className="schedule-search-img" />
        </div>
        <div className="schedule-add-btn-container">
          <button className="schedule-add-btn" onClick={handleAddBtnClick}>
            + Add Schedule
          </button>
        </div>
      </div>

      <div className="schedule-table-container">
        <div className="schedule-table-container1">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="schedule-th">Branch</th>
                <th className="schedule-th">Lecture Name</th>
                <th className="schedule-th">Course</th>
                <th className="schedule-th">Grade</th>
                <th className="schedule-th">Day</th>
                <th className="schedule-th">Time</th>
                <th className="schedule-th">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="schedule-td">Loading schedules...</td></tr>
              ) : filteredSchedules.length > 0 ? (
                filteredSchedules.map((sch) => (
                  <tr key={sch.slot_id}>
                    <td className="schedule-td">{sch.branch}</td>
                    <td className="schedule-td">{sch.name}</td>
                    <td className="schedule-td">{sch.course}</td>
                    <td className="schedule-td">{sch.grade}</td>
                    <td className="schedule-td">{sch.days?.[0] || 'N/A'}</td>
                    <td className="schedule-td">{sch.time}</td>
                    <td className="schedule-td action-cell">
                      <button className="schedule-btn" onClick={() => handleView(sch)}>
                        <img src={View} alt="View" />
                      </button>
                      <button className="schedule-btn" onClick={() => handleEdit(sch)}>
                        <img src={Edit} alt="Edit" />
                      </button>
                      <button className="schedule-btn" onClick={() => handleOpenDeleteModal(sch)}>
                        <img src={DeleteIcon} alt="Delete" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="schedule-td">No schedules available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddSchedule
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        schedule={selectedSchedule}
        onUpdate={handleUpdateSchedule}
        onAdd={handleAddSchedule}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseModal}
        onDelete={handleDelete}
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

      <SpecificScheduleView
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        schedules={schedulesToView}
        onEdit={handleEdit}
        onDelete={handleOpenDeleteModal}
      />
    </div>
  );
}

export default ScheduleList;