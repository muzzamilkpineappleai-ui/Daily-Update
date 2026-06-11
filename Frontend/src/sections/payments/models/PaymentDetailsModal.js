import React, { useEffect, useState, useCallback } from 'react';
import '../../../Styles/payment/PaymentDetailsModal.css';

import paymentApi from '../../../integration/paymentAPI';

const PaymentDetailsModal = ({ isOpen, onClose, paymentData }) => {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [course, setCourse] = useState('Unknown');
  const [grade, setGrade] = useState('Unknown');
  const [loading, setLoading] = useState(false);

  const extractPaymentAmount = useCallback((payment) => {
    const possibleAmountFields = ['payment', 'amount', 'payment_amount', 'total_amount'];
    for (const field of possibleAmountFields) {
      if (payment && payment[field] !== undefined && payment[field] !== null) {
        const value = payment[field];
        const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (!isNaN(numValue) && numValue > 0) {
          return numValue;
        }
      }
    }
    return 0;
  }, []);

  const safeExtract = useCallback((obj, paths) => {
    if (!obj) return null;
    for (const path of paths) {
      const keys = path.split('.');
      let current = obj;
      let isValid = true;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          isValid = false;
          break;
        }
      }
      if (isValid && current !== null && current !== undefined) {
        return current;
      }
    }
    return null;
  }, []);

  const normalizePaymentData = useCallback((payment) => {
    console.log('Normalizing payment data:', payment);
    const normalizedPayment = {
      payment_date: safeExtract(payment, ['date', 'payment_date', 'created_at']) || new Date().toISOString().split('T')[0],
      branch_name: safeExtract(payment, ['branch', 'branch_name', 'location']) || 'N/A',
      amount: extractPaymentAmount(payment),
      status: safeExtract(payment, ['status', 'payment_status']) || 'Unknown'
    };
    console.log('Normalized payment:', normalizedPayment);
    return normalizedPayment;
  }, [extractPaymentAmount, safeExtract]);

  useEffect(() => {
    if (isOpen && paymentData) {
      console.log('PaymentData received:', paymentData);

      // Set initial course and grade from paymentData
      const extractGrade = () => {
        if (paymentData.grade) return paymentData.grade.toString().replace('Grade ', '');
        if (paymentData.subjects && paymentData.subjects.length > 0) {
          return paymentData.subjects[0].grade?.toString().replace('Grade ', '') || 'Unknown';
        }
        return paymentData.gradeLevel || 'Unknown';
      };
      setCourse(paymentData.course || (paymentData.subjects && paymentData.subjects[0]?.name) || 'Unknown');
      setGrade(extractGrade());

      if (paymentData?.student_details_id || paymentData?.student_no) {
        const studentId = paymentData?.student_details_id || paymentData?.student_no;
        console.log('Fetching history for student ID:', studentId);
        setLoading(true);

        const fetchPaymentHistory = async () => {
          try {
            const response = await paymentApi.fetchPaymentHistory(studentId);
            console.log('API Response:', response);

            // Update course and grade from API response
            setCourse(response.course || paymentData.course || 'Unknown');
            setGrade(response.grade || paymentData.grade || 'Unknown');

            const allHistory = [...response.paidHistory, ...response.pendingHistory];
            const normalizedHistory = allHistory.map(payment => normalizePaymentData(payment));

            const filteredHistory = normalizedHistory.filter(payment =>
              !paymentData.selectedStatus ||
              paymentData.selectedStatus === 'All' ||
              payment.status === paymentData.selectedStatus
            );

            const uniqueHistory = filteredHistory.filter((payment, index, self) =>
              index === self.findIndex(p =>
                p.payment_date === payment.payment_date &&
                p.amount === payment.amount &&
                p.status === payment.status &&
                p.branch_name === payment.branch_name
              )
            ).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

            setPaymentHistory(uniqueHistory.length > 0 ? uniqueHistory : [normalizePaymentData(paymentData)]);
          } catch (error) {
            console.error('Error fetching payment history:', error);
            setPaymentHistory([normalizePaymentData(paymentData)]);
          } finally {
            setLoading(false);
          }
        };

        fetchPaymentHistory();
      } else {
        const initialPayment = normalizePaymentData(paymentData);
        setPaymentHistory([initialPayment]);
        setLoading(false);
      }
    }
  }, [isOpen, paymentData, normalizePaymentData]);

  useEffect(() => {
    let intervalId;
    if (isOpen && (paymentData?.student_details_id || paymentData?.student_no)) {
      const studentId = paymentData?.student_details_id || paymentData?.student_no;
      intervalId = setInterval(async () => {
        try {
          const response = await paymentApi.fetchPaymentHistory(studentId);
          console.log('Auto-refresh API Response:', response);

          setCourse(response.course || paymentData.course || 'Unknown');
          setGrade(response.grade || paymentData.grade || 'Unknown');

          const allHistory = [...response.paidHistory, ...response.pendingHistory];
          const normalizedHistory = allHistory.map(payment => normalizePaymentData(payment));

          const uniqueHistory = normalizedHistory.filter((payment, index, self) =>
            index === self.findIndex(p =>
              p.payment_date === payment.payment_date &&
              p.amount === payment.amount &&
              p.status === payment.status &&
              p.branch_name === payment.branch_name
            )
          ).sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

          if (uniqueHistory.length > 0) {
            setPaymentHistory(uniqueHistory);
          }
        } catch (error) {
          console.error('Error refreshing payment history:', error);
        }
      }, 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, paymentData?.student_details_id, paymentData?.student_no, normalizePaymentData]);

  if (!isOpen || !paymentData) return null;

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Payment Details</h2>
          <button className="payment-close-button" onClick={onClose}>×</button>
        </div>
        <div className="payment-modal-body">
          <div className="student-info-section">
            <p><strong>Name: </strong>{paymentData?.full_name || paymentData?.fullName || paymentData?.name || 'N/A'}</p>
          </div>
          <div className="course-info-section">
            <div className="course-header">
              <span className="course-header-title">Course</span>
              <span className="grade-header-title">Grade</span>
            </div>
            <div className="course-row">
              <span className="course-name">{course}</span>
              <span className="course-grade">{grade}</span>
            </div>
          </div>
          <div className="payment-history-section">
            <div className="payment-history-header">
              <h3>Payment History</h3>
            </div>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Branch</th>
                  <th>Payment(Rs)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      Loading payment history...
                    </td>
                  </tr>
                ) : paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <tr key={`${payment.payment_date}-${payment.amount}-${index}`}>
                      <td>{payment.payment_date}</td>
                      <td>{payment.branch_name || 'N/A'}</td>
                      <td>{payment.amount > 0 ? payment.amount.toLocaleString('en-US') : 'N/A'}</td>
                      <td>
                        <span className={`payment-status ${payment.status.toLowerCase()}`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                      No payment history found
                    </td>
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

export default PaymentDetailsModal;
