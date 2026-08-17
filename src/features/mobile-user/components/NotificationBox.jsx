import React from 'react';

export default function NotificationBox({ unreadCount = 0 }) {
  return (
    <div className="notification-box" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#fff7ed',
      border: '1px solid #fed7aa',
      borderRadius: '12px',
      padding: '12px 14px',
      margin: '12px 16px 0',
      color: '#9a4d00',
      fontSize: '14px',
      fontWeight: 600
    }}>
      <span aria-label="notification">🔔</span>
      <span>
        {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
      </span>
    </div>
  );
}
