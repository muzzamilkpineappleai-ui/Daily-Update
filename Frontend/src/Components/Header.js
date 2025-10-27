import React from 'react';
import { useLocation } from 'react-router-dom';
import NotificationIcon from '../assets/icons/Notification.png';
import '../Styles/Header.css';

const routeTitles = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/students': 'User',
  '/course': 'Course',
  '/payments': 'Payment',
  '/exam': 'Exam',
  '/schedule': 'Schedule',
  '/report': 'Report',
  '/settings': 'Setting',
  '/logout': 'Logout',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const path = location.pathname;
  const pageTitle = routeTitles[path] || 'Dashboard';
  const isMobile = window.innerWidth <= 768;

  return (
    <div className="content-header">
      <div className="header-row">
        {isMobile && (
          <button className="mobile-menu-btn" onClick={onMenuClick}>
            ☰
          </button>
        )}
        <div className="header-title">{pageTitle}</div>
        <div className="notification-container">
          <img src={NotificationIcon} alt="Notification" className="notification-img" />
        </div>
      </div>
      <div></div>
    </div>
  );
};

export default Header;