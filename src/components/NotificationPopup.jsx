import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Bell, CheckCheck, Inbox } from 'lucide-react';
import { 
  notificationApi, 
  normalizeNotificationList, 
  getCurrentEmployeeId
} from '../services/api.js';
import './NotificationPopup.css';

export default function NotificationPopup({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null); // Fixed missing 'const'

  // Cập nhật số lượng chưa đọc ra ngoài Badge
  const updateUnreadCount = useCallback((list) => {
    if (onUnreadChange) {
      const count = Array.isArray(list) ? list.filter((item) => !item.isRead && !item.is_read).length : 0;
      onUnreadChange(count);
    }
  }, [onUnreadChange]);

  // 1. Tải danh sách thông báo
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const employeeId = getCurrentEmployeeId();
      const response = employeeId
        ? await notificationApi.getEmployeeNotifications(employeeId)
        : await notificationApi.getAll();
      
      const list = normalizeNotificationList(response, employeeId);
      
      setNotifications(list);
      updateUnreadCount(list);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông báo:', error);
      setNotifications([]);
      updateUnreadCount([]);
    } finally {
      setLoading(false);
    }
  }, [updateUnreadCount]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // 2. Click outside để đóng popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        if (!event.target.closest('.header-btn-notification')) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 3. Đánh dấu 1 thông báo đã đọc
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();

    const targetId = String(id);
    const employeeId = getCurrentEmployeeId();

    // A. Lưu ID vào cache FE để bảo vệ khỏi dữ liệu thiếu từ API GET
    // B. Cập nhật State UI ngay lập tức
    const updatedList = notifications.map((item) =>
      String(item.id) === targetId ? { ...item, isRead: true, is_read: true } : item
    );
    setNotifications(updatedList);
    updateUnreadCount(updatedList);

    // C. Bắn API cập nhật DB
    try {
      await notificationApi.markAsRead(targetId);
      await fetchNotifications();
    } catch (error) {
      console.error('Lỗi khi gọi API markAsRead:', error);
    }
  };

  // 4. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    const unreadItems = notifications.filter((item) => !item.isRead && !item.is_read);
    if (unreadItems.length === 0) return;

    const unreadIds = unreadItems.map((item) => String(item.id));
    const employeeId = getCurrentEmployeeId();

    // A. Lưu tất cả ID vào Cache FE
    saveLocalReadIds(unreadIds, employeeId);

    // B. Cập nhật State UI
    const updatedList = notifications.map((item) => ({ 
      ...item, 
      isRead: true, 
      is_read: true 
    }));
    setNotifications(updatedList);
    updateUnreadCount(updatedList);

    // C. Bắn API cập nhật DB
    try {
      await notificationApi.markAllAsRead(employeeId);
    } catch (error) {
      console.error('Lỗi khi gọi API markAllAsRead:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-popup-dropdown" ref={popupRef}>
      {/* Header Popup */}
      <div className="notification-popup-header">
        <div className="header-left">
          <Bell size={18} />
          <span>Thông báo</span>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="btn-text-action"
            onClick={handleMarkAllAsRead}
            title="Đánh dấu tất cả đã đọc"
          >
            <CheckCheck size={16} /> Đọc tất cả
          </button>
          <button type="button" className="btn-icon-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Body / List thông báo */}
      <div className="notification-popup-body">
        {loading ? (
          <div className="notification-state-msg">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-state-msg">
            <Inbox size={32} />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          notifications.map((item, index) => {
            const isRead = Boolean(item.isRead || item.is_read);
            return (
              <div
                key={item.id || index}
                className={`notification-item ${isRead ? 'read' : 'unread'}`}
              >
                <div className="item-main">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-desc">{item.content}</p>
                  <span className="item-time">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                  </span>
                </div>
                {!isRead && (
                  <button
                    type="button"
                    className="btn-mark-one"
                    onClick={(e) => handleMarkAsRead(item.id, e)}
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}