import React, { useState, useEffect } from 'react';
import { Wrench, ShieldCheck, User, UserCog, LogOut, Bell, Shield } from 'lucide-react';
import { authApi, notificationApi, userApi } from '../services/api.js';
import NotificationPopup from './NotificationPopup.jsx';
import './HeaderInfo.css'; 

export default function HeaderInfo({ userId, onLogout, onOpenNotifications }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper bóc tách dữ liệu User từ response của API /users/:id hoặc /auth/me
  const parseUserData = (rawResponse) => {
    if (!rawResponse) return null;
    const res = rawResponse.data || rawResponse;
    
    // Đọc theo cấu trúc API mới: res.data chính là object user
    if (res.data && (res.data.employee_id || res.data.id)) {
      return res.data;
    }
    return res.user || res;
  };

  // 1. Tải thông tin người dùng
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        let userData = null;

        // Ưu tiên 1: Lấy ID từ localStorage (được lưu lúc Login)
        const cachedUser = localStorage.getItem('userInfo');
        let currentUserId = userId;
        
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            const extracted = parseUserData(parsed);
            currentUserId = currentUserId || extracted?.id || extracted?.employee_id;
          } catch (e) {
            console.error('Lỗi parse cache user:', e);
          }
        }

        // Gọi API lấy thông tin chi tiết qua Gateway: GET /users/:id
        if (currentUserId && userApi?.getUserById) {
          const response = await userApi.getUserById(currentUserId);
          userData = parseUserData(response);
        } else {
          // Fallback gọi /auth/me nếu không có id
          const response = await authApi.getMe();
          userData = parseUserData(response);
        }

        if (userData) {
          setUserInfo(userData);
          localStorage.setItem('userInfo', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng:', error);
        
        // Fallback dùng Cache khi mất kết nối
        const cachedUser = localStorage.getItem('userInfo');
        if (cachedUser) {
          try {
            setUserInfo(parseUserData(JSON.parse(cachedUser)));
          } catch (e) {
            setUserInfo(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Lắng nghe sự kiện đăng nhập thành công
    window.addEventListener('userLoginSuccess', fetchUserProfile);

    return () => {
      window.removeEventListener('userLoginSuccess', fetchUserProfile);
    };
  }, [userId]);

  // 2. Lấy số lượng thông báo chưa đọc
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationApi.getUnreadCount();
      const count = response.data?.count ?? response.data?.data ?? response.data ?? 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (error) {
      // Service thông báo chưa sẵn sàng
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // 3. Xử lý Đăng xuất
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

  // 4. Toggle Notification
  const handleToggleNotification = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    }
    setShowNotifications((prev) => !prev);
  };

  // 5. Mapping Icon & Badge theo Role từ API
  const getRoleBadge = (role) => {
    const normalizedRole = role?.toUpperCase();
    switch (normalizedRole) {
      case 'ADMIN':
        return { icon: <ShieldCheck />, label: 'Quản trị viên', styleClass: 'role-admin' };
      case 'MANAGER':
        return { icon: <Shield />, label: 'Quản lý', styleClass: 'role-manager' };
      case 'TECH':
      case 'TECHNICIAN':
      case 'MAINTENANCE_STAFF':
        return { icon: <Wrench />, label: 'Kỹ thuật viên', styleClass: 'role-staff' };
      case 'USER':
      default:
        return { icon: <User />, label: 'Người dùng', styleClass: 'role-user' };
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
  
  // Trích xuất dữ liệu khớp đúng với Cấu trúc Response của GET /users/:id
  const fullName = userInfo?.employee?.full_name || userInfo?.fullName || userInfo?.username || 'Người dùng';
  const email = userInfo?.email || 'N/A';
  const phone = userInfo?.employee?.phone || userInfo?.phone || 'Chưa cập nhật';
  const position = userInfo?.employee?.position || userInfo?.position || roleInfo.label;

  return (
    <div className="header-user-info" style={{ position: 'relative' }}>
      {/* Avatar Icon */}
      <div 
        className={`header-avatar ${roleInfo.styleClass}`} 
        title={position}
      >
        {roleInfo.icon}
      </div>

      {/* Thông tin chi tiết */}
      <div className="header-details">
        <div className="header-title-group">
          <span className="header-name">{fullName}</span>
          <span className="header-badge">{position}</span>
        </div>
        <p className="header-email">Email: {email}</p>
        <p className="header-phone">SĐT: {phone}</p>
      </div>

      {/* Nhóm thao tác */}
      <div className="header-btn-group">
        <button
          type="button"
          className="header-btn header-btn-notification"
          title="Thông báo"
          onClick={handleToggleNotification}
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

      {/* Popup Thông báo */}
      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onUnreadChange={(newCount) => setUnreadCount(newCount)}
      />
    </div>
  );
}