import React, { useState, useEffect } from "react";
import "../../Styles/Settings/settings.css";

import searchIcon from "../../assets/icons/searchButton.png";
import viewHide from "../../assets/icons/viewHide.png";
import viewIcon from "../../assets/icons/view.png";

import Toast from "../../modals/ToastModel";
import SuccessIcon from "../../assets/icons/Success.png";
import ErrorIcon from "../../assets/icons/error.png";

function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");

  // Password fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Validation error states
  const [errors, setErrors] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  // Toast states
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState("success");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const demoData = [
      {
        id: 1,
        name: "Sushan Zar Ameth Sri",
        message: "New student registered",
        time: "5 min ago",
        avatar: "https://i.pravatar.cc/100?img=1",
      },
      {
        id: 2,
        name: "Sushan Zar Ameth Sri",
        message: "New student registered",
        time: "12 hours ago",
        avatar: "https://i.pravatar.cc/100?img=2",
      },
      {
        id: 3,
        name: "Sushan Zar Ameth Sri",
        message: "New student registered",
        time: "5 min ago",
        avatar: "https://i.pravatar.cc/100?img=2",
      },
    ];

    setNotifications(demoData);
  };

  const filtered = notifications.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  // SAVE PASSWORD LOGIC
  const handleSave = () => {
    const newErrors = {
      current: currentPass.length < 1,
      newPass: newPass.length < 8,
      confirm: confirmPass !== newPass || confirmPass.length < 8,
    };

    const hasError =
      newErrors.current || newErrors.newPass || newErrors.confirm;

    setErrors(newErrors);

    if (hasError) {
      setToastType("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // success
    setToastType("success");
    setShowToast(true);

    setCurrentPass("");
    setNewPass("");
    setConfirmPass("");

    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="settings-wrapper">

      {/* Search Bar */}
      <div className="settings-top-search">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={searchIcon} alt="search" />
      </div>

      <div className="settings-container">

        {/* LEFT MENU */}
        <div className="settings-left">
          <p
            className={activeTab === "notifications" ? "active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </p>

          <p
            className={activeTab === "password" ? "active" : ""}
            onClick={() => setActiveTab("password")}
          >
            Change password
          </p>
        </div>

        {/* RIGHT CONTENT */}
        <div className="settings-right">

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <>
              <h2>Notifications</h2>
              <p className="settings-desc">
                Manage how you receive important updates, alerts, and announcements.
              </p>

              <div className="settings-card">
                {filtered.map((item, index) => (
                  <div key={item.id}>
                    <div className="settings-item">
                      <img src={item.avatar} className="settings-avatar" alt="" />
                      <div className="settings-info">
                        <h4>{item.name}</h4>
                        <p>{item.message}</p>
                        <span>{item.time}</span>
                      </div>
                    </div>

                    {index < filtered.length - 1 && (
                      <div className="settings-divider"></div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PASSWORD TAB */}
          {activeTab === "password" && (
            <>
              <h2>Change password</h2>
              <p className="settings-desc">
                You can update your login credentials at any time.
              </p>

              <div className="password-card">

                <PasswordField
                  label="Current password"
                  value={currentPass}
                  onChange={setCurrentPass}
                  error={errors.current}
                />

                <PasswordField
                  label="New password"
                  value={newPass}
                  onChange={setNewPass}
                  note="Enter a password with at least 8 characters and numbers."
                  error={errors.newPass}
                />

                <PasswordField
                  label="Confirm new password"
                  value={confirmPass}
                  onChange={setConfirmPass}
                  note="Enter a password with at least 8 characters and numbers."
                  error={errors.confirm}
                />

                <button className="save-btn" onClick={handleSave}>
                  Save change
                </button>

              </div>
            </>
          )}
        </div>
      </div>

      {/* TOAST */}
      <Toast
        showToast={showToast}
        onClose={() => setShowToast(false)}
        icon={toastType === "error" ? ErrorIcon : SuccessIcon}
        title={toastType === "error" ? "Update Unsuccessful" : "Success"}
        message={
          toastType === "error"
            ? "Invalid password"
            : "Password changed successfully.."
        }
        isError={toastType === "error"}
        isDelete={false}
      />
    </div>
  );
}


// PASSWORD FIELD COMPONENT
function PasswordField({ label, note, value, onChange, error }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      <label>{label}</label>

      <div className={`password-input-box ${error ? "error-border" : ""}`}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <img
          src={show ? viewIcon : viewHide}
          alt="toggle"
          onClick={() => setShow(!show)}
        />
      </div>

      {note && (
        <p className={`password-note ${error ? "error-text" : ""}`}>
          {note}
        </p>
      )}
    </div>
  );
}

export default Settings;
