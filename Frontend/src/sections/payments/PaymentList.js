import React, { useState, useEffect, useRef } from 'react';
import '../../Styles/payment/Payment.css';
import eyeIcon from '../../assets/icons/Eye.png';
import searchIcon from '../../assets/icons/searchButton.png';
import filterIcon from '../../assets/icons/filter2.png';
import PaymentDetailsModal from '../payments/models/PaymentDetailsModal';
import PaymentSuccessModal from '../payments/models/SuccesPaymentModel';
import Receipt from './Recipt';
import Step1StudentsDetails from '../payments/stepper/Step1StudentsDetails';
import Step2Courses from '../payments/stepper/Step2Courses';
import Step3PaymentInfo from '../payments/stepper/Step3PaymentInfo';
import StepperHeader from '../payments/stepper/StepperHeader';
import PendingModal from '../payments/models/PendingModal';
import { parse, format, isValid } from 'date-fns';

import paymentApi from '../../integration/paymentAPI';

const PaymentList = ({ selectedState: propSelectedState = 'State' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isStepperOpen, setIsStepperOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [selectedState, setSelectedState] = useState(propSelectedState);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const stateDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const [payments, setPayments] = useState([]);
  const [originalPayments, setOriginalPayments] = useState([]);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  // paymentHistories keyed by student_details_id => always an array of history objects
  const [paymentHistories, setPaymentHistories] = useState({});

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatDate = (dateStr, paymentId) => {
    if (!dateStr) {
      console.warn(`dateStr is undefined or null for payment ${paymentId}, using current date`);
      return format(new Date(), 'yyyy-MM-dd');
    }
    let date;
    if (dateStr instanceof Date) {
      date = dateStr;
    } else {
      // try dd/MM/yyyy first (your code expects en-GB input in many places)
      date = parse(dateStr, 'dd/MM/yyyy', new Date());
      if (!isValid(date)) {
        // fallback to native parsing
        date = new Date(dateStr);
        if (!isValid(date)) {
          console.warn(`Invalid payDate for payment ${paymentId}: ${dateStr}, using current date`);
          date = new Date();
        }
      }
    }
    return format(date, 'yyyy-MM-dd');
  };

  // Normalize history result to array safely:
  const normalizeHistoryResult = (history) => {
    if (Array.isArray(history)) return history;
    if (history == null) return [];
    // if it's an object (single record), wrap it in array
    return [history];
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setIsLoading(true);
        setOriginalPayments([]);
        setPayments([]);
        const data = await paymentApi.fetchPayments({
          state: selectedState,
          status: selectedStatus,
        });
        setOriginalPayments(Array.isArray(data) ? data : []);
        setPayments(Array.isArray(data) ? data : []);
        const histories = {};
        await Promise.all(data.map(async (payment) => {
          if (payment.student_details_id) {
            try {
              const history = await paymentApi.fetchPaymentHistory(payment.student_details_id);
              // ensure it's an array (or [] if null/undefined) or wrap single object
              histories[payment.student_details_id] = normalizeHistoryResult(history);
            } catch (err) {
              console.warn(`No payment history for student ${payment.student_details_id}:`, err && err.message ? err.message : err);
              histories[payment.student_details_id] = [];
            }
          }
        }));
        setPaymentHistories(histories);
      } catch (err) {
        console.error('Error fetching payments:', err && err.message ? err.message : err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, [selectedState, selectedStatus, refreshKey]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim() === '') {
        forceRefresh();
        return;
      }
      try {
        setIsLoading(true);
        const data = await paymentApi.searchPayments({
          status: selectedStatus,
          search: searchQuery,
        });
        setOriginalPayments(Array.isArray(data) ? data : []);
        setPayments(Array.isArray(data) ? data : []);
        const histories = {};
        await Promise.all(data.map(async (payment) => {
          if (payment.student_details_id) {
            try {
              const history = await paymentApi.fetchPaymentHistory(payment.student_details_id);
              histories[payment.student_details_id] = normalizeHistoryResult(history);
            } catch (err) {
              console.warn(`No payment history for student ${payment.student_details_id}:`, err && err.message ? err.message : err);
              histories[payment.student_details_id] = [];
            }
          }
        }));
        setPaymentHistories(histories);
      } catch (err) {
        console.error('Error fetching search results:', err && err.message ? err.message : err);
      } finally {
        setIsLoading(false);
      }
    };
    const timeoutId = setTimeout(fetchSearchResults, 3000);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) {
        setIsStateDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddPayment = () => {
    setIsStepperOpen(true);
  };

  const handleStateDropdownToggle = () => {
    setIsStateDropdownOpen(!isStateDropdownOpen);
    setIsStatusDropdownOpen(false);
  };

  const handleStatusDropdownToggle = () => {
    setIsStatusDropdownOpen(!isStatusDropdownOpen);
    setIsStateDropdownOpen(false);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state.value);
    setIsStateDropdownOpen(false);
    forceRefresh();
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status.value);
    setIsStatusDropdownOpen(false);
    forceRefresh();
  };

  const handleIconClick = (action, paymentId) => {
    const payment = payments.find((p) => p.id === paymentId);
    if (payment) {
      if (action === 'View') {
        const pendingHistory = paymentHistories[payment.student_details_id] || [];
        setSelectedPayment({ ...payment, selectedStatus, pendingHistory });
        if (selectedStatus === 'Pending') {
          setIsPendingModalOpen(true);
        } else {
          setIsModalOpen(true);
        }
      }
    } else {
      console.warn(`Payment with id ${paymentId} not found`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    forceRefresh();
  };

  const closePendingModal = () => {
    setIsPendingModalOpen(false);
    setSelectedPayment(null);
    forceRefresh();
  };

  const closeStepper = () => {
    setIsStepperOpen(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setReceiptData(null);
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
  };

  // Helper to safely push a new history entry (ensures existing is array)
  const pushHistoryForStudent = (studentId, entry) => {
    setPaymentHistories(prev => {
      const existing = prev ? prev[studentId] : undefined;
      const normalizedExisting = Array.isArray(existing) ? existing : (existing ? [existing] : []);
      return {
        ...prev,
        [studentId]: [
          ...normalizedExisting,
          entry
        ],
      };
    });
  };

  const handlePaymentSuccess = async (data) => {
    console.log('Payment Success Data:', data);
    try {
      setIsLoading(true);
      const newPayment = {
        id: data.id || undefined,
        full_name: data.fullName || data.studentName || 'N/A',
        student_no: data.studentId || `STU_${Date.now()}`,
        course: data.course || 'Violin',
        payDate: formatDate(
          data.date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
          'new_payment'
        ),
        amount: parseInt(data.totalAmount) || parseInt(data.amount) || 4000,
        status: data.status || 'Paid',
        branch_name: data.location || 'N/A',
        student_details_id: data.student_details_id || data.studentId,
        course_fees: data.course_fees || {},
        selectedMonths: data.selectedMonths || [],
      };

      const isDuplicate = originalPayments.some(p =>
        p.id === newPayment.id ||
        (p.student_no === newPayment.student_no &&
         p.full_name === newPayment.full_name &&
         p.payDate === newPayment.payDate)
      );

      if (!isDuplicate) {
        const newReceiptData = {
          student_details_id: newPayment.student_details_id,
          student_no: newPayment.student_no || data.studentId || `STU_${Date.now()}`,
          full_name: newPayment.full_name || data.fullName || data.studentName || 'N/A',
          branch_name: newPayment.branch_name || data.location || 'N/A',
          course_fees: newPayment.course_fees || data.course_fees || {},
          total_course_fees: parseInt(data.monthlyFee || data.amount) || 0,
          admission_fee: parseInt(data.admissionFee) || 0,
          total_fees: parseInt(data.totalAmount || data.amount) || 0,
          date: formatDate(newPayment.payDate, newPayment.id || 'new_payment'),
          paidFor: newPayment.selectedMonths?.join(', ') || data.paidFor || (data.selectedMonths && data.selectedMonths.join(', ')) || 'N/A',
          selectedMonths: newPayment.selectedMonths || data.selectedMonths || [],
        };

        setOriginalPayments(prev => [...prev, newPayment].sort((a, b) =>
          new Date(formatDate(b.payDate || b.payment_date, b.id)) - new Date(formatDate(a.payDate || a.payment_date, a.id))
        ));
        setPayments(prev => [...prev, newPayment].sort((a, b) =>
          new Date(formatDate(b.payDate || b.payment_date, b.id)) - new Date(formatDate(a.payDate || a.payment_date, a.id))
        ));
        setReceiptData(newReceiptData);
        setIsSuccessModalOpen(true);

        // Add a normalized history entry for UI purposes
        pushHistoryForStudent(
          newPayment.student_details_id,
          {
            // include both 'date' and 'payDate' to be tolerant to code expecting either
            date: formatDate(newPayment.payDate, newPayment.id),
            payDate: formatDate(newPayment.payDate, newPayment.id),
            branch: newPayment.branch_name || 'N/A',
            amount: newPayment.amount || 4000,
            status: newPayment.status || 'Paid',
          }
        );

        setTimeout(() => forceRefresh(), 1000);
      } else {
        console.warn('Duplicate payment detected, skipping addition:', newPayment);
      }
    } catch (error) {
      console.error('Error processing payment:', error && error.message ? error.message : error);
      const newPayment = {
        id: Date.now(),
        name: data.fullName || data.studentName || 'N/A',
        course: data.course || 'Violin',
        payDate: formatDate(
          data.date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
          'fallback_payment'
        ),
        amount: parseInt(data.totalAmount) || parseInt(data.amount) || 4000,
        status: data.status || 'Paid',
        student_no: data.studentId || `STU_${Date.now()}`,
        full_name: data.fullName || data.studentName || 'N/A',
        student_details_id: data.student_details_id || data.studentId,
        course_fees: data.course_fees || {},
        selectedMonths: data.selectedMonths || [],
      };

      const isDuplicate = originalPayments.some(p =>
        p.id === newPayment.id ||
        (p.student_no === newPayment.student_no &&
         p.full_name === newPayment.full_name &&
         p.payDate === newPayment.payDate)
      );

      if (!isDuplicate) {
        const newReceiptData = {
          student_details_id: newPayment.student_details_id,
          student_no: newPayment.student_no,
          full_name: newPayment.full_name,
          branch_name: data.location || 'N/A',
          course_fees: newPayment.course_fees || data.course_fees || {},
          total_course_fees: parseInt(data.monthlyFee || data.amount) || 0,
          admission_fee: parseInt(data.admissionFee) || 0,
          total_fees: parseInt(data.totalAmount || data.amount) || 0,
          date: formatDate(newPayment.payDate, newPayment.id),
          paidFor: newPayment.selectedMonths?.join(', ') || data.paidFor || (data.selectedMonths && data.selectedMonths.join(', ')) || 'N/A',
          selectedMonths: newPayment.selectedMonths || data.selectedMonths || [],
        };

        setOriginalPayments(prev => [...prev, newPayment].sort((a, b) =>
          new Date(formatDate(b.payDate || b.payment_date, b.id)) - new Date(formatDate(a.payDate || a.payment_date, a.id))
        ));
        setPayments(prev => [...prev, newPayment].sort((a, b) =>
          new Date(formatDate(b.payDate || b.payment_date, b.id)) - new Date(formatDate(a.payDate || a.payment_date, a.id))
        ));
        setReceiptData(newReceiptData);
        setIsSuccessModalOpen(true);

        pushHistoryForStudent(
          newPayment.student_details_id,
          {
            date: formatDate(newPayment.payDate, newPayment.id),
            payDate: formatDate(newPayment.payDate, newPayment.id),
            branch: newPayment.branch_name || 'N/A',
            amount: newPayment.amount || 4000,
            status: newPayment.status || 'Paid',
          }
        );

        setTimeout(() => forceRefresh(), 1000);
      } else {
        console.warn('Duplicate payment detected in fallback, skipping addition:', newPayment);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReceipt = async (student_details_id) => {
    if (student_details_id && !isLoading) {
      setIsLoading(true);
      try {
        const data = await paymentApi.fetchFeeDetails(student_details_id, receiptData?.selectedMonths || []);
        const formattedData = {
          full_name: data.full_name || receiptData?.full_name || 'N/A',
          branch_name: data.branch_name || receiptData?.branch_name || 'N/A',
          student_no: data.student_no || receiptData?.student_no || 'N/A',
          course_fees: data.course_fees || receiptData?.course_fees || {},
          total_course_fees: data.total_course_fees || receiptData?.total_course_fees || 0,
          admission_fee: data.admission_fee || receiptData?.admission_fee || 0,
          total_fees: data.total_fees || receiptData?.total_fees || 0,
          date: formatDate(
            data.date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
            'receipt_data'
          ),
          paidFor: data.selectedMonths?.join(', ') || receiptData?.paidFor || receiptData?.selectedMonths?.join(', ') || 'N/A',
          selectedMonths: data.selectedMonths || receiptData?.selectedMonths || [],
        };
        setReceiptData(formattedData);
        setIsReceiptOpen(true);
        setIsSuccessModalOpen(false);
      } catch (error) {
        console.error('Error fetching receipt data:', error && error.message ? error.message : error);
        const formattedData = {
          full_name: receiptData?.full_name || 'N/A',
          branch_name: receiptData?.branch_name || 'N/A',
          student_no: receiptData?.student_no || 'N/A',
          course_fees: receiptData?.course_fees || {},
          total_course_fees: receiptData?.total_course_fees || 0,
          admission_fee: receiptData?.admission_fee || 0,
          total_fees: receiptData?.total_fees || 0,
          date: formatDate(
            receiptData?.date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
            'receipt_fallback'
          ),
          paidFor: receiptData?.paidFor || receiptData?.selectedMonths?.join(', ') || 'N/A',
          selectedMonths: receiptData?.selectedMonths || [],
        };
        setReceiptData(formattedData);
        setIsReceiptOpen(true);
        setIsSuccessModalOpen(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getFilteredPayments = () => {
    const currentDate = new Date();
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 10);
    const isBeforeDueDate = currentDate <= dueDate;

    // Group payments by student_details_id (or fallback)
    const groupedPayments = payments.reduce((acc, payment) => {
      const studentNo = payment.student_details_id || `unknown_${payment.id || Date.now()}`;
      const originalPayment = originalPayments.find(p => p.id === payment.id) || payment;

      if (!acc[studentNo]) {
        acc[studentNo] = { ...payment, originalStatus: originalPayment.status, originalAmount: originalPayment.amount || 4000 };
      } else {
        const existingDate = new Date(formatDate(acc[studentNo].payDate || acc[studentNo].payment_date || '1970-01-01', acc[studentNo].id));
        const thisDate = new Date(formatDate(payment.payDate || payment.payment_date || '1970-01-01', payment.id));
        if (thisDate > existingDate) {
          acc[studentNo] = { ...payment, originalStatus: originalPayment.status, originalAmount: originalPayment.amount || 4000 };
        }
      }
      return acc;
    }, {});

    const filtered = Object.values(groupedPayments).map((payment, index) => {
      let payDateStr = payment.payDate || payment.payment_date || payment.date || '1970-01-01';
      let payDate = new Date(formatDate(payDateStr, payment.id));

      let adjustedStatus = payment.originalStatus || payment.status || 'Unknown';
      let pendingDuration = '0 Months';
      let totalPendingAmount = 0;

      const uniqueId = payment.id || `frontend-${payment.student_details_id || 'unknown'}-${index}-${payDateStr}`;

      if (payment.student_details_id) {
        // histories should always be arrays thanks to normalization and pushHistoryForStudent
        const pendingHistory = paymentHistories[payment.student_details_id] || [];
        if (pendingHistory.length > 0) {
          // be tolerant: history entries might have 'payDate' or 'date' fields
          const pendingItems = pendingHistory.filter(p => {
            const entryDateStr = p.payDate || p.date || p.datePaid || '';
            const entryDate = new Date(formatDate(entryDateStr || '1970-01-01', payment.id));
            return p.status === 'Pending' && entryDate <= currentDate;
          });

          if (pendingItems.length > 0) {
            totalPendingAmount = pendingItems.reduce((sum, p) => sum + (p.amount || p.payment || 4000), 0);
            pendingDuration = `${pendingItems.length} Month${pendingItems.length !== 1 ? 's' : ''}`;
            adjustedStatus = 'Pending';
          } else {
            adjustedStatus = 'Paid';
            totalPendingAmount = 0;
          }
        }
      }

      if (totalPendingAmount === 0) {
        const paymentMonth = payDate.getMonth();
        const paymentYear = payDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        if (payment.originalStatus === 'Paid') {
          adjustedStatus = 'Paid';
          totalPendingAmount = 0;
        } else if (paymentYear < currentYear || (paymentYear === currentYear && paymentMonth < currentMonth)) {
          adjustedStatus = 'Pending';
          const monthsDiff = (currentYear - paymentYear) * 12 + (currentMonth - paymentMonth);
          totalPendingAmount = monthsDiff * (payment.originalAmount || 4000);
          pendingDuration = `${monthsDiff} Month${monthsDiff !== 1 ? 's' : ''}`;
        } else if (isBeforeDueDate) {
          adjustedStatus = (payDate >= currentMonthStart && payDate <= currentDate) ? 'Paid' : 'Pending';
          totalPendingAmount = (payDate >= currentMonthStart && payDate <= currentDate) ? 0 : (payment.originalAmount || 4000);
          pendingDuration = totalPendingAmount > 0 ? '1 Month' : '0 Months';
        } else {
          adjustedStatus = (payDate >= currentMonthStart && payDate <= currentDate) ? 'Paid' : 'Pending';
          totalPendingAmount = (payDate >= currentMonthStart && payDate <= currentDate) ? 0 : (payment.originalAmount || 4000);
          pendingDuration = totalPendingAmount > 0 ? '1 Month' : '0 Months';
        }
      }

      return {
        ...payment,
        id: uniqueId,
        amount: selectedStatus === 'Pending' ? totalPendingAmount : (payment.originalAmount || payment.amount || 0),
        status: adjustedStatus,
        pendingDuration: pendingDuration,
        formattedPayDate: formatDate(payDateStr, payment.id),
      };
    }).filter(payment => {
      const matchesSearch = (
        searchQuery === '' ||
        (payment.full_name && payment.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.formattedPayDate && payment.formattedPayDate.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (payment.amount !== undefined && payment.amount !== null && payment.amount.toString().includes(searchQuery))
      );
      return matchesSearch && (selectedStatus === 'All' || payment.status === selectedStatus);
    }).sort((a, b) => new Date(b.formattedPayDate) - new Date(a.formattedPayDate));

    return filtered;
  };

  const stateOptions = [
    { value: 'State', label: 'State' },
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ];

  const statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Pending', label: 'Pending' },
  ];

  const selectedStateOption = stateOptions.find((option) => option.value === selectedState) || stateOptions[0];

  const StudentFeeStepperModal = ({ isOpen, onClose, onPaymentSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feesData, setFeesData] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState('Violin');
    const [selectedMonths, setSelectedMonths] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('Paid');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      if (isOpen) {
        setCurrentStep(1);
        setSelectedStudent(null);
        setFeesData(null);
        setSelectedCourse('Violin');
        setSelectedMonths([]);
        setSelectedStatus('Paid');
        setError(null);
        setIsSubmitting(false);
      }
    }, [isOpen]);

    const handleMonthSelect = (months) => {
      setSelectedMonths(Array.isArray(months) ? months : []);
    };

    const handleNext = async () => {
      if (currentStep === 1 && selectedStudent) {
        try {
          setError(null);
          setIsSubmitting(true);
          const data = await paymentApi.fetchFeeDetails(selectedStudent.student_details_id);
          setFeesData({ ...data, course: selectedCourse });
          setCurrentStep(2);
        } catch (err) {
          console.error('Error fetching fees for student_no:', selectedStudent.student_no, err);
          setError(err && err.message ? err.message : 'Error fetching fees');
        } finally {
          setIsSubmitting(false);
        }
      } else if (currentStep === 2 && selectedMonths.length > 0) {
        try {
          setError(null);
          setIsSubmitting(true);
          const data = await paymentApi.fetchFeeDetails(selectedStudent.student_details_id, selectedMonths);
          setFeesData({ ...data, course: selectedCourse });
          setCurrentStep(3);
        } catch (err) {
          console.error('Error fetching fees for selected months:', err);
          setError(err && err.message ? err.message : 'Error fetching fees for months');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setError('Please select at least one month to proceed.');
      }
    };

    const handlePrev = () => {
      if (currentStep > 1) {
        setCurrentStep((prev) => prev - 1);
        setError(null);
      }
    };

    const handleSubmit = async () => {
      if (selectedStudent && feesData && selectedMonths.length > 0 && !isSubmitting) {
        setIsSubmitting(true);
        try {
          const paymentData = {
            full_name: selectedStudent.full_name || 'N/A',
            student_no: selectedStudent.student_no || `STU_${Date.now()}`,
            course: selectedCourse || 'Violin',
            total_fees: feesData.total_fees || 4000,
            date: format(new Date(), 'yyyy-MM-dd'),
            status: selectedStatus,
            branch_name: selectedStudent.branch_name || 'N/A',
            course_fees: feesData.course_fees || {},
            admission_fee: feesData.admission_fee || 0,
            selectedMonths,
          };

          const paymentResponse = await paymentApi.submitPayment(
            selectedStudent.student_details_id,
            paymentData
          );

          const successData = {
            fullName: paymentResponse.full_name || selectedStudent.full_name || 'N/A',
            studentId: paymentResponse.student_no || selectedStudent.student_no || `STU_${Date.now()}`,
            student_details_id: paymentResponse.student_details_id || selectedStudent.student_details_id,
            course: paymentResponse.course || selectedCourse || 'Violin',
            amount: paymentResponse.total_fees || feesData.total_fees || 4000,
            date: formatDate(
              paymentResponse.date || new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Colombo' }),
              paymentResponse.id || 'new_payment'
            ),
            transactionId: Math.random().toString(36).substr(2, 9).toUpperCase(),
            status: paymentResponse.status || selectedStatus,
            location: paymentResponse.branch_name || selectedStudent.branch_name || 'N/A',
            subjects: Object.entries(paymentResponse.course_fees || feesData.course_fees || {}).flatMap(
              ([month, grades]) =>
                Object.entries(grades).flatMap(([grade, courses]) =>
                  Object.entries(courses).map(([courseName]) => ({
                    name: courseName,
                    grade: grade.replace('Grade ', ''),
                  }))
                )
            ),
            paidFor: paymentResponse.selectedMonths?.join(', ') || selectedMonths.join(', ') || 'N/A',
            admissionFee: paymentResponse.admission_fee || feesData.admission_fee || 0,
            monthlyFee: paymentResponse.total_course_fees || feesData.total_course_fees || feesData.total_fees || 0,
            totalAmount: paymentResponse.total_fees || feesData.total_fees || 0,
            course_fees: paymentResponse.course_fees || feesData.course_fees || {},
            selectedMonths: paymentResponse.selectedMonths || selectedMonths || [],
          };

          onPaymentSuccess(successData);
          onClose();
        } catch (err) {
          console.error('Error sending payment data:', err);
          setError(err && err.message ? err.message : 'Error sending payment');
          const fallbackData = {
            fullName: selectedStudent.full_name || 'N/A',
            studentId: selectedStudent.student_no || `STU_${Date.now()}`,
            student_details_id: selectedStudent.student_details_id,
            course: selectedCourse,
            amount: feesData.total_fees || 4000,
            date: format(new Date(), 'yyyy-MM-dd'),
            transactionId: Math.random().toString(36).substr(2, 9).toUpperCase(),
            status: selectedStatus,
            location: selectedStudent.branch_name || 'N/A',
            subjects: Object.entries(feesData.course_fees || {}).flatMap(([month, grades]) =>
              Object.entries(grades).flatMap(([grade, courses]) =>
                Object.entries(courses).map(([courseName]) => ({
                  name: courseName,
                  grade: grade.replace('Grade ', ''),
                }))
              )
            ),
            paidFor: selectedMonths.join(', ') || 'N/A',
            admissionFee: feesData.admission_fee || 0,
            monthlyFee: feesData.total_course_fees || feesData.total_fees || 0,
            totalAmount: feesData.total_fees || 0,
            course_fees: feesData.course_fees || {},
            selectedMonths,
          };
          onPaymentSuccess(fallbackData);
          onClose();
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setError('Missing required data for payment.');
      }
    };

    const renderStepContent = () => {
      switch (currentStep) {
        case 1:
          return <Step1StudentsDetails onStudentSelect={setSelectedStudent} />;
        case 2:
          return selectedStudent ? (
            <Step2Courses
              student_details_id={selectedStudent.student_details_id}
              student_no={selectedStudent.student_no}
              feesData={feesData}
              onCourseSelect={setSelectedCourse}
              currentCourse={selectedCourse}
              onMonthSelect={handleMonthSelect}
              selectedMonths={selectedMonths}
            />
          ) : (
            <p>Select a student first.</p>
          );
        case 3:
          return selectedStudent && feesData ? (
            <Step3PaymentInfo
              selectedStudent={selectedStudent}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedMonths={selectedMonths}
              onSelectPayment={setFeesData}
            />
          ) : (
            <p>Loading payment info...</p>
          );
        default:
          return null;
      }
    };

    if (!isOpen) return null;

    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal-content student-fee-entry-modal">
          <div className="payment-modal-header">
            <h2>Student Fee Entry</h2>
            <button className="payment-close-btn" onClick={onClose}>×</button>
          </div>
          <StepperHeader currentStep={currentStep} />
          <div className="payment-modal-body">{renderStepContent()}</div>
          <div className="payment-modal-footer">
            {currentStep > 1 && (
              <button className="payment-prev-btn" onClick={handlePrev} disabled={isSubmitting}>
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                className="payment-next-btn"
                onClick={handleNext}
                disabled={(currentStep === 1 && !selectedStudent) || (currentStep === 2 && selectedMonths.length === 0) || isSubmitting}
              >
                Next
              </button>
            ) : (
              <button
                className="payment-submit-btn"
                onClick={handleSubmit}
                disabled={!selectedStudent || !feesData || selectedMonths.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            )}
          </div>
          {error && <div className="payment-error-message">{error}</div>}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="payment-header">
  <div className="payment-search-wrapper">
    <input
      type="text"
      placeholder="Search..."
      className="payment-search-bar"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
    />
    <img
      src={searchIcon}
      alt="Search"
      className="payment-search-icon"
    />
  </div>

  <button className="payment-add-payment-btn" onClick={handleAddPayment}>
    + Add Payment
  </button>
</div>


      <div className="payment-filter-controls-container">
        <div className="payment-state-dropdown-container" ref={stateDropdownRef}>
          <button
            className={`payment-state-dropdown-btn ${isStateDropdownOpen ? 'open' : ''}`}
            onClick={handleStateDropdownToggle}
            type="button"
          >
            <span>{selectedStateOption.label}</span>
            <svg
              className={`payment-dropdown-arrow ${isStateDropdownOpen ? 'rotated' : ''}`}
              width="12"
              height="8"
              viewBox="0 0 12 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1.5L6 6.5L11 1.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isStateDropdownOpen && (
            <div className="payment-state-dropdown-menu">
              {stateOptions.map((option) => (
                <div
                  key={option.value}
                  className={`payment-state-dropdown-item ${selectedState === option.value ? 'selected' : ''}`}
                  onClick={() => handleStateSelect(option)}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="payment-table-container1">
        <table className="payment-table1">
          <thead>
            <tr>
              {selectedStatus === 'Pending' ? (
                <>
                  <th className="payment-th">Name</th>
                  <th className="payment-th">Amount (Rs)</th>
                  <th className="payment-th">Pending</th>
                  <th className="payment-th">
                    <div className="payment-status-filter-container" ref={statusDropdownRef}>
                      Status
                      <img
                        src={filterIcon}
                        alt="Filter"
                        className="payment-icon payment-filter-icon"
                        onClick={handleStatusDropdownToggle}
                      />
                      {isStatusDropdownOpen && (
                        <div className="payment-status-dropdown-menu">
                          {statusOptions.map((option) => (
                            <div
                              key={option.value}
                              className={`payment-status-dropdown-item ${selectedStatus === option.value ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusSelect(option);
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="payment-th">Action</th>
                </>
              ) : (
                <>
                  <th className="payment-th">Name</th>
                  <th className="payment-th">Pay Date</th>
                  <th className="payment-th">Amount (Rs)</th>
                  <th className="payment-th">
                    <div className="payment-status-filter-container" ref={statusDropdownRef}>
                      Status
                      <img
                        src={filterIcon}
                        alt="Filter"
                        className="payment-icon payment-filter-icon"
                        onClick={handleStatusDropdownToggle}
                      />
                      {isStatusDropdownOpen && (
                        <div className="payment-status-dropdown-menu">
                          {statusOptions.map((option) => (
                            <div
                              key={option.value}
                              className={`payment-status-dropdown-item ${selectedStatus === option.value ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusSelect(option);
                              }}
                            >
                              {option.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  <th className="payment-th">Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {getFilteredPayments().map((payment) => (
              <tr key={payment.id}>
                {selectedStatus === 'Pending' ? (
                  <>
                    <td className="payment-td">{payment.full_name || payment.name || 'Unknown Name'}</td>
                    <td className="payment-td">{(payment.amount || 0).toLocaleString('en-US')}</td>
                    <td className="payment-td">{payment.pendingDuration}</td>
                    <td className="payment-td">
                      <span className={payment.status === 'Paid' ? 'payment-status-paid' : 'payment-status-pending'}>
                        {payment.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="payment-td payment-action-icons">
                      <img
                        src={eyeIcon}
                        alt="View"
                        className="payment-icon"
                        onClick={() => handleIconClick('View', payment.id)}
                        title="View Details"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="payment-td">{payment.full_name || payment.name || 'Unknown Name'}</td>
                    <td className="payment-td">{payment.formattedPayDate}</td>
                    <td className="payment-td">{(payment.amount || 0).toLocaleString('en-US')}</td>
                    <td className="payment-td">
                      <span className={payment.status === 'Paid' ? 'payment-status-paid' : 'payment-status-pending'}>
                        {payment.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="payment-td payment-action-icons">
                      <img
                        src={eyeIcon}
                        alt="View"
                        className="payment-icon"
                        onClick={() => handleIconClick('View', payment.id)}
                        title="View Details"
                      />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="payment-loading-indicator">
            <p>Loading payments...</p>
          </div>
        )}
        {!isLoading && getFilteredPayments().length === 0 && (
          <div className="payment-no-data">
            <p>No payments found for the selected filters.</p>
          </div>
        )}
      </div>

      <PaymentDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        paymentData={selectedPayment}
        key={selectedPayment?.id}
      />
      <StudentFeeStepperModal
        isOpen={isStepperOpen}
        onClose={closeStepper}
        onPaymentSuccess={handlePaymentSuccess}
      />
      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={closeSuccessModal}
        onGenerateReceipt={() => handleGenerateReceipt(receiptData?.student_details_id)}
        receiptData={receiptData}
      />
      <Receipt
        isOpen={isReceiptOpen}
        onClose={closeReceipt}
        receiptData={receiptData}
      />
      <PendingModal
        isOpen={isPendingModalOpen}
        onClose={closePendingModal}
        paymentData={selectedPayment}
      />
    </>
  );
};

export default PaymentList;
