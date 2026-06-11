import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import "../../Styles/Students-css/SummaryPopup.css";
import CloseIcon from "../../assets/icons/Close.png";
import UserIcon from "../../assets/icons/User.png";
import AddressIcon from "../../assets/icons/Address.png";
import CalendarIcon from "../../assets/icons/Calendar2.png";
import GenderIcon from "../../assets/icons/Gender.png";
import EmailIcon from "../../assets/icons/Email.png";
import WhatsAppIcon from "../../assets/icons/WhatsApp.png";
import PhoneIcon from "../../assets/icons/Phone.png";
import BranchIcon from "../../assets/icons/Branch.png";
import StudentIcon from "../../assets/icons/Student.png";
import IdCardIcon from "../../assets/icons/IdCard.png";
import IDCardModal from "../students/IDcardModal";

const formatScheduleTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return "N/A";

  const clean = timeStr.trim();

  // Handle range like "09:24:00 - 10:26:00" or "9:24:0 10:26:00"
  const parts = clean.split(/[-–—]/).map((part) => part.trim()).filter(Boolean);

  const formatSingleTime = (t) => {
    const match = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (!match) return t; // fallback if invalid

    let hours = parseInt(match[1], 10);
    const minutes = match[2].padStart(2, "0");

    const period = hours >= 12 ? "pm" : "am";

    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;

    // Remove leading zero and use dot: 9.30am instead of 09:30 am
    const displayHours = hours < 10 ? hours : hours;

    return `${displayHours}.${minutes}${period}`;
  };

  if (parts.length === 1) {
    return formatSingleTime(parts[0]);
  }

  if (parts.length === 2) {
    const [start, end] = parts;
    const formattedStart = formatSingleTime(start);
    const formattedEnd = formatSingleTime(end);
    return `${formattedStart} – ${formattedEnd}`;
  }

  return clean; // fallback
};

// Optional: Safe string helper
const safeString = (val) => (val && String(val).trim() ? String(val).trim() : "N/A");

