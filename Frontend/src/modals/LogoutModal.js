import React from "react";
import "../Styles/Auth/logoutModal.css";
import logoutLogo from '../assets/icons/logoutLogo.png'

const LogoutModal = ({ onClose, onConfirm }) => {
  return (
    <div className="logout-modal-overlay">
      <div className="logout-modal-box">

        <div className="logout-icon-top">
            <img src={logoutLogo} alt="log out" />
        </div>

        <p className="logout-text">Log out now. Confirm it?</p>

        <div className="logout-buttons">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>

          <button className="logout-btn" onClick={onConfirm}>
            Log out
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoutModal;
