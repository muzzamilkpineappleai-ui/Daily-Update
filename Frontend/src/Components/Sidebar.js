import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../Styles/Sidebar.css";

// Icons & Images
import Logo from "../assets/images/Aradana-logo.png";
import DashboardIcon from "../assets/icons/Dashboard.png";
import StudentIcon from "../assets/icons/Students.png";
import CourseIcon from "../assets/icons/Course.png";
import PaymentIcon from "../assets/icons/Payment.png";
import ExamIcon from "../assets/icons/Exam.png";
import ReportIcon from "../assets/icons/Report.png";
import SettingsIcon from "../assets/icons/Settings.png";
import LogoutIcon from "../assets/icons/Logout.png";
import ScheduleIcon from "../assets/icons/Schedule.png";
import BranchIcon from "../assets/icons/NewBranch.png";
import AttendanceIcon from "../assets/icons/attend.png";

import LogoutModal from "../modals/LogoutModal";

const menuItems = [
  { name: "Dashboard", icon: DashboardIcon, path: "/dashboard" },
  { name: "Attendance", icon: AttendanceIcon, path: "/attendance" },
  { name: "Branch", icon: BranchIcon, path: "/branch" },
  { name: "Users", icon: StudentIcon, path: "/students" },
  { name: "Course", icon: CourseIcon, path: "/course" },
  { name: "Payment", icon: PaymentIcon, path: "/payments" },
  { name: "Schedule", icon: ScheduleIcon, path: "/schedule" },
  { name: "Exam", icon: ExamIcon, path: "/exam" },
  { name: "Report", icon: ReportIcon, path: "/report" },
  { name: "Settings", icon: SettingsIcon, path: "/settings" }
];

const Sidebar = ({ onClose }) => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src={Logo} alt="Logo" className="logo-img" />
        </div>

        <div className="menu-list">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
              onClick={() => onClose && onClose()}
            >
              <img src={item.icon} alt={item.name} className="Sidebar-icon" />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {/* Logout */}
          <div
            className="menu-item logout-item"
            onClick={() => setShowLogoutModal(true)}
          >
            <img src={LogoutIcon} alt="Logout" className="Sidebar-icon" />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </>
  );
};

export default Sidebar;
