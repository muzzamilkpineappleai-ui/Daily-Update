import React from "react";
import Step1StudentsDetails from "./stepper/Step1StudentsDetails";
import Step2Courses from "./stepper/Step2Courses";
import Step3PaymentInfo from "./stepper/Step3PaymentInfo";
import PaymentSuccessModal from "../../modals/SuccesPaymentModel";
import { usePayment } from "./hooks/usePaymentStepper";

const PaymentStepper = ({ isOpen, onClose, onPaymentSuccess }) => {
  const {
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
  } = usePayment(isOpen, onPaymentSuccess);

  return (
    <div className="payment-stepper-container">
      <h2>Student Payment System</h2>
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading...</div>}

      {currentStep === 1 && <Step1StudentsDetails onStudentSelect={handleStudentSelect} />}

      {currentStep === 2 && selectedStudent && (
        <div>
          <Step2Courses
            student_details_id={selectedStudent.student_details_id}
            student_no={selectedStudent.student_no}
            onMonthSelect={handleMonthSelect}
            selectedMonths={selectedMonths}
          />
          <button onClick={handleBack} className="back-btn">Back</button>
          <button
            onClick={handleNext}
            className="next-btn"
            disabled={!selectedStudent || selectedMonths.length === 0 || isLoading}
          >
            Next
          </button>
        </div>
      )}

      {currentStep === 3 && selectedStudent && feesData && selectedMonths.length > 0 && (
        <div>
          <Step3PaymentInfo
            selectedStudent={selectedStudent}
            onSelectPayment={setFeesData}
            selectedMonths={selectedMonths}
          />
          <button onClick={handleBack} className="back-btn">Back</button>
          <button onClick={handleSubmit} className="submit-btn" disabled={isLoading}>
            Submit Payment
          </button>
        </div>
      )}

      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          onClose();
        }}
        receiptData={receiptData}
      />
    </div>
  );
};

export default PaymentStepper;
