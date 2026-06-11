import React, { useState, useEffect, useMemo } from 'react';
import { fetchAttendance } from '../../integration/attendanceApi';
import QRScanner from './QR_Scanner';
import SearchIcon from '../../assets/icons/searchButton.png';
import '../../Styles/Attendance/Attendance.css'; // Ensure path is correct

function AttendanceList() {
  const [attendance, setAttendance] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [stopScanning, setStopScanning] = useState(false);

  const fetchAttendanceData = async () => {
    try {
      const data = await fetchAttendance();
      setAttendance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const filteredAttendance = useMemo(() => {
    if (!searchTerm) return attendance;
    const term = searchTerm.toLowerCase();
    return attendance.filter(
      (item) =>
        item.studentName.toLowerCase().includes(term) ||
        item.courseName.toLowerCase().includes(term) ||
        item.status.toLowerCase().includes(term) ||
        item.entryDate.toLowerCase().includes(term) ||
        item.entryTime.toLowerCase().includes(term) ||
        item.slotTime.toLowerCase().includes(term)
    );
  }, [attendance, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleAttendanceMarked = () => {
    fetchAttendanceData();
  };

  const toggleScanner = () => {
    if (showScanner) {
      setStopScanning(true);
    } else {
      setStopScanning(false);
    }
    setShowScanner(!showScanner);
  };

  if (loading) {
    return <div>Loading attendance data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="layout-container">
      <div className="attendance-action-row">
        <div className="attendance-search-box">
          <input
            type="text"
            placeholder="Search by course or name"
            onChange={(e) => handleSearch(e.target.value)}
            value={searchTerm}
          />
          <img src={SearchIcon} alt="Search" className="attendance-search-icon" />
        </div>
        <button onClick={toggleScanner} className="attendance-scan-button">
          {showScanner ? 'Close Scanner' : 'Scan QR'}
        </button>
      </div>

      {showScanner && (
        <div className="attendance-scan-modal-overlay">
          <div className="attendance-scan-modal-content">
            <button className="attendance-scan-modal-close" onClick={toggleScanner}>
              ×
            </button>
            <QRScanner onAttendanceMarked={handleAttendanceMarked} stopScanning={stopScanning} />
          </div>
        </div>
      )}

      <div className="attendance-table-container">
        <div className="attendance-table-container1">
          <table className="attendance-table">
            <thead>
              <tr>
                <th className="attendance-th">Student Name</th>
                <th className="attendance-th">Course Name</th>
                <th className="attendance-th">Entry Date</th>
                <th className="attendance-th">Entry Time</th>
                <th className="attendance-th">Slot Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((item, index) => (
                  <tr key={index}>
                    <td className="attendance-td">{item.studentName}</td>
                    <td className="attendance-td">{item.courseName}</td>
                    <td className="attendance-td">{item.entryDate}</td>
                    <td className="attendance-td">{item.entryTime}</td>
                    <td className="attendance-td">{item.slotTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="attendance-td">No attendance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AttendanceList;