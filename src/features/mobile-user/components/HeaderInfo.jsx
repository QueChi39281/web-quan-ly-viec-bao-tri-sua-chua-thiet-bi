import React, { useState, useEffect } from 'react';
import { Wrench, ShieldCheck, User, UserCog, LogOut, Bell, Shield } from 'lucide-react';
import { authApi, notificationApi, userApi } from '../../../services/api.js';
import NotificationPopup from './NotificationPopup.jsx';
import './HeaderInfo.css'; 

export default function HeaderInfo({ userId, onLogout, onOpenNotifications }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Trạng thái Bật/Tắt Popup
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Helper trích xuất dữ liệu User từ response của Gateway
  const extractUserData = (rawResponse) => {
    if (!rawResponse) return null;
    const resData = rawResponse.data || rawResponse;
    // Bắt các trường hợp: resData.data (API /users/:id), resData.data.user (API /auth/me), hoặc chính resData
    return resData.data?.user || resData.data || resData.user || resData;
  };

  // 1. Tải thông tin người dùng từ Gateway
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        let userData = null;

        // Ưu tiên gọi API Gateway theo ID nếu có userId hoặc lấy từ localStorage
        let targetId = userId;
        if (!targetId) {
          const cachedUser = localStorage.getItem('userInfo');
          if (cachedUser) {
            try {
              const parsed = JSON.parse(cachedUser);
              const extracted = extractUserData(parsed);
              targetId = extracted?.employee_id || extracted?.id;
            } catch (e) {
              console.error('Lỗi parse local userInfo:', e);
            }
          }
        }

        if (targetId && userApi?.getUserById) {
          // Gọi GET http://localhost:3000/users/:id
          const response = await userApi.getUserById(targetId);
          userData = extractUserData(response);
        } else {
          // Fallback gọi /auth/me nếu chưa có ID
          const response = await authApi.getMe();
          userData = extractUserData(response);
        }

        if (userData) {
          setUserInfo(userData);
          localStorage.setItem('userInfo', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin người dùng từ Gateway:', error);
        
        // Fallback dùng Cache local khi gặp sự cố mạng
        const cachedUser = localStorage.getItem('userInfo');
        if (cachedUser) {
          try {
            setUserInfo(extractUserData(JSON.parse(cachedUser)));
          } catch (e) {
            setUserInfo(null);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();

    // Lắng nghe sự kiện đăng nhập thành công từ LoginPage
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
      case 'TECH':
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
  
  // Trích xuất dữ liệu tương thích hoàn toàn với cấu trúc JSON của API Gateway /users/:id
  const fullName = userInfo?.employee?.full_name || userInfo?.fullName || userInfo?.username || 'Người dùng';
  const email = userInfo?.email || 'N/A';
  const phone = userInfo?.employee?.phone || userInfo?.phone || 'Chưa cập nhật';
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