const StudentProfilePopup = ({
  isOpen,
  onClose,
  studentData,
  onEdit,
  onSave,
  onUpdate,
  onPrevious,
  mode = "profile",
}) => {
  const [updatedData, setUpdatedData] = useState(studentData);
  const [idCardOpen, setIdCardOpen] = useState(false);

  useEffect(() => {
    setUpdatedData(studentData);
  }, [studentData, isOpen]);

  if (!isOpen || !studentData) return null;

  const toggleIdCard = () => setIdCardOpen(!idCardOpen);

  const getFullImageUrl = (url) => {
    if (!url) return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
    if (url.startsWith("http") || url.startsWith("data:image/")) return url;
    return `http://localhost:5000/uploads/${url.replace(/^\/?uploads\//i, "")}`;
  };

  const getDynamicTitle = (role) => {
    if (!role) return "User Details";
    const cleanRole = role.toString().trim();
    if (!cleanRole) return "User Details";

    return cleanRole
      .toLowerCase()
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ") + " Details";
  };

  const profileImageUrl = getFullImageUrl(studentData.photo_url);

  const assignedCourses = Array.isArray(studentData.assignedCourses)
    ? studentData.assignedCourses
    : [];

  const schedules = Array.isArray(studentData.schedules)
    ? studentData.schedules
    : [];

  const branch = studentData.branch || "N/A";

  const idCardPayload = {
    id: studentData.id,
    role_name: studentData.role_name,
    student_no: studentData.student_no,
    salutation: studentData.salutation,
    first_name: studentData.first_name,
    last_name: studentData.last_name,
    course: studentData.course,
    branch: studentData.branch,
    photo_url: getFullImageUrl(studentData.photo_url),
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="summary-modal"
      overlayClassName="modal-overlay"
      ariaHideApp={false}
    >
      <button className="close-btn" onClick={onClose} aria-label="Close Popup">
        <img src={CloseIcon} alt="Close" />
      </button>

      <div className="summary-header-bg">
        <div className="summary-header"></div>
        <img
          src={profileImageUrl}
          alt="Profile"
          className="profile-pic-round"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
          }}
        />
        <h2>{getDynamicTitle(studentData.role || studentData.role_name)}</h2>
      </div>

      <div className="summary-scroll-container">
        {/* PERSONAL INFO */}
        <section className="popup-section">
          <h3>Personal Information</h3>
          <div className="info-2col">
            <div className="info-block full-name">
              <div className="info-label">
                <img src={UserIcon} alt="Full Name" className="icon" />
                <span>Full Name</span>
              </div>
              <div className="info-value">
                {`${studentData.salutation || ""} ${studentData.first_name || ""} ${
                  studentData.last_name || ""
                }`.trim() || "N/A"}
              </div>
            </div>

            <div className="info-block address">
              <div className="info-label">
                <img src={AddressIcon} alt="Address" className="icon" />
                <span>Address</span>
              </div>
              <div className="info-value">{safeString(studentData.address)}</div>
            </div>

            <div className="info-block dob">
              <div className="info-label">
                <img src={CalendarIcon} alt="DOB" className="icon" />
                <span>Date of Birth</span>
              </div>
              <div className="info-value">{safeString(studentData.date_of_birth)}</div>
            </div>

            <div className="info-block gender">
              <div className="info-label">
                <img src={GenderIcon} alt="Gender" className="icon" />
                <span>Gender</span>
              </div>
              <div className="info-value">{safeString(studentData.gender)}</div>
            </div>
          </div>
        </section>

        {/* CONTACT DETAILS */}
        <section className="summary-section">
          <h3>Contact Details</h3>
          <div className="info-2col">
            <div className="info-block">
              <div className="info-label">
                <img src={WhatsAppIcon} alt="Phone Number" className="icon" />
                <span>Phone Number</span>
              </div>
              <div className="info-value">{safeString(studentData.phn_num)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={PhoneIcon} alt="ICE Contact" className="icon" />
                <span>ICE Contact</span>
              </div>
              <div className="info-value">{safeString(studentData.ice_contact)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={EmailIcon} alt="Email" className="icon" />
                <span>Email Address</span>
              </div>
              <div className="info-value">{safeString(studentData.email)}</div>
            </div>
          </div>
        </section>

        {/* EDUCATIONAL RECORDS */}
        <section className="summary-section scrollable-section">
          <h3>Educational Records</h3>
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {assignedCourses.length > 0 ? (
                  assignedCourses.map((c, i) => (
                    <tr key={i}>
                      <td>{safeString(c.course)}</td>
                      <td>{safeString(c.grade)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No courses assigned.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* ACADEMIC DETAILS */}
        <section className="summary-section">
          <h3>Academic Details</h3>
          <div className="info-2col">
            <div className="info-block">
              <div className="info-label">
                <img src={BranchIcon} alt="Branch" className="icon" />
                <span>Branch</span>
              </div>
              <div className="info-value">{safeString(branch)}</div>
            </div>

            <div className="info-block">
              <div className="info-label">
                <img src={StudentIcon} alt="Student ID" className="icon" />
                <span>Student ID</span>
              </div>
              <div className="info-value">{safeString(studentData.student_no)}</div>
            </div>
          </div>
        </section>

        {/* SCHEDULE – NOW WITH PROPER AM/PM FORMAT */}
        <section className="summary-section scrollable-section">
          <h3>Schedule</h3>
          <div className="scroll-table">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length > 0 ? (
                  schedules.map((s, i) => (
                    <tr key={i}>
                      <td>{safeString(s.day)}</td>
                      <td>{formatScheduleTime(s.time)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2">No schedules available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* BUTTONS */}
        <div className="summary-buttons">
          {mode === "summary" && (
            <>
              <button className="prev-btn" onClick={onPrevious}>
                Previous
              </button>
              <button className="save-btn" onClick={onSave}>
                Save
              </button>
            </>
          )}

          {mode === "profile" && (
            <button className="edit-btn" onClick={() => onEdit(studentData)}>
              Edit
            </button>
          )}

          {mode === "edit-summary" && (
            <button className="save-btn" onClick={onUpdate}>
              Update
            </button>
          )}
        </div>
      </div>

      <button className="id-card-btn" onClick={toggleIdCard}>
        <img src={IdCardIcon} alt="ID Card" className="id-card-icon" />
        ID CARD
      </button>

      <IDCardModal
        isOpen={idCardOpen}
        onClose={() => setIdCardOpen(false)}
        userData={idCardPayload}
      />
    </Modal>
  );
};

export default StudentProfilePopup;