import React, { useState, useEffect, useMemo } from 'react';
import '../../Styles/Dashboard/dashborad.css';
import FilterIcon from '../../assets/icons/Filter.png';
import { fetchDashboardSchedule, fetchBranches } from '../../integration/dashboardApi';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function Dashboard() {
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [schedule, setSchedule] = useState({});
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch branches and schedule
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch branches
        const branchData = await fetchBranches();
        setBranches(branchData);

        // Fetch schedule based on selected location
        const branch = branchData.find(b => b.branch_name === selectedLocation);
        const branchId = branch && selectedLocation !== 'All' ? branch.id : null;
        const scheduleData = await fetchDashboardSchedule(branchId);
        console.log('Schedule Data:', scheduleData); // Debug log to inspect data
        setSchedule(scheduleData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedLocation]);

  // Get locations for dropdown, optionally grouped by country
  const getLocations = () => {
    if (branches.length === 0) return ['All'];
    const grouped = branches.reduce((acc, branch) => {
      const country = branch.country || 'Other';
      if (!acc[country]) acc[country] = [];
      acc[country].push(branch.branch_name);
      return acc;
    }, {});
    const options = ['All'];
    Object.keys(grouped).sort().forEach(country => {
      grouped[country].sort().forEach(branch => {
        options.push(`${country} - ${branch}`);
      });
    });
    return options;
  };

  // Calculate total students with memoization
  const totalStudents = useMemo(() => {
    const students = selectedLocation === 'All'
      ? Object.values(schedule)
          .flatMap(branch =>
            Object.values(branch).flatMap(timeSlot =>
              Object.values(timeSlot).flat()
            )
          )
      : Object.values(schedule[selectedLocation.split(' - ')[1]] || {})
          .flatMap(timeSlot => Object.values(timeSlot).flat());
    console.log('Students for total count:', students); // Debug log
    return new Set(students.map(student => student.id)).size; // Use id for uniqueness
  }, [schedule, selectedLocation]);

  // Get current schedule based on selected location
  const getCurrentSchedule = () => {
    if (selectedLocation === 'All') {
      const merged = {};
      Object.keys(schedule).forEach(branch => {
        Object.keys(schedule[branch]).forEach(timeSlot => {
          if (!merged[timeSlot]) merged[timeSlot] = {};
          Object.keys(schedule[branch][timeSlot]).forEach(day => {
            if (!merged[timeSlot][day]) merged[timeSlot][day] = [];
            merged[timeSlot][day].push(...schedule[branch][timeSlot][day]);
          });
        });
      });
      return merged;
    }
    return schedule[selectedLocation.split(' - ')[1]] || {};
  };

  // Render calendar body
  const renderCalendarBody = () => {
    const currentSchedule = getCurrentSchedule();

    // Check if the schedule is empty
    if (Object.keys(currentSchedule).length === 0) {
      return <div className="no-data-message">No schedule data available</div>;
    }

    const timeSlots = Object.keys(currentSchedule).sort((a, b) => {
      const getMinutes = (timeRange) => {
        const startTime = timeRange.split('-')[0].trim();
        const [time, modifier] = startTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        return hours * 60 + (minutes || 0);
      };
      return getMinutes(a) - getMinutes(b);
    });

    return timeSlots.map(time => (
      <div key={time} className="time-row">
        <div className="time-label">{time}</div>
        {days.map(day => {
          const students = currentSchedule[time]?.[day] || [];
          const visibleStudents = students.slice(0, 5);
          const extraCount = students.length - visibleStudents.length;

          return (
            <div key={day} className="day-cell">
              {visibleStudents.map((student) => (
                <div className="student-info" key={student.id}>
                  <img
                    src={student.photo_url}
                    alt={student.display_name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                      }}
                    className="student-img"
                  />
                  <div className="student-name2">{student.display_name}</div>
                </div>
              ))}
              {extraCount > 0 && <div className="more-btn">+ {extraCount} more</div>}
            </div>
          );
        })}
      </div>
    ));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="app">
      <div className="header">
        <div className="custom-select-container">
          <div className="custom-select-wrapper">
            <select
              className="custom-select"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {getLocations().map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <img src={FilterIcon} alt="Filter Icon" className="filter-icon" />
          </div>
        </div>
        <div className="total-students">Total Students - {totalStudents}</div>
      </div>

      <div className="calendar">
        <div className="calendar-header">
          <div className="time-slot-header">Time</div>
          {days.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        <div className="calendar-body">{renderCalendarBody()}</div>
      </div>
    </div>
  );
}

export default Dashboard;