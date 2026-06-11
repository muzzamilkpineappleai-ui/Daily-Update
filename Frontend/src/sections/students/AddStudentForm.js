import React, { useState, useEffect, useMemo } from "react";
import Stepper from "./StudentFormStepper/StudentFormStepper";
import Step1PersonalInfo from "./StudentFormStepper/Step1PersonalInfo";
import Step2ContactDetails from "./StudentFormStepper/Step2ContactDetails";
import Step3EducationalRecords from "./StudentFormStepper/Step3EducationalRecords";
import Step4AcademicDetails from "./StudentFormStepper/Step4AcademicDetails";
import Step5Summary from "./StudentFormStepper/Step5Summary";

import OtpVerificationModal from "../../modals/OtpVerificationModal ";

import "../../Styles/Students-css/AddStudentForm.css";
import closeIcon from "../../assets/icons/Close.png";
import { useToast } from "../../modals/ToastProvider";

import {
  getAllUsers,
  createUser,
  updateUser,
  getDropdownOptions,
  sendVerificationCode,
  verifyEmailCode,
} from "../../integration/studentAPI";

import NextButton from "../../Components/Buttons/Next_button";
import PreviousButton from "../../Components/Buttons/PreviousButton";
import LongNextButton from "../../Components/Buttons/LongNextButton";
import successIcon from "../../assets/icons/Success.png";
import errorIcon from "../../assets/icons/error.png";

const getInitialFormData = () => ({
  status: "Active",
  salutation: "",
  first_name: "",
  last_name: "",
  name: "",
  username: "",
  date_of_birth: "",
  gender: "",
  role: "",
  phn_num: "",
  ice_contact: "",
  email: "",
  email_verified: false,
  email_code: "",
  address: "",
  photo_url: "/default-avatar.png",
  previewUrl: null,
  photoFile: null,
  branch: "",
  student_no: "",
  course: "",
  grade: "",
  payment: { amount: "", status: "pending" },
  assignedCourses: [],
  schedules: [],
  resetKey: Date.now(),
});

