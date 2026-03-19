import { createContext, useContext, useEffect, useState, useRef } from "react";
import type { ReactNode } from "react";
import { useAuth, API_URL } from "./AuthContext";

export interface NotificationItem {
  id: string;
  message: string;
  created_at: number;
  is_read: number;
}

interface NotificationContextProps {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps>(
  {} as NotificationContextProps,
);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const previouslyFetchedIds = useRef<Set<string>>(new Set());

  const requestPushPermission = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user || !token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const newNotifs: NotificationItem[] = data.notifications || [];

        // Check for new notifications to trigger Push
        const currentIds = new Set(newNotifs.map((n) => n.id));
        const oldIds = previouslyFetchedIds.current;

        if (oldIds.size > 0) {
          // Don't alert on first fetch
          const freshNotifs = newNotifs.filter(
            (n) => !oldIds.has(n.id) && n.is_read === 0,
          );
          freshNotifs.forEach((fn) => {
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Nova Notificação", {
                body: fn.message,
                icon: "/vite.svg", // Default or specific icon
              });
            }
          });
        }

        previouslyFetchedIds.current = currentIds;
        setNotifications(newNotifs);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  useEffect(() => {
    if (user && token) {
      requestPushPermission();
      fetchNotifications(); // Initial fetch
      const intervalId = setInterval(fetchNotifications, 60000); // Poll every 1 minute
      return () => clearInterval(intervalId);
    } else {
      setNotifications([]);
      previouslyFetchedIds.current.clear();
    }
  }, [user, token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)),
        );
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => n.is_read === 0).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        refresh: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
