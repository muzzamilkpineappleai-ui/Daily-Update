import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationIcon from '../assets/icons/Notification.png';
import NotificationModal from '../modals/NotificationModal';
import '../Styles/Header.css';

const routeTitles = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/attendance': 'Attendance',
  '/students': 'User',
  '/course': 'Course',
  '/branch': 'Branch',
  '/payments': 'Payment',
  '/exam': 'Exam',
  '/exam/student-selection': 'Student Selection',
  '/exam/detail': 'Exam Details',
  '/schedule': 'Schedule',
  '/report': 'Report',
  '/report/paymentReport': 'Payment Report',
  '/report/examReport': 'Exam Report',
  '/report/resultReport': 'Result Report',
  '/settings': 'Setting',
  '/logout': 'Logout',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const pageTitle = routeTitles[location.pathname] || 'Dashboard';
  const isMobile = window.innerWidth <= 768;

  // 🔥 State for opening/closing popup
  const [openPopup, setOpenPopup] = useState(false);

  // 🔥 Close popup when clicking outside
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpenPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="hdr-content-header">
      <div className="hdr-row">
        
        {isMobile && (
          <button className="hdr-mobile-menu-btn" onClick={onMenuClick} aria-label="Menu">
            ☰
          </button>
        )}

        <div className="hdr-title-container">
          <h1 className="hdr-title">{pageTitle}</h1>
        </div>

        <div className="hdr-notification-container" ref={popupRef}>
          <img
            src={NotificationIcon}
            alt="Notifications"
            className="hdr-notification-img"
            onClick={() => setOpenPopup(!openPopup)}
            style={{ cursor: "pointer" }}
          />

          {/* MINI POPUP */}
          {openPopup && (
            <NotificationModal mini={true} />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
