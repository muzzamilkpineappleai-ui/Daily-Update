import { useState, useEffect } from "react";
import { fetchFeeDetails, submitPayment, fetchGrades } from "../../../integration/paymentAPI";

export const usePayment = (isOpen, onPaymentSuccess) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feesData, setFeesData] = useState(null);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSelectedStudent(null);
      setFeesData(null);
      setSelectedMonths([]);
      setError(null);
      setShowSuccessModal(false);
      setReceiptData(null);
    }
  }, [isOpen]);

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setCurrentStep(2);
  };

  const handleMonthSelect = (months) => {
    setSelectedMonths(Array.isArray(months) ? months : []);
  };

  const handleNext = async () => {
    if (currentStep === 2 && selectedStudent?.student_details_id && selectedMonths.length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchFeeDetails(selectedStudent.student_details_id, selectedMonths);
        setFeesData(response.data);
        setCurrentStep(3);
      } catch (err) {
        setError("Failed to fetch fee details: " + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Please select a student and at least one month before proceeding.");
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (selectedStudent && feesData && selectedMonths.length > 0) {
      setIsLoading(true);
      setError(null);
      try {
        const response = await submitPayment(selectedStudent.student_details_id, selectedMonths);

        // Fetch grade names
        const userGrades = await fetchGrades(selectedStudent.student_details_id);
        const gradeMap = new Map(userGrades.data.data.map((grade) => [grade.id, grade.name]));

        const enrichedData = {
          fullName: selectedStudent.full_name || "N/A",
          studentId: selectedStudent.student_details_id,
          student_no: selectedStudent.student_no,
          subjects: selectedMonths.flatMap((month) =>
            Object.entries(feesData.course_fees?.[month] || {}).flatMap(([gradeKey, courses]) =>
              Object.entries(courses).map(([courseName]) => ({
                name: courseName,
                grade: gradeKey.replace("Grade ", ""),
              }))
            )
          ),
          paidFor: selectedMonths.join(", "),
          admissionFee: feesData.admission_fee || 0,
          monthlyFee: feesData.total_course_fees || 0,
          totalAmount: feesData.total_fees || 0,
          location: selectedStudent.branch_name || "N/A",
          date:
            response.data.payment_date ||
            new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Colombo" }),
          transactionId:
            response.data.paymentId ||
            Math.random().toString(36).substr(2, 9).toUpperCase(),
          status: response.data.status || "Paid",
        };

        setReceiptData(enrichedData);
        setShowSuccessModal(true);
        onPaymentSuccess(enrichedData);
      } catch (err) {
        setError("Failed to submit payment: " + (err.response?.data?.error || err.message));
      } finally {
        setIsLoading(false);
      }
    } else {
      setError("Missing required data for payment.");
    }
  };

  return {
    currentStep,
    selectedStudent,
    feesData,
    selectedMonths,
    isLoading,
    error,
    showSuccessModal,
    receiptData,
    setFeesData,
    setShowSuccessModal,
    handleStudentSelect,
    handleMonthSelect,
    handleNext,
    handleBack,
    handleSubmit,
  };
};
