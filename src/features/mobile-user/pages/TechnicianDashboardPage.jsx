import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import HeaderInfo from '../components/HeaderInfo';
import TechMenuBar from '../components/TechMenuBar';
import { useTechnicianDashboard } from '../hooks/useTechnicianDashboard';
import { 
  Home,
  Calendar as CalendarIcon, 
  Briefcase, 
  Clock, 
  CheckCircle2,
  Search,
  Check,
  X,
  MapPin,
  AlertCircle
} from 'lucide-react';
import './TechnicianDashboardPage.css';

export default function TechnicianDashboardPage() {
  const {
    todayTasks,
    loading,
    currentPage,
    totalPages,
    activeNavMenu,
    searchTerm,
    priorityFilter,
    sortBy,
    paginatedUnassignedTasks,
    assignedTasks,
    setActiveNavMenu,
    setSearchTerm,
    setPriorityFilter,
    setSortBy,
    handlePageChange,
    goToSchedule,
    goToUnassignedTasks,
    goToAssignedTasks,
    goToDeviceDetail,
    handleAcceptTask,
    goToHome,
  } = useTechnicianDashboard();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDateTasks, setSelectedDateTasks] = useState([]);

  // Xử lý khi bấm vào một ngày trong Lịch
  const handleDateClick = (date) => {
    setSelectedDate(date);
    
    const tasksOnDate = [...(todayTasks || []), ...(assignedTasks || [])].filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      return taskDate.toDateString() === date.toDateString();
    });

    setSelectedDateTasks(tasksOnDate);
    setShowTaskModal(true);
  };

  // Render thẻ công việc trong từng ô lịch
  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const allTasks = [...(todayTasks || []), ...(assignedTasks || [])];
      const dayTasks = allTasks.filter(task => {
        if (!task.createdAt) return false;
        return new Date(task.createdAt).toDateString() === date.toDateString();
      });

      if (dayTasks.length === 0) return null;

      return (
        <div className="calendar-event-dots">
          {dayTasks.slice(0, 2).map((t, idx) => (
            <div 
              key={idx} 
              className={`calendar-event-tag ${t.priority === 'HIGH' ? 'urgent' : 'normal'}`}
              title={t.deviceName || t.title}
            >
              <span className="truncate-text">{t.deviceName || t.title || 'Công việc'}</span>
            </div>
          ))}
          {dayTasks.length > 2 && (
            <span className="calendar-more-count">+{dayTasks.length - 2} khác</span>
          )}
        </div>
      );
    }
    return null;
  };

  // Component Phân Trang Tái Sử Dụng
  const renderPagination = () => {
    if (!totalPages || totalPages <= 0) return null;

    return (
      <div className="tech-pagination">
        <button 
          type="button" 
          className="pg-btn" 
          disabled={currentPage === 1} 
          onClick={() => handlePageChange(1)}
        >
          &lt;&lt;
        </button>
        <button 
          type="button" 
          className="pg-btn" 
          disabled={currentPage === 1} 
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &lt;
        </button>

        {totalPages <= 3 ? (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <span
              key={page}
              className={`pg-number ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
              style={{ cursor: 'pointer' }}
            >
              {page}
            </span>
          ))
        ) : (
          <>
            <span 
              className={`pg-number ${currentPage === 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(1)}
              style={{ cursor: 'pointer' }}
            >
              1
            </span>

            {currentPage > 2 && <span className="pg-dots">...</span>}

            {currentPage !== 1 && currentPage !== totalPages && (
              <span className="pg-number active">{currentPage}</span>
            )}

            {currentPage < totalPages - 1 && <span className="pg-dots">...</span>}

            <span 
              className={`pg-number ${currentPage === totalPages ? 'active' : ''}`}
              onClick={() => handlePageChange(totalPages)}
              style={{ cursor: 'pointer' }}
            >
              {totalPages}
            </span>
          </>
        )}

        <button 
          type="button" 
          className="pg-btn" 
          disabled={currentPage === totalPages} 
          onClick={() => handlePageChange(currentPage + 1)}
        >
          &gt;
        </button>
        <button 
          type="button" 
          className="pg-btn" 
          disabled={currentPage === totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          &gt;&gt;
        </button>
      </div>
    );
  };

  // Render thanh tiêu đề Chọn Ngày/Tháng/Năm dạng Cuộn Scroll/Picker Android
  const renderCustomHeader = () => {
    const months = [
      "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
      "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
    ];
    
    const currentYear = selectedDate.getFullYear();
    const currentMonth = selectedDate.getMonth();
    const currentDay = selectedDate.getDate();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const yearsArray = Array.from({ length: 11 }, (_, i) => 2020 + i);

    const handleDayChange = (e) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(parseInt(e.target.value));
      setSelectedDate(newDate);
    };

    const handleMonthChange = (e) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(parseInt(e.target.value));
      setSelectedDate(newDate);
    };

    const handleYearChange = (e) => {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(parseInt(e.target.value));
      setSelectedDate(newDate);
    };

    return (
      <div className="android-picker-header">
        <span className="android-picker-label">CHỌN THỜI GIAN:</span>
        <div className="android-select-group">
          <select value={currentDay} onChange={handleDayChange} className="android-scroll-select">
            {daysArray.map((d) => (
              <option key={d} value={d}>Ngày {d}</option>
            ))}
          </select>

          <select value={currentMonth} onChange={handleMonthChange} className="android-scroll-select">
            {months.map((m, idx) => (
              <option key={idx} value={idx}>{m}</option>
            ))}
          </select>

          <select value={currentYear} onChange={handleYearChange} className="android-scroll-select">
            {yearsArray.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="mobile-container">
      {/* Header Info */}
      <HeaderInfo />

      {/* Menu Component */}
      <TechMenuBar 
        activeNavMenu={activeNavMenu}
        setActiveNavMenu={setActiveNavMenu}
        goToHome={goToHome}
        goToSchedule={goToSchedule}
        goToUnassignedTasks={goToUnassignedTasks}
        goToAssignedTasks={goToAssignedTasks}
      />

      {/* VIEW 1: TRANG CHỦ (HOME) */}
      {activeNavMenu === 'home' && (
        <>
          <div className="tech-table-section">
            <h3 className="tech-table-title">CÔNG VIỆC HÔM NAY</h3>

            <div className="tech-table-container">
              <table className="tech-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>MÃ TB</th>
                    <th>TÊN THIẾT BỊ</th>
                    <th>TÌNH TRẠNG</th>
                    <th>ĐỘ KHẤN CẤP</th>
                    <th>BÁO LỖI</th>
                    <th>VỊ TRÍ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">Đang tải dữ liệu...</td>
                    </tr>
                  ) : !todayTasks || todayTasks.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">Không có công việc nào hôm nay</td>
                    </tr>
                  ) : (
                    todayTasks.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{(currentPage - 1) * 5 + index + 1}</td>
                        <td>
                          <span
                            className="tech-device-link font-semibold text-blue-600 cursor-pointer hover:underline"
                            onClick={() => goToDeviceDetail(item.deviceId || item.deviceCode, item.id)}
                          >
                            {item.deviceId || item.deviceCode || 'N/A'}
                          </span>
                        </td>
                        <td className="font-medium">{item.deviceName || item.name || 'Thiết bị chưa đặt tên'}</td>
                        <td>{item.status || 'Chờ xử lý'}</td>
                        <td>
                          {item.priority === 'HIGH' ? (
                            <span className="badge-danger">Khẩn cấp</span>
                          ) : (
                            <span className="badge-normal">Bình thường</span>
                          )}
                        </td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                        <td>{item.location || item.deviceLocation || 'Chưa xác định'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang Home */}
            {renderPagination()}
          </div>

          <div 
            className="tech-banner-card cursor-pointer" 
            style={{ backgroundImage: `url("/bg-schedule.jpg")` }}
            onClick={goToSchedule}
          >
            <div className="banner-left-group">
              <div className="icon-circle-main">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="banner-label-bold">
                Xem lịch<br />làm việc
              </div>
            </div>
          </div>

          <div className="tech-banner-card task-card-layout" style={{ backgroundImage: `url("/bg-task.jpg")` }}>
            <div className="banner-left-group cursor-pointer" onClick={goToUnassignedTasks}>
              <div className="icon-circle-main">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div className="banner-label-bold">
                Danh sách<br />công việc
              </div>
            </div>

            <div className="banner-right-options">
              <div className="sub-option-item cursor-pointer" onClick={goToUnassignedTasks}>
                <div className="icon-circle-sub pending">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="sub-option-text">Chưa nhận</span>
              </div>

              <div className="sub-option-item cursor-pointer" onClick={goToAssignedTasks}>
                <div className="icon-circle-sub accepted">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="sub-option-text">Đã nhận</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: LỊCH LÀM VIỆC */}
      {activeNavMenu === 'schedule' && (
        <div className="schedule-view-container">
          <h3 className="tech-table-title">LỊCH LÀM VIỆC</h3>
          
          {renderCustomHeader()}

          <div className="calendar-wrapper">
            <Calendar 
              onClickDay={handleDateClick} 
              value={selectedDate}
              activeStartDate={selectedDate}
              tileContent={renderTileContent}
              showNavigation={false}
              className="custom-react-calendar grid-style-calendar" 
            />
          </div>
        </div>
      )}

      {/* VIEW 3: CÔNG VIỆC CHƯA NHẬN */}
      {activeNavMenu === 'unassigned' && (
        <div className="tech-table-section">
          <h3 className="tech-table-title">CÔNG VIỆC CHƯA NHẬN</h3>

          <div className="filter-bar">
            <div className="search-box">
              <Search className="w-4 h-4 icon" />
              <input 
                type="text" 
                placeholder="Tìm mã, tên TB, vị trí..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-options">
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option value="ALL">Mức độ: Tất cả</option>
                <option value="HIGH">Khẩn cấp</option>
                <option value="NORMAL">Bình thường</option>
              </select>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="NEWEST">Mới nhất</option>
                <option value="OLDEST">Cũ nhất</option>
              </select>
            </div>
          </div>

          <div className="tech-table-container">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MÃ TB</th>
                  <th>TÊN THIẾT BỊ</th>
                  <th>TÌNH TRẠNG</th>
                  <th>ĐỘ KHẤN CẤP</th>
                  <th>BÁO LỖI</th>
                  <th>VỊ TRÍ</th>
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {!paginatedUnassignedTasks || paginatedUnassignedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">Không tìm thấy công việc phù hợp</td>
                  </tr>
                ) : (
                  paginatedUnassignedTasks.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{(currentPage - 1) * 5 + index + 1}</td>
                      <td>
                        <span 
                          className="tech-device-link font-semibold text-blue-600 cursor-pointer hover:underline" 
                          onClick={() => goToDeviceDetail(item.deviceId, item.id)}
                        >
                          {item.deviceId}
                        </span>
                      </td>
                      <td className="font-medium">{item.deviceName || item.name || 'N/A'}</td>
                      <td><span className="badge-warning">{item.status}</span></td>
                      <td>
                        {item.priority === 'HIGH' ? (
                          <span className="badge-danger">Khẩn cấp</span>
                        ) : (
                          <span className="badge-normal">Bình thường</span>
                        )}
                      </td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td>{item.location}</td>
                      <td>
                        <button 
                          type="button"
                          className="btn-accept-task flex items-center gap-1"
                          onClick={() => handleAcceptTask(item)}
                        >
                          <Check className="w-3.5 h-3.5" /> Nhận
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang Công việc chưa nhận */}
          {renderPagination()}
        </div>
      )}

      {/* VIEW 4: CÔNG VIỆC ĐÃ NHẬN */}
      {activeNavMenu === 'assigned' && (
        <div className="tech-table-section">
          <h3 className="tech-table-title">CÔNG VIỆC ĐÃ NHẬN</h3>
          <div className="tech-table-container">
            <table className="tech-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>MÃ TB</th>
                  <th>TÊN THIẾT BỊ</th>
                  <th>TÌNH TRẠNG</th>
                  <th>ĐỘ KHẤN CẤP</th>
                  <th>VỊ TRÍ</th>
                </tr>
              </thead>
              <tbody>
                {!assignedTasks || assignedTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">Chưa có công việc nào được nhận</td>
                  </tr>
                ) : (
                  assignedTasks.map((item, index) => (
                    <tr key={item.id || index}>
                      <td>{(currentPage - 1) * 5 + index + 1}</td>
                      <td>
                        <span 
                          className="tech-device-link font-semibold text-blue-600 cursor-pointer hover:underline" 
                          onClick={() => goToDeviceDetail(item.deviceId, item.id)}
                        >
                          {item.deviceId}
                        </span>
                      </td>
                      <td className="font-medium">{item.deviceName || item.name || 'N/A'}</td>
                      <td><span className="badge-success">{item.status}</span></td>
                      <td>
                        {item.priority === 'HIGH' ? (
                          <span className="badge-danger">Khẩn cấp</span>
                        ) : (
                          <span className="badge-normal">Bình thường</span>
                        )}
                      </td>
                      <td>{item.location}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang Công việc đã nhận */}
          {renderPagination()}
        </div>
      )}

      {/* POPUP CHI TIẾT CÔNG VIỆC */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-subtitle">CHI TIẾT LỊCH TRÌNH</span>
                <h3 className="modal-title">
                  Ngày {selectedDate.toLocaleDateString('vi-VN')}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTaskModal(false)}
                className="modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body">
              {selectedDateTasks.length === 0 ? (
                <div className="modal-empty-state text-center py-6">
                  <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Không có công việc nào trong ngày này.</p>
                </div>
              ) : (
                <div className="modal-task-list">
                  {selectedDateTasks.map((task, idx) => (
                    <div key={idx} className="task-item-card">
                      <div className="task-card-top">
                        <span 
                          className="task-device-id"
                          onClick={() => {
                            setShowTaskModal(false);
                            goToDeviceDetail(task.deviceId || task.deviceCode, task.id);
                          }}
                        >
                          {task.deviceId || task.deviceCode}
                        </span>
                        <span className={task.priority === 'HIGH' ? 'badge-danger' : 'badge-normal'}>
                          {task.priority === 'HIGH' ? 'Khẩn cấp' : 'Bình thường'}
                        </span>
                      </div>
                      
                      <h4 className="task-device-name">
                        {task.deviceName || task.name || 'Chưa cập nhật'}
                      </h4>

                      <div className="task-card-info">
                        <div className="info-row">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{task.location || task.deviceLocation || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Trạng thái: <strong>{task.status}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NÚT HOME NỔI HÌNH TRÒN (FAB) */}
      <button
        type="button"
        className="fab-home-btn"
        onClick={() => setActiveNavMenu('home')}
        title="Quay về Trang chủ"
      >
        <Home className="w-6 h-6 text-white" />
      </button>
    </div>
  );
}