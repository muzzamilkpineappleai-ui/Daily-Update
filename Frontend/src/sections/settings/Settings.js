import React, { useState, useEffect, useRef } from "react";
import "../../Styles/Settings/settings.css";
import searchIcon from "../../assets/icons/searchButton.png";
import viewHide from "../../assets/icons/viewHide.png";
import viewIcon from "../../assets/icons/view.png";
import Toast from "../../modals/ToastModel";
import SuccessIcon from "../../assets/icons/Success.png";
import ErrorIcon from "../../assets/icons/error.png";

import { handlePasswordChange } from "./usePasswordChange";

const FALLBACK_AVATAR =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

/* -------------------- TIME AGO FUNCTION -------------------- */
function timeAgo(dateString) {
  if (!dateString) return "Just now";

  let d = dateString;
  if (typeof d === "string" && d.includes(" ") && !d.includes("T")) {
    d = d.replace(" ", "T");
  }

  const past = new Date(d.endsWith("Z") ? d : d + "Z");
  if (isNaN(past)) return "Just now";

  const seconds = Math.floor((Date.now() - past) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return `${Math.floor(seconds / 31536000)}y ago`;
}

/* -------------------- AVATAR HANDLER -------------------- */
function getAvatar(photo) {
  if (!photo) return FALLBACK_AVATAR;
  if (photo.startsWith("/uploads")) {
    return `http://localhost:5000${photo}`;
  }
  return photo;
}

function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [errors, setErrors] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  const [toast, setToast] = useState({
    show: false,
    type: "success",
    message: "",
  });

  /* -------------------- AUTO HIDE TOAST -------------------- */
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000);
      return () => clearTimeout(t);
    }
  }, [toast.show]);

  /* -------------------- WEBSOCKET CONNECTION -------------------- */
  useEffect(() => {
    const connectWebSocket = () => {
      if (
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      const ws = new WebSocket("ws://localhost:5000");

      ws.onopen = () => {
        console.log("Settings WebSocket connected");
        wsRef.current = ws;

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "INIT_USERS" && Array.isArray(data.users)) {
            const mapped = data.users.map((u) => ({
              id: u.id || `${u.full_name}|${u.created_at}`,
              name: u.full_name || "Unknown",
              message: u.message || "Notification",
              createdAt: u.created_at, // IMPORTANT
              avatar: getAvatar(u.photo),
            }));

            setNotifications(mapped);
          }

          if (data.type === "NEW_USER" && data.user) {
            const u = data.user;

            const newNotif = {
              id: u.id || `${u.full_name}|${u.created_at}`,
              name: u.full_name || "Unknown",
              message: u.message || "Notification",
              createdAt: u.created_at,
              avatar: getAvatar(u.photo),
            };

            setNotifications((prev) => [newNotif, ...prev]);
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Settings WS Error:", err);
      };

      ws.onclose = () => {
        console.log("Settings WebSocket disconnected");
        wsRef.current = null;

        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  /* -------------------- FORCE TIME UPDATE EVERY MINUTE -------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) => [...prev]);
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /* -------------------- FILTER -------------------- */
  const filtered = notifications.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  /* -------------------- PASSWORD SAVE -------------------- */
  const handleSavePassword = () => {
    handlePasswordChange({
      currentPass,
      newPass,
      confirmPass,
      setErrors,
      setToast,
      clearFields: () => {
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
      },
    });
  };

  return (
    <div className="set-wrapper">
      <div className="set-top-search">
        <input
          type="text"
          placeholder="Search notifications..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <img src={searchIcon} alt="search" />
      </div>

      <div className="set-container">
        <div className="set-left">
          <p
            className={activeTab === "notifications" ? "set-active" : ""}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </p>
          <p
            className={activeTab === "password" ? "set-active" : ""}
            onClick={() => setActiveTab("password")}
          >
            Change password
          </p>
        </div>

        <div className="set-right">
          {activeTab === "notifications" && (
            <>
              <h2>Notifications</h2>
              <p className="set-desc">
                Manage how you receive important updates.
              </p>

              <div className="set-card">
                {filtered.length === 0 ? (
                  <p style={{ padding: 20, textAlign: "center", color: "#888" }}>
                    No notifications found
                  </p>
                ) : (
                  filtered.map((item) => (
                    <div key={item.id}>
                      <div className="set-item">
                        <img
                          src={item.avatar}
                          className="set-avatar"
                          alt="avatar"
                          onError={(e) => (e.target.src = FALLBACK_AVATAR)}
                        />
                        <div className="set-info">
                          <h4>{item.name}</h4>
                          <p>{item.message}</p>
                          <span>{timeAgo(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="set-divider"></div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "password" && (
            <>
              <h2>Change password</h2>
              <p className="set-desc">
                You can update your login credentials at any time.
              </p>

              <div className="set-password-card">
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
                  note="At least 8 characters."
                  error={errors.newPass}
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirmPass}
                  onChange={setConfirmPass}
                  note="Passwords must match."
                  error={errors.confirm}
                />
                <button className="set-save-btn" onClick={handleSavePassword}>
                  Save change
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Toast
        showToast={toast.show}
        onClose={() => setToast((p) => ({ ...p, show: false }))}
        icon={toast.type === "error" ? ErrorIcon : SuccessIcon}
        title={toast.type === "error" ? "Update Unsuccessful" : "Success"}
        message={toast.message}
        isError={toast.type === "error"}
      />
    </div>
  );
}

/* -------------------- PASSWORD FIELD -------------------- */
function PasswordField({ label, note, value, onChange, error = false }) {
  const [show, setShow] = useState(false);

  return (
    <div className="set-password-field">
      <label>{label}</label>
      <div className={`set-password-input-box ${error ? "set-error-border" : ""}`}>
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
      {note && <p className={`set-password-note ${error ? "set-error-text" : ""}`}>{note}</p>}
    </div>
  );
}

export default Settings;
