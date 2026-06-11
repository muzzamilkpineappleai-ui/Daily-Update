import React, { useState } from "react";
import "../Styles/otpModal.css";

const OtpVerificationModal = ({
  email,
  onClose,
  onSendOtp,
  onVerifyOtp,
  loadingSend,
  loadingVerify,
}) => {
  const [code, setCode] = useState("");

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">
        <h2>Email Verification</h2>

        <p className="otp-email">
          Verifying: <strong>{email}</strong>
        </p>

        <button
          className="otp-btn send-btn"
          onClick={() => onSendOtp(email)}
          disabled={loadingSend}
        >
          {loadingSend ? "Sending..." : "Send Verification Code"}
        </button>

        <input
          className="otp-input"
          placeholder="Enter 6-digit code"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value)}
        />

        <button
          className="otp-btn verify-btn"
          disabled={loadingVerify}
          onClick={() => onVerifyOtp(email, code)}
        >
          {loadingVerify ? "Verifying..." : "Verify Code"}
        </button>

        <button className="otp-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default OtpVerificationModal;
