import { useEffect, useState } from 'react';
import '../../../Styles/Report/specificPaymentReport.css';
import { fetchStudentPaymentHistory } from '../../../integration/paymentReportApi';

const SpecificPaymentReport = ({ isOpen, onClose, paymentData }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      if (!isOpen || !paymentData) return;
      setLoading(true);
      try {
        const res = await fetchStudentPaymentHistory(paymentData.student_details_id);
        setCourses(res.courses || []);
        setPaymentHistory(res.paymentHistory || []);
        setTotalPending(res.total_pending || 0);
      } catch (err) {
        console.error('Failed to load payment history:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [isOpen, paymentData]);

  if (!isOpen || !paymentData) return null;

  return (
    <div className="specificPaymentReport-modal-overlay" onClick={onClose}>
      <div className="specificPaymentReport-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="specificPaymentReport-close-button" onClick={onClose}>
          ×
        </button>

        <div className="specificPaymentReport-modal-header">
          <div className="specificPaymentReport-header-title">
            <h2>Payment Details</h2>
          </div>
        </div>

        <div className="specificPaymentReport-modal-body">
          <div className="specificPaymentReport-student-name">
            <p>
              <strong>Name : </strong>
              {paymentData.full_name}
            </p>
          </div>

          <div className="specificPaymentReport-course-table-container">
            <table className="specificPaymentReport-course-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {courses.length ? (
                  courses.map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td>{c.grade}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="specificPaymentReport-no-data">
                      No course info
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="specificPaymentReport-payment-history">
            <table className="specificPaymentReport-payment-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Payment (Rs)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="specificPaymentReport-loading">
                      Loading...
                    </td>
                  </tr>
                ) : paymentHistory.length ? (
                  paymentHistory.map((p, i) => (
                    <tr key={i}>
                      <td>{p.month}</td>
                      <td>{p.amount.toLocaleString('en-US')}</td>
                      <td>
                        <span className={`specificPaymentReport-status-badge specificPaymentReport-${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="specificPaymentReport-no-data">
                      No payment history
                    </td>
                  </tr>
                )}
                {totalPending > 0 && (
                  <tr className="specificPaymentReport-total-pending">
                    <td>
                      <strong>Total Pending</strong>
                    </td>
                    <td>
                      <strong>{totalPending.toLocaleString('en-US')}</strong>
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecificPaymentReport;