import React, { useEffect, useState } from "react";
import "../Styles/NotificationModal.css";

const FALLBACK_AVATAR =
  "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

// ⭐ Convert date → "5 min ago"
function timeAgo(dateString) {
  if (!dateString) return "";

  let d = dateString;
  if (d.includes(" ") && !d.includes("T")) d = d.replace(" ", "T");

  let past = new Date(d);
  if (isNaN(past)) past = new Date(d + "Z");

  const now = new Date();
  const seconds = (now - past) / 1000;

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;

  return `${Math.floor(seconds / 31536000)} years ago`;
}

// Build photo URL
function getAvatar(photo) {
  if (!photo) return FALLBACK_AVATAR;
  if (photo.startsWith("/uploads")) return `http://localhost:5000${photo}`;
  return photo;
}

const NotificationModal = ({ mini = false }) => {
  const [notifications, setNotifications] = useState([]);

  // ⭐ Force re-render every 60 seconds → updates timeAgo()
  const [, setRefreshTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTime(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "INIT_USERS") {
        setNotifications(data.users);
      }

      if (data.type === "NEW_USER") {
        setNotifications((prev) => [data.user, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className={mini ? "notif-mini-container" : "notif-full-container"}>
      {notifications.map((item, index) => (
        <div key={index} className="notif-item">
          <img
            src={getAvatar(item.photo)}
            onError={(e) => (e.target.src = FALLBACK_AVATAR)}
            className="notif-avatar"
            alt="avatar"
          />

          <div className="notif-text">
            <h4>{item.full_name}</h4>
            <p>{item.message}</p>

            {/*  timeAgo now updates automatically */}
            <span className="notif-time">{timeAgo(item.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationModal;
