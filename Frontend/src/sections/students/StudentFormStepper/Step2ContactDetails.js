import React, { useState } from "react";
import "../../../Styles/Students-css/StudentFormStepper/Step2ContactDetails.css";
import FormLabel from "../../../Components/FormLabel";
import { checkEmailExists } from "../../../integration/studentAPI";

const Step2ContactDetails = ({
  formData,
  onChange,
  errors,
  onOpenOtpModal,
}) => {
  const [emailCheckStatus, setEmailCheckStatus] = useState("idle");
  // 'idle' | 'checking' | 'exists' | 'available' | 'error'

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Reset email check status when user edits the email field
    if (name === "email") {
      setEmailCheckStatus("idle");
    }

    // Phone number normalization
    if (name === "phn_num" || name === "ice_contact") {
      let cleaned = value.replace(/[^\d+]/g, "");

      if (cleaned.startsWith("0") && cleaned.length >= 10) {
        cleaned = "+94" + cleaned.substring(1);
      } else if (/^7\d{8}$/.test(cleaned)) {
        cleaned = "+94" + cleaned;
      } else if (/^94\d{9}$/.test(cleaned)) {
        cleaned = "+" + cleaned;
      } else if (/^[1-9]\d{9,14}$/.test(cleaned)) {
        cleaned = "+" + cleaned;
      } else if (/^\+\d+$/.test(cleaned)) {
        if (cleaned.length > 16) cleaned = cleaned.substring(0, 16);
      } else if (
        cleaned === "" ||
        cleaned === "+" ||
        /^(\+94|\+94\d|07|\d+)$/.test(cleaned)
      ) {
        // allowed partial
      } else {
        cleaned = value.slice(0, -1);
      }

      value = cleaned;
    }

    onChange({ [name]: value });
  };

  const isValidEmailFormat = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleVerifyClick = async () => {
    const email = (formData.email || "").trim();

    // Step 1: check format first
    if (!isValidEmailFormat(email)) {
      setEmailCheckStatus("idle");
      return;
    }

    // Step 2: check if email already exists in DB
    setEmailCheckStatus("checking");

    try {
      const exists = await checkEmailExists(email);
      if (exists) {
        setEmailCheckStatus("exists");
      } else {
        setEmailCheckStatus("available");
        onOpenOtpModal();
      }
    } catch (err) {
      console.error("Email check failed:", err);
      setEmailCheckStatus("error");
    }
  };

  return (
    <div className="step-content-wrapper">
      <div className="step-form-container">
        <div className="step-two-fields">
          <h3 className="section-header">Contact Details</h3>

          <div className="form-row">
            <div className="form-group">
              <FormLabel
                htmlFor="phn_num"
                label="Phone Number"
                isRequired={true}
              />
              <input
                name="phn_num"
                type="tel"
                className={`input-box ${errors.phn_num ? "error-border" : ""}`}
                placeholder="+94712345678"
                value={formData.phn_num || ""}
                onChange={handleInputChange}
                maxLength={12}
              />
              {errors.phn_num && (
                <span className="error">{errors.phn_num}</span>
              )}
            </div>

            <div className="form-group">
              <FormLabel
                htmlFor="ice_contact"
                label="ICE Contact"
                isRequired={false}
              />
              <input
                name="ice_contact"
                type="tel"
                className={`input-box ${errors.ice_contact ? "error-border" : ""}`}
                placeholder="+94712345678 (optional)"
                value={formData.ice_contact || ""}
                onChange={handleInputChange}
                maxLength={12}
              />
              {errors.ice_contact && (
                <span className="error">{errors.ice_contact}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <FormLabel htmlFor="email" label="Email" isRequired={true} />

              <div className="email-field-container">
                <input
                  name="email"
                  type="email"
                  className={`input-box email-input ${
                    errors.email ||
                    emailCheckStatus === "exists" ||
                    emailCheckStatus === "error"
                      ? "error-border"
                      : ""
                  } ${formData.email_verified ? "verified" : ""}`}
                  placeholder="example@gmail.com"
                  value={formData.email || ""}
                  onChange={handleInputChange}
                />

                {formData.email_verified && (
                  <span className="verified-label-inside">
                    <span className="check-icon">✓</span> Verified
                  </span>
                )}
              </div>

              {/* Verify button — only when not yet verified */}
              {!formData.email_verified && (
                <button
                  type="button"
                  className="verify-email-btn-outside"
                  onClick={handleVerifyClick}
                  disabled={emailCheckStatus === "checking"}
                >
                  {emailCheckStatus === "checking" ? "Checking..." : "Verify"}
                </button>
              )}

              {/* Error messages in priority order */}
              {errors.email && <span className="error">{errors.email}</span>}
              {!errors.email && emailCheckStatus === "exists" && (
                <span className="error">
                  This email is already registered. Please use a different
                  email.
                </span>
              )}
              {!errors.email && emailCheckStatus === "error" && (
                <span className="error">
                  Could not verify email. Please try again.
                </span>
              )}
              {errors.email_verified && (
                <span className="error">{errors.email_verified}</span>
              )}
            </div>

            <div className="form-group">
              <FormLabel htmlFor="address" label="Address" isRequired={true} />
              <textarea
                name="address"
                className={`input-box ${errors.address ? "error-border" : ""}`}
                placeholder="Enter full address"
                value={formData.address || ""}
                onChange={handleInputChange}
                rows={4}
              />
              {errors.address && (
                <span className="error">{errors.address}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2ContactDetails;
