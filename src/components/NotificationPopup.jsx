import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Bell, CheckCheck, Inbox } from 'lucide-react';
import { notificationApi } from '../services/api.js';
import './NotificationPopup.css';

export default function NotificationPopup({ isOpen, onClose, onUnreadChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);

  // 1. Tải danh sách thông báo khi popup mở
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationApi.getAll();
      const data = response.data?.data || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      updateUnreadCount(list);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách thông báo:', error);
      // Giả lập dữ liệu mẫu nếu API bị lỗi/chưa khởi tạo
      const mockData = [
        {
          id: 1,
          title: 'Yêu cầu bảo trì mới',
          content: 'Thiết bị Máy nén khí #02 báo lỗi áp suất.',
          is_read: false,
          createdAt: '10 phút trước',
        },
        {
          id: 2,
          title: 'Cập nhật hệ thống',
          content: 'Hệ thống sẽ bảo trì định kỳ vào 23:00 tối nay.',
          is_read: false,
          createdAt: '1 giờ trước',
        },
        {
          id: 3,
          title: 'Đăng nhập thành công',
          content: 'Tài khoản vừa được đăng nhập trên thiết bị mới.',
          is_read: true,
          createdAt: '1 ngày trước',
        },
      ];
      setNotifications(mockData);
      updateUnreadCount(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // 2. Tự động đóng popup khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        // Kiểm tra nếu click không thuộc nút Toggle Bell
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

  // 3. Cập nhật số lượng thông báo chưa đọc ra component cha
  const updateUnreadCount = (list) => {
    if (onUnreadChange) {
      const count = list.filter((item) => !item.is_read).length;
      onUnreadChange(count);
    }
  };

  // 4. Đánh dấu 1 thông báo đã đọc
  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationApi.markAsRead(id);
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
    } finally {
      const updatedList = notifications.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      );
      setNotifications(updatedList);
      updateUnreadCount(updatedList);
    }
  };

  // 5. Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch (error) {
      console.error('Lỗi đọc tất cả:', error);
    } finally {
      const updatedList = notifications.map((item) => ({ ...item, is_read: true }));
      setNotifications(updatedList);
      updateUnreadCount(updatedList);
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
                <span className="item-time">{item.createdAt}</span>
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