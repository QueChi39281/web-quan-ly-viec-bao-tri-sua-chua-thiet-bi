import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Bell, CheckCheck, Inbox } from 'lucide-react';
import { notificationApi, normalizeNotificationList, getCurrentEmployeeId } from '../services/api.js';
import './NotificationPopup.css';

export default function NotificationPopup({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // Tính toán và thông báo ra bên ngoài số lượng chưa đọc
  const updateUnreadCount = (list) => {
    if (onUnreadChange) {
      const count = Array.isArray(list) ? list.filter((item) => !item.is_read).length : 0;
      onUnreadChange(count);
    }
  };

  // 1. Tải danh sách thông báo
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const employeeId = getCurrentEmployeeId();
      const response = employeeId
        ? await notificationApi.getEmployeeNotifications(employeeId)
        : await notificationApi.getAll();
      
      const rawData = response?.data?.data || response?.data || (Array.isArray(response) ? response : []);
      const list = normalizeNotificationList(rawData, employeeId);
      
      setNotifications(list);
      updateUnreadCount(list);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông báo:', error);
      setNotifications([]);
      updateUnreadCount([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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
    e.stopPropagation();

    // Optimistic Update: Đổi trạng thái UI ngay lập tức
    const updatedList = notifications.map((item) =>
      item.id === id ? { ...item, is_read: true } : item
    );
    setNotifications(updatedList);
    updateUnreadCount(updatedList);

    try {
      // Truyền cả id thông báo và employee_id nếu Backend yêu cầu
      const employeeId = getCurrentEmployeeId();
      await notificationApi.markAsRead(id, { employee_id: employeeId, is_read: true });
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
      // Nếu API lỗi thật sự mới gọi fetch lại để khôi phục trạng thái DB
      fetchNotifications();
    }
  };

  // 4. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;

    const updatedList = notifications.map((item) => ({ ...item, is_read: true }));
    setNotifications(updatedList);
    updateUnreadCount(updatedList);

    try {
      const employeeId = getCurrentEmployeeId();
      await notificationApi.markAllAsRead({ employee_id: employeeId });
    } catch (error) {
      console.error('Lỗi đọc tất cả:', error);
      fetchNotifications();
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
          notifications.map((item) => (
            <div
              key={item.id}
              className={`notification-item ${item.is_read ? 'read' : 'unread'}`}
            >
              <div className="item-main">
                <h4 className="item-title">{item.title}</h4>
                <p className="item-desc">{item.content}</p>
                <span className="item-time">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                </span>
              </div>
              {!item.is_read && (
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
          ))
        )}
      </div>
    </div>
  );
}