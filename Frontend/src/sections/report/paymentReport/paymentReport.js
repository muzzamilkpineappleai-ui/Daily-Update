import React, { useEffect, useState } from 'react';
import '../../../Styles/Report/paymentReport.css';
import SpecificPaymentReport from '../paymentReport/specificPaymentReport';
import searchIcon from "../../../assets/icons/searchButton.png";
import { fetchCurrentMonthReport, API_BASE_URL } from '../../../integration/paymentReportApi';

const PaymentReport = () => {
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchCurrentMonthReport();
        setStudents(data);
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredStudents = students
    .filter((s) => filter === 'All' || s.status === filter)
    .filter((s) => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (a.status === 'Pending' && b.status === 'Paid' ? -1 : 1));

  const openModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const renderStudentCard = (student) => (
    <div
      key={student.student_details_id}
      className="payment-report-card"
      onClick={() => openModal(student)}
      style={{ cursor: 'pointer' }}
    >
      <div className="payment-report-avatar">
        <img
          src={`${API_BASE_URL}${student.photo_url}`}
          alt={student.full_name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
          }}
          className="payment-report-image"
        />
      </div>
      <p className="payment-report-name">{student.full_name}</p>
      <span className={`payment-report-status ${student.status.toLowerCase()}`}>
        {student.status}
      </span>
    </div>
  );

  return (
    <div className="payment-report-container">
      <div className="report-header">
        <div className="report-search-container">
  <input
    type="text"
    className="report-search-input"
    placeholder="Search by name..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  <img
    src={searchIcon}
    alt="Search"
    className="report-search-icon"
  />
</div>


        <div className="report-filters">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="report-filter-select"
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <section className="report-section">
        {loading ? (
          <p className="loading">Loading students...</p>
        ) : filteredStudents.length > 0 ? (
          <div className="payment-report-grid">
            {filteredStudents.map(renderStudentCard)}
          </div>
        ) : (
          <p className="no-data">No students found</p>
        )}
      </section>

      <SpecificPaymentReport
        isOpen={isModalOpen}
        onClose={closeModal}
        paymentData={selectedStudent}
      />
    </div>
  );
};

export default PaymentReport;
