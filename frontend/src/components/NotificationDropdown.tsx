import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notifications";
import type { NotificationItem } from "../api/notifications";
import "../css/notifications.css";

const ICON_MAP: Record<string, { icon: string; cls: string }> = {
  order_placed:    { icon: "check_circle",    cls: "notif-icon-placed" },
  order_preparing: { icon: "skillet",          cls: "notif-icon-preparing" },
  order_ready:     { icon: "package_2",        cls: "notif-icon-ready" },
  order_on_way:    { icon: "local_shipping",   cls: "notif-icon-on_way" },
  order_delivered: { icon: "verified",         cls: "notif-icon-delivered" },
  order_cancelled: { icon: "cancel",           cls: "notif-icon-cancelled" },
  reminder:        { icon: "restaurant",       cls: "notif-icon-reminder" },
  promo:           { icon: "local_offer",      cls: "notif-icon-promo" },
  system:          { icon: "info",             cls: "notif-icon-system" },
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  onUnreadChange: (count: number) => void;
}

const NotificationDropdown: React.FC<Props> = ({ isOpen, onToggle, onUnreadChange }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const lastCountRef = React.useRef<number | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unread_count);
      
      if (lastCountRef.current !== data.unread_count) {
        onUnreadChange(data.unread_count);
        lastCountRef.current = data.unread_count;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  // Fetch on mount and poll every 30s
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Refresh when opened
  useEffect(() => {
    if (isOpen) fetchNotifs();
  }, [isOpen, fetchNotifs]);

  const handleItemClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      onUnreadChange(Math.max(0, unreadCount - 1));
    }
    if (notif.order_id) {
      navigate(`/order-tracking/${notif.order_id}`);
      onToggle();
    } else if (notif.type === "reminder" || notif.type === "promo") {
      navigate("/menu");
      onToggle();
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    onUnreadChange(0);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="notif-backdrop" onClick={onToggle} />
      <div className="notif-dropdown">
        <div className="notif-header">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <button className="notif-mark-all" onClick={handleMarkAll}>
              Mark all read
            </button>
          )}
        </div>

        <div className="notif-list">
          {loading && notifications.length === 0 ? (
            <div className="notif-loading">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <span className="material-symbols-rounded">notifications_off</span>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => {
              const iconData = ICON_MAP[notif.type] || ICON_MAP.system;
              return (
                <button
                  key={notif.id}
                  className={`notif-item ${!notif.is_read ? "unread" : ""}`}
                  onClick={() => handleItemClick(notif)}
                >
                  <div className={`notif-icon ${iconData.cls}`}>
                    <span className="material-symbols-rounded">{iconData.icon}</span>
                  </div>
                  <div className="notif-text">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-msg">{notif.message}</div>
                    <div className="notif-time">{timeAgo(notif.created_at)}</div>
                  </div>
                  {!notif.is_read && <div className="notif-unread-dot" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationDropdown;
