import React, { useState, useEffect } from 'react';
import { Wrench, ShieldCheck, User, UserCog, LogOut, Bell, Shield } from 'lucide-react';
import { authApi, notificationApi } from '../../../services/api.js';
import NotificationPopup from './NotificationPopup.jsx';
import './HeaderInfo.css'; 

export default function HeaderInfo({ userId, onLogout, onOpenNotifications }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Trạng thái Bật/Tắt Popup
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // 1. Lấy thông tin người dùng hiện tại từ API /auth/me
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getMe();
        const userData = response.data?.data || response.data || response;

        if (userData) {
          setUserInfo(userData);
          localStorage.setItem('userInfo', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        
        const cachedUser = localStorage.getItem('userInfo');
        if (cachedUser) {
          try {
            setUserInfo(JSON.parse(cachedUser));
          } catch (e) {
            setUserInfo(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  // 2. Lấy số lượng thông báo chưa đọc
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      const count = response.data?.count ?? response.data?.data ?? response.data ?? 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      // Bỏ qua log khi service thông báo tạm thời offline
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. Logic Đăng xuất
  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    } finally {
      localStorage.clear();
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/login';
      }
    }
  };

  // 4. Click nút thông báo: Bật / Tắt Popup
  const handleNotificationClick = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    }
    setIsNotificationOpen((prev) => !prev);
  };

  // 5. Xác định Role Badge
  const getRoleBadge = (role) => {
    const normalizedRole = role?.toUpperCase();
    switch (normalizedRole) {
      case 'ADMIN':
        return { 
          icon: <ShieldCheck />, 
          label: 'Quản trị viên', 
          styleClass: 'role-admin' 
        };
      case 'MANAGER':
        return { 
          icon: <Shield />, 
          label: 'Quản lý', 
          styleClass: 'role-manager' 
        };
      case 'TECHNICIAN':
      case 'MAINTENANCE_STAFF':
        return { 
          icon: <Wrench />, 
          label: 'Kỹ thuật viên', 
          styleClass: 'role-staff' 
        };
      case 'USER':
      default:
        return { 
          icon: <User />, 
          label: 'Người dùng', 
          styleClass: 'role-user' 
        };
    }
  };

  if (loading) {
    return (
      <div className="header-skeleton">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-text-group">
          <div className="skeleton-line w-medium"></div>
          <div className="skeleton-line w-long"></div>
          <div className="skeleton-line w-short"></div>
        </div>
      </div>
    );
  }

  const roleInfo = getRoleBadge(userInfo?.role);
  
  // Trích xuất dữ liệu
  const fullName = userInfo?.employee?.full_name || userInfo?.fullName || userInfo?.username || 'Người dùng';
  const email = userInfo?.email || 'N/A';
  const phone = userInfo?.employee?.phone || userInfo?.phone || 'Chưa cập nhật';
  
  // Lấy chức vụ để hiển thị lên Thẻ (Badge)
  const position = userInfo?.employee?.position || userInfo?.position || roleInfo.label;

  return (
    <div className="header-user-info" style={{ position: 'relative' }}>
      {/* 1. Avatar Icon Role */}
      <div 
        className={`header-avatar ${roleInfo.styleClass}`} 
        title={position}
      >
        {roleInfo.icon}
      </div>

      {/* 2. Cột thông tin chi tiết */}
      <div className="header-details">
        <div className="header-title-group">
          <span className="header-name">{fullName}</span>
          <span className="header-badge">{position}</span>
        </div>
        <p className="header-email">Email: {email}</p>
        <p className="header-phone">SĐT: {phone}</p>
      </div>

      {/* 3. Nhóm Nút Thao tác */}
      <div className="header-btn-group">
        <button
          type="button"
          className="header-btn header-btn-notification"
          title="Thông báo"
          onClick={handleNotificationClick}
        >
          <Bell />
          {unreadCount > 0 && (
            <span className="notification-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className="header-btn header-btn-edit"
          title="Sửa thông tin"
          onClick={() => alert('Mở dialog chỉnh sửa')}
        >
          <UserCog />
        </button>

        <button 
          type="button"
          className="header-btn header-btn-logout"
          title="Đăng xuất" 
          onClick={handleLogout}
        >
          <LogOut />
        </button>
      </div>

      {/* 4. Dropdown Popup Thông báo */}
      <NotificationPopup
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onUnreadChange={(newCount) => setUnreadCount(newCount)}
      />
    </div>
  );
}