import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  LayoutDashboard, 
  CalendarCheck, 
  ClipboardCheck, 
  CheckCircle2, 
  Settings, 
  FileUp,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import './ManagerSidebar.css';

export default function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserRole = localStorage.getItem('userRole')?.toUpperCase();
  const isAdminOnly = currentUserRole === 'ADMIN';

  // State thu gọn / mở rộng sidebar
  const [isExpanded, setIsExpanded] = useState(true);
  
  // State quản lý Đóng/Mở Submenu
  const [openSubmenu, setOpenSubmenu] = useState({
    requests: false,
    admin: false
  });

  // Tự động mở rộng Submenu nếu URL hiện tại thuộc về mục con đó
  useEffect(() => {
    if (location.pathname.includes('/requests') || location.pathname.includes('/user-requests') || location.pathname.includes('/technician-requests')) {
      setOpenSubmenu(prev => ({ ...prev, requests: true }));
    } else if (
      location.pathname.startsWith('/admin/users') ||
      location.pathname.startsWith('/admin/system-logs') ||
      location.pathname.startsWith('/admin/supplies') ||
      location.pathname.startsWith('/admin/devices') ||
      location.pathname.startsWith('/admin/device-logs')
    ) {
      setOpenSubmenu(prev => ({ ...prev, admin: true }));
    }
  }, [location.pathname]);

  // Đóng/Mở thanh Sidebar chính
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Toggle Đóng / Mở mục con
  const toggleSubmenu = (menuKey) => {
    if (!isExpanded) {
      setIsExpanded(true);
      setOpenSubmenu(prev => ({ ...prev, [menuKey]: true }));
    } else {
      setOpenSubmenu(prev => ({
        ...prev,
        [menuKey]: !prev[menuKey]
      }));
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  // Kiểm tra xem trang hiện tại có thuộc menu Quản trị hay không
  const isAdminActive = [
    '/admin/users',
    '/admin/system-logs',
    '/admin/supplies',
    '/admin/devices',
    '/admin/device-logs'
  ].some(path => location.pathname.startsWith(path));

  return (
    <aside className={`manager-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Nút 3 gạch Top Toggle */}
      <div className="sidebar-header">
        <button type="button" className="icon-circle toggle-btn" onClick={toggleSidebar} title="Đóng/Mở menu">
          <Menu size={22} color="#000000" />
        </button>
      </div>

      <nav className="sidebar-menu">
        {isAdminOnly ? (
          <div className="menu-group">
            <div 
              className={`menu-item ${isAdminActive ? 'active' : ''}`}
              onClick={() => toggleSubmenu('admin')}
            >
              <div className="icon-circle">
                <Settings size={20} />
              </div>
              {isExpanded && (
                <>
                  <span className="menu-text">Quản trị</span>
                  <span className="arrow-icon">
                    {openSubmenu.admin ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </>
              )}
            </div>

            {isExpanded && openSubmenu.admin && (
              <div className="submenu-list">
                <div 
                  className={`submenu-item ${isActive('/admin/users') ? 'active-sub' : ''}`}
                  onClick={() => handleNavigate('/admin/users')}
                >
                  Quản lý tài khoản
                </div>
                <div 
                  className={`submenu-item ${isActive('/admin/system-logs') ? 'active-sub' : ''}`}
                  onClick={() => handleNavigate('/admin/system-logs')}
                >
                  Hiển thị log hệ thống
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div 
              className={`menu-item ${isActive('/manager/dashboard') ? 'active' : ''}`}
              onClick={() => handleNavigate('/manager/dashboard')}
            >
              <div className="icon-circle">
                <LayoutDashboard size={20} />
              </div>
              {isExpanded && <span className="menu-text">Dashboard</span>}
            </div>

            <div 
              className={`menu-item ${isActive('/admin/maintenance-plans') ? 'active' : ''}`}
              onClick={() => handleNavigate('/admin/maintenance-plans')}
            >
              <div className="icon-circle">
                <CalendarCheck size={20} />
              </div>
              {isExpanded && <span className="menu-text">Lập kế hoạch bảo trì</span>}
            </div>

            <div className="menu-group">
              <div 
                className={`menu-item ${location.pathname.includes('requests') ? 'active' : ''}`}
                onClick={() => toggleSubmenu('requests')}
              >
                <div className="icon-circle">
                  <ClipboardCheck size={20} />
                </div>
                {isExpanded && (
                  <>
                    <span className="menu-text">Duyệt yêu cầu</span>
                    <span className="arrow-icon">
                      {openSubmenu.requests ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </>
                )}
              </div>

              {isExpanded && openSubmenu.requests && (
                <div className="submenu-list">
                  <div 
                    className={`submenu-item ${isActive('/admin/technician-requests') ? 'active-sub' : ''}`}
                    onClick={() => handleNavigate('/admin/technician-requests')}
                  >
                    Yêu cầu từ nhân viên sửa chữa/bảo trì
                  </div>
                  <div 
                    className={`submenu-item ${isActive('/admin/user-requests') ? 'active-sub' : ''}`}
                    onClick={() => handleNavigate('/admin/user-requests')}
                  >
                    Yêu cầu từ người dùng thiết bị
                  </div>
                </div>
              )}
            </div>

            <div 
              className={`menu-item ${isActive('/admin/acceptance') ? 'active' : ''}`}
              onClick={() => handleNavigate('/admin/acceptance')}
            >
              <div className="icon-circle">
                <CheckCircle2 size={20} />
              </div>
              {isExpanded && <span className="menu-text">Nghiệm thu</span>}
            </div>

            <div className="menu-group">
              <div 
                className={`menu-item ${isAdminActive ? 'active' : ''}`}
                onClick={() => toggleSubmenu('admin')}
              >
                <div className="icon-circle">
                  <Settings size={20} />
                </div>
                {isExpanded && (
                  <>
                    <span className="menu-text">Quản trị</span>
                    <span className="arrow-icon">
                      {openSubmenu.admin ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </>
                )}
              </div>

              {isExpanded && openSubmenu.admin && (
                <div className="submenu-list">
                  <div 
                    className={`submenu-item ${isActive('/admin/supplies') ? 'active-sub' : ''}`}
                    onClick={() => handleNavigate('/admin/supplies')}
                  >
                    Quản lý vật tư
                  </div>
                  <div 
                    className={`submenu-item ${isActive('/admin/devices') ? 'active-sub' : ''}`}
                    onClick={() => handleNavigate('/admin/devices')}
                  >
                    Quản lý thiết bị
                  </div>
                  <div 
                    className={`submenu-item ${isActive('/admin/device-logs') ? 'active-sub' : ''}`}
                    onClick={() => handleNavigate('/admin/device-logs')}
                  >
                    Sổ theo dõi thiết bị
                  </div>
                </div>
              )}
            </div>

            <div 
              className={`menu-item ${isActive('/manager/import') ? 'active' : ''}`}
              onClick={() => handleNavigate('/manager/import')}
            >
              <div className="icon-circle">
                <FileUp size={20} />
              </div>
              {isExpanded && <span className="menu-text">Import file dữ liệu</span>}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}