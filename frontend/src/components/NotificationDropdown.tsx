import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notifications";
import type { NotificationItem } from "../api/notifications";
import { useCalorie } from "./CalorieTracker";
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
  const { cart, isLoading: cartLoading } = useCalorie();

  // Only flag calorie-not-set once cart has finished loading
  const calorieNotSet = !cartLoading && cart !== null && cart.calorie_target === null;


  const lastCountRef = React.useRef<number | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotifications();
      let notifs = data.notifications;
      let unread = data.unread_count;

      // Inject client-side notification if calorie target is not set
      if (calorieNotSet) {
        const injectedNotif: NotificationItem = {
          id: -999,
          type: "system",
          title: "Daily Calorie Goal Not Set",
          message: "Please configure your calorie goal to track daily meals. Click here to set it up.",
          order_id: null,
          is_read: false,
          created_at: new Date().toISOString()
        };
        notifs = [injectedNotif, ...notifs.filter(n => n.id !== -999)];
        unread += 1;
      }

      setNotifications(notifs);
      setUnreadCount(unread);

      if (lastCountRef.current !== unread) {
        onUnreadChange(unread);
        lastCountRef.current = unread;
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange, calorieNotSet]);

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

  // Re-inject/remove the calorie notification when target status changes
  useEffect(() => {
    setNotifications(prev => {
      const withoutInjected = prev.filter(n => n.id !== -999);
      if (calorieNotSet) {
        const injectedNotif: NotificationItem = {
          id: -999,
          type: "system",
          title: "Daily Calorie Goal Not Set",
          message: "Please configure your calorie goal to track daily meals. Click here to set it up.",
          order_id: null,
          is_read: false,
          created_at: new Date().toISOString()
        };
        return [injectedNotif, ...withoutInjected];
      }
      return withoutInjected;
    });
  }, [calorieNotSet]);

  const handleItemClick = async (notif: NotificationItem) => {
    if (notif.id === -999) {
      // Navigate to profile to set the calorie target
      setNotifications(prev => prev.filter(n => n.id !== -999));
      setUnreadCount(c => Math.max(0, c - 1));
      onUnreadChange(Math.max(0, unreadCount - 1));
      navigate("/profile");
      onToggle();
      return;
    }

    if (!notif.is_read) {
      await markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(c => Math.max(0, c - 1));
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
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true })).filter(n => n.id !== -999 || calorieNotSet)
    );
    setUnreadCount(calorieNotSet ? 1 : 0);
    onUnreadChange(calorieNotSet ? 1 : 0);
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

              // Special premium card for the calorie-not-set notification
              if (notif.id === -999) {
                return (
                  <button
                    key={notif.id}
                    className="notif-item notif-item-calorie"
                    onClick={() => handleItemClick(notif)}
                  >
                    <div className="notif-calorie-icon-wrap">
                      <span className="material-symbols-rounded">local_fire_department</span>
                    </div>
                    <div className="notif-text">
                      <div className="notif-calorie-label">Action Required</div>
                      <div className="notif-title">kcal Goal Not Set</div>
                      <div className="notif-msg">Set a daily calorie target to start tracking your meals and stay on top of your health.</div>
                      <div className="notif-calorie-cta">Set Goal →</div>
                    </div>
                    <div className="notif-unread-dot" />
                  </button>
                );
              }

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
