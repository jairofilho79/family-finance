import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import type { NotificationItem } from "../context/NotificationContext";
import "./NotificationsBell.css";

const NotificationsBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (n: NotificationItem) => {
    if (n.is_read === 0) {
      markAsRead(n.id);
    }
  };

  const handleMarkAll = () => {
    notifications.forEach((n) => {
      if (n.is_read === 0) markAsRead(n.id);
    });
  };

  return (
    <div className="notifications-wrapper" ref={dropdownRef}>
      <button
        className="bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h3>Notificações</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAll}>
                Marcar lidas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              Nenhuma notificação por enquanto.
            </div>
          ) : (
            <ul className="notifications-list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notification-item ${n.is_read === 0 ? "unread" : ""}`}
                  onClick={() => handleItemClick(n)}
                >
                  <span className="notification-message">{n.message}</span>
                  <span className="notification-time">
                    {formatTimestamp(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