const AddStudentForm = ({
  isOpen,
  onClose,
  onAddStudent,
  initialData,
  isEditMode,
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);

  const totalSteps = formData.role === "student" ? 4 : 2;
  const steps = useMemo(
    () =>
      formData.role === "student"
        ? [
            "Personal Information",
            "Contact Details",
            "Educational Records",
            "Academic Details",
          ]
        : ["Personal Information", "Contact Details"],
    [formData.role]
  );


const normalizePhone = (phone) => {
  if (!phone) return "";

  const original = String(phone).trim();
  const cleaned = original.replace(/[^\d]/g, ""); 

  if (/^\+\d{10,15}$/.test(original)) {
    return original;
  }

  if (/^94\d{9}$/.test(cleaned)) return "+" + cleaned;          
  if (/^0\d{9}$/.test(cleaned)) return "+94" + cleaned.substring(1); 
  if (/^7\d{8}$/.test(cleaned)) return "+94" + cleaned;         

  if (/^\d{10,15}$/.test(cleaned)) {
    return "+" + cleaned; 
  }

  if (/^\+94\d{9}$/.test(original)) return original;

  return original;
};

  useEffect(() => {
    if (!isOpen) {
      setFormData(getInitialFormData());
      setStep(1);
      setErrors({});
      setShowSummary(false);
      return;
    }

    if (initialData) {
      const firstCourse = initialData.assignedCourses?.[0] || {};

      const enrichedSchedules = (initialData.schedules || []).map((sched) => ({
        ...sched,
        branch: sched.branch || initialData.branch || "",
        studentId: sched.studentId || sched.student_no || initialData.student_no || "",
        day: sched.day || "N/A",
        time: sched.time || "N/A",
        id: sched.id || Date.now() + Math.random(),
      }));

      setFormData((prev) => ({
        ...prev,
        ...initialData,

        email_verified: true,
        role: initialData.role_name || initialData.role || "",
        phn_num: normalizePhone(initialData.phn_num || ""),
        ice_contact: normalizePhone(initialData.ice_contact || ""),
        assignedCourses: initialData.assignedCourses || [],
        schedules: enrichedSchedules,
        previewUrl: initialData.photo_url || null,

        course: firstCourse.course_id || firstCourse.course || "",
        grade: firstCourse.grade_id || firstCourse.grade || "",

        branch: initialData.branch || "",
        student_no: initialData.student_no || "",

        resetKey: Date.now(),
      }));

      setStep(1);
      setErrors({});
      setShowSummary(false);
    }
  }, [initialData, isOpen]);

const validateStep = (cur) => {
  const errs = {};
  const safeStr = (v) => (v == null ? "" : String(v).trim());

  if (cur === 1) {
    ["first_name", "last_name", "date_of_birth", "role"].forEach((f) => {
      if (!safeStr(formData[f])) errs[f] = "Required";
    });
  }

if (cur === 2) {
  /* PHONE */
  const phone = safeStr(formData.phn_num);
  if (!phone) {
    errs.phn_num = "Phone number is required";
  } else if (phone.startsWith("+94")) {
    if (!/^\+94\d{9}$/.test(phone)) {
      errs.phn_num = "Sri Lankan number must have exactly 9 digits after +94";
    }
  } else if (!/^\+\d{11,15}$/.test(phone)) {
    errs.phn_num = "International number must have valid digits after country code";
  }

  /* EMAIL */
  const email = safeStr(formData.email);
  if (!email) {
    errs.email = "Email is required";
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errs.email = "Invalid email format";
  } else if (!formData.email_verified) {
    errs.email_verified = "Please verify your email";
  }

  /* ADDRESS */
  const address = safeStr(formData.address);
  if (!address) {
    errs.address = "Address is required";
  } else if (address.length < 5) {
    errs.address = "Address is too short";
  }

  /* ICE (optional) */
  const ice = safeStr(formData.ice_contact);
  if (ice && ice !== "N/A") {
    if (ice.startsWith("+94")) {
      if (!/^\+94\d{9}$/.test(ice)) {
        errs.ice_contact = "ICE: Must be +94 + exactly 9 digits";
      }
    } else if (!/^\+\d{10,15}$/.test(ice)) {
      errs.ice_contact = "ICE: Must have valid digits after country code";
    }
  }
}



    if (cur === 3 && formData.role === "student") {
      if (!formData.assignedCourses?.length)
        errs.assignedCourses = "At least one course required";
    }

    if (cur === 4 && formData.role === "student") {
      if (!safeStr(formData.branch)) errs.branch = "Branch is required";
      if (!safeStr(formData.student_no)) errs.student_no = "Student No is required";
      if (!formData.schedules?.length)
        errs.schedules = "At least one schedule required";
    }

    return errs;
  };

  const handleNext = () => {
    if (isSubmitting) return;
    const errs = validateStep(step);

    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast({
        title: "Validation Error",
        message: "Fix highlighted fields",
        isError: true,
        icon: errorIcon,
      });
      return;
    }

    setErrors({});
    if (step < totalSteps) setStep(step + 1);
    else setShowSummary(true);
  };

  const handleBack = () => {
    if (!isSubmitting) setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFormDataChange = (updates) => {
    setFormData((prev) => {
      const updated = { ...prev, ...updates };

      if ("email" in updates && updates.email !== prev.email) {
        updated.email_verified = false;
      }

      if (updates.salutation || updates.first_name || updates.last_name) {
        updated.name = `${updated.salutation || ""} ${updated.first_name || ""} ${updated.last_name || ""}`.trim();
      }

      return updated;
    });

    setErrors((prev) => {
      const copy = { ...prev };
      Object.keys(updates).forEach((k) => delete copy[k]);
      return copy;
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        title: "Too Large",
        message: "Max 5MB",
        isError: true,
        icon: errorIcon,
      });
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      showToast({
        title: "Invalid File",
        message: "Only JPG/PNG allowed",
        isError: true,
        icon: errorIcon,
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () =>
      handleFormDataChange({ photoFile: file, previewUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const openOtpModal = () => {
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      showToast({
        title: "Invalid Email",
        message: "Enter a valid email before verifying",
        isError: true,
        icon: errorIcon,
      });
      return;
    }
    setShowOtpModal(true);
  };

  const handleSendOtp = async (email) => {
    try {
      setEmailSending(true);
      await sendVerificationCode(email);
      showToast({
        title: "Code Sent",
        message: "Check your email inbox",
        icon: successIcon,
      });
    } catch (err) {
      showToast({
        title: "Error",
        message: err.message || "Failed to send code",
        isError: true,
        icon: errorIcon,
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyOtp = async (email, code) => {
    try {
      setEmailVerifying(true);
      await verifyEmailCode(email, code);

      handleFormDataChange({ email_verified: true });
      showToast({
        title: "Verified",
        message: "Your email is now verified.",
        icon: successIcon,
      });

      setShowOtpModal(false);
    } catch (err) {
      showToast({
        title: "Verification Failed",
        message: err.message || "Invalid code",
        isError: true,
        icon: errorIcon,
      });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = new FormData();

      const userDetails = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username || formData.last_name,
        email: formData.email,
        phn_num: formData.phn_num,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
        role_name: formData.role,
        status: formData.status.toLowerCase(),
      };

      payload.append("user", JSON.stringify(userDetails));

      const additionalDetails = {
        salutation: formData.salutation,
        ice_contact: formData.ice_contact,
        ...(formData.role === "student" && {
          student_no: formData.student_no?.trim(),
        }),
      };

      payload.append("additional_details", JSON.stringify(additionalDetails));

      let gradeIds = [],
        slotIds = [],
        branchIds = [];

      if (formData.role === "student") {
        const branches = await getDropdownOptions("branches");
        const matchedBranch = branches.find(
          (b) => b.branch_name === formData.branch
        );
        if (matchedBranch) branchIds = [matchedBranch.id];

        const courses = await getDropdownOptions("courses");
        for (const c of formData.assignedCourses) {
          const course = courses.find((x) => x.name === c.course);
          if (!course) continue;

          const grades = await getDropdownOptions("grades", {
            courseId: course.id,
          });
          const g = grades.find((x) => x.grade_name === c.grade);
          if (g) gradeIds.push(g.id);
        }

        slotIds = formData.schedules.map((s) => s.id);
      }

      payload.append("grade_ids", JSON.stringify(gradeIds));
      payload.append("slot_ids", JSON.stringify(slotIds));
      payload.append("branch_ids", JSON.stringify(branchIds));

      if (formData.photoFile instanceof File) {
        payload.append("photo", formData.photoFile);
      }

      let result;
      let userId = initialData?.id || initialData?.user_id;

      if (isEditMode && userId) {
        result = await updateUser(userId, payload);
      } else {
        result = await createUser(payload);
        userId = result.user_id;
      }

      const fetchedUsers = await getAllUsers(1, 9, formData.role);

      await onAddStudent({ ...result, fetchedUsers });

      showToast({
        title: "Success",
        message: `User ${isEditMode ? "updated" : "created"} successfully!`,
        icon: successIcon,
      });

      setFormData({ ...getInitialFormData(), resetKey: Date.now() });
      setStep(1);
      onClose();
    } catch (err) {
      showToast({
        title: "Error",
        message: err.message || "Something went wrong",
        isError: true,
        icon: errorIcon,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {isSubmitting && (
        <div className="global-saving-overlay">
          <div className="saving-box">Saving… Please wait</div>
        </div>
      )}

      {!showSummary && (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <div className="add-modal-header">
              <h2 className="popup-header">
                {initialData
                  ? `Edit ${formData.role}`
                  : `${formData.role} Registration`}
              </h2>

              <img
                src={closeIcon}
                alt="Close"
                className={`add-close-icon ${isSubmitting ? "disabled-close" : ""}`}
                onClick={() => {
                  if (!isSubmitting) {
                    setFormData(getInitialFormData());
                    setStep(1);
                    setErrors({});
                    onClose();
                  }
                }}
              />
            </div>

            <div className="stepper-wrapper-unique">
              <Stepper steps={steps} currentStep={step} />
            </div>

            <div className="modal-content-wrapper">
              {step === 1 && (
                <Step1PersonalInfo
                  key={formData.resetKey}
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                  onImageChange={handleImageChange}
                />
              )}

              {step === 2 && (
                <Step2ContactDetails
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                  onOpenOtpModal={openOtpModal}
                />
              )}

              {step === 3 && formData.role === "student" && (
                <Step3EducationalRecords
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                />
              )}

              {step === 4 && formData.role === "student" && (
                <Step4AcademicDetails
                  formData={formData}
                  onChange={handleFormDataChange}
                  errors={errors}
                  setErrors={setErrors}
                  originalStudentNo={initialData?.student_no || formData.student_no}
                />
              )}
            </div>

            <div
              className={`modal-actions ${
                step === 1 ? "long-next-layout" : "standard-buttons"
              }`}
            >
              {step === 1 ? (
                <LongNextButton onClick={handleNext} disabled={isSubmitting} />
              ) : (
                <>
                  <PreviousButton
                    onClick={handleBack}
                    disabled={isSubmitting}
                  />
                  <NextButton onClick={handleNext} disabled={isSubmitting} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <Step5Summary
          isOpen={showSummary}
          studentData={formData}
          isSubmitting={isSubmitting}
          onClose={() => {
            if (!isSubmitting) {
              setShowSummary(false);
              onClose();
            }
          }}
          onSave={handleSubmit}
          onEdit={() => {
            if (!isSubmitting) {
              setShowSummary(false);
              setStep(1);
            }
          }}
        />
      )}

      {showOtpModal && (
        <OtpVerificationModal
          email={formData.email}
          onClose={() => setShowOtpModal(false)}
          onSendOtp={handleSendOtp}
          onVerifyOtp={handleVerifyOtp}
          loadingSend={emailSending}
          loadingVerify={emailVerifying}
        />
      )}
    </>
  );
};

export default AddStudentForm;