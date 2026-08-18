import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Bell, CheckCheck, Inbox } from 'lucide-react';
import {
  notificationApi,
  normalizeNotificationList,
  getCurrentEmployeeId,
} from '../../../services/api.js';
import './NotificationPopup.css';

export default function NotificationPopup({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // 1. Tải danh sách thông báo từ API khi mở Popup
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const employeeId = getCurrentEmployeeId();
      const response = employeeId
        ? await notificationApi.getEmployeeNotifications(employeeId)
        : await notificationApi.getAll();
      const data = Array.isArray(response)
        ? response
        : response?.data?.data || response?.data || response?.items || [];
      const list = normalizeNotificationList(data, employeeId || getCurrentEmployeeId());
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

  // 2. Click ngoài vùng Popup để tự động đóng
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        !event.target.closest('.header-btn-notification')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 3. Cập nhật số lượng chưa đọc ra ngoài HeaderInfo
  const updateUnreadCount = (list) => {
    if (onUnreadChange) {
      const unread = Array.isArray(list) ? list.filter((item) => !item.is_read).length : 0;
      onUnreadChange(unread);
    }
  };

  // 4. Đánh dấu 1 thông báo là đã đọc
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id, { is_read: true });
      const employeeId = getCurrentEmployeeId();
      const response = employeeId
        ? await notificationApi.getEmployeeNotifications(employeeId)
        : await notificationApi.getAll();
      const data = Array.isArray(response)
        ? response
        : response?.data?.data || response?.data || response?.items || [];
      const updatedList = normalizeNotificationList(data, employeeId || getCurrentEmployeeId());
      setNotifications(updatedList);
      updateUnreadCount(updatedList);
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    }
  };

  // 5. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      const employeeId = getCurrentEmployeeId();
      const response = employeeId
        ? await notificationApi.getEmployeeNotifications(employeeId)
        : await notificationApi.getAll();
      const data = Array.isArray(response)
        ? response
        : response?.data?.data || response?.data || response?.items || [];
      const updatedList = normalizeNotificationList(data, employeeId || getCurrentEmployeeId());
      setNotifications(updatedList);
      updateUnreadCount(updatedList);
    } catch (error) {
      console.error('Lỗi đọc tất cả:', error);
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
            <CheckCheck size={15} /> Đọc tất cả
          </button>
          <button type="button" className="btn-icon-close" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Danh sách thông báo */}
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
                <span className="item-time">{item.createdAt}</span>
              </div>
              {!item.is_read && (
                <button
                  type="button"
                  className="btn-mark-one"
                  onClick={(e) => handleMarkAsRead(item.id, e)}
                  title="Đánh dấu đã đọc"
                >
                  <Check size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}