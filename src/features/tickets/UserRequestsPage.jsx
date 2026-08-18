import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderInfo from '../../components/HeaderInfo';
import ManagerSidebar from '../../components/ManagerSidebar';
import RejectModal from './components/RejectModal';
import Pagination from './components/Pagination';
import ExportExcelButton from '../../components/ExportExcelButton';
import { getCurrentEmployeeId, maintenanceApi } from '../../services/api';
import { USER_REQUEST_TYPES } from '../../constants/userRequests';
import './UserRequestsPage.css';

const PAGE_SIZE = 30;

// Cấu hình độ khẩn cấp
const PRIORITY_MAP = {
  URGENT: { label: 'Khẩn cấp', class: 'priority-urgent', rank: 1 },
  NORMAL: { label: 'Bình thường', class: 'priority-normal', rank: 2 }
};

// Loại yêu cầu ĐƯỢC PHÉP có độ khẩn cấp "Khẩn cấp"
const ALLOWED_URGENT_TYPES = ['REPORT_BROKEN', 'REQUEST_EQUIPMENT'];

export default function UserRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const navigate = useNavigate();

  // Load dữ liệu từ API
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await maintenanceApi.getRepairs({ status: 'pending', limit: 100 });
        const repairs = Array.isArray(response) ? response : response?.data || [];
        setRequests(repairs.map((repair) => ({
          id: repair.id || repair._id,
          type: 'REPORT_BROKEN',
          priority: String(repair.priority || 'normal').toUpperCase(),
          deviceCode: repair.device_code || repair.deviceCode || `DEV-${repair.device_id || ''}`,
          employeeName: repair.employee_name || repair.created_by_employee_id || 'N/A',
          content: repair.description || '',
          createdAt: repair.created_at || repair.createdAt || '',
          estimatedCost: Number(repair.estimated_cost || 0),
          managerName: repair.approved_by_employee_id || 'Chưa duyệt',
          status: repair.status || 'pending',
          deviceId: repair.device_id
        })));
      } catch (error) {
        console.error('Failed to fetch user requests:', error);
        setRequests([]);
      }
    };
    fetchRequests();
  }, []);

  // Format hiển thị ngày giờ chuẩn Việt Nam (HH:mm DD/MM/YYYY)
  const formatDateDisplay = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes} ${day}/${month}/${year}`;
  };

  // Helper tính độ khẩn cấp thực tế dựa vào loại yêu cầu
  const getEffectivePriority = (item) => {
    if (ALLOWED_URGENT_TYPES.includes(item.type) && item.priority === 'URGENT') {
      return 'URGENT';
    }
    return 'NORMAL';
  };

  // Cấu hình cột xuất Excel
  const excelColumns = useMemo(() => [
    { header: 'Mã YC', key: 'id', align: 'center' },
    { 
      header: 'Loại yêu cầu', 
      key: 'type', 
      align: 'left',
      formatter: (val) => USER_REQUEST_TYPES[val]?.label || val || '-' 
    },
    { 
      header: 'Độ khẩn cấp', 
      key: 'priority', 
      align: 'center',
      formatter: (val, row) => PRIORITY_MAP[getEffectivePriority(row)]?.label || 'Bình thường' 
    },
    { header: 'Mã thiết bị', key: 'deviceCode', align: 'center' },
    { header: 'Nhân viên yêu cầu', key: 'employeeName', align: 'left' },
    { header: 'Nội dung chi tiết', key: 'content', align: 'left' },
    { 
      header: 'Thời gian gửi', 
      key: 'createdAt', 
      align: 'center',
      formatter: (val) => formatDateDisplay(val)
    },
    { 
      header: 'Dự toán (VNĐ)', 
      key: 'estimatedCost', 
      align: 'right',
      formatter: (val) => typeof val === 'number' ? val.toLocaleString('vi-VN') : (val || '0') 
    },
    { header: 'Quản lý duyệt', key: 'managerName', align: 'left' },
    { header: 'Lý do từ chối', key: 'rejectReason', align: 'left' },
    { 
      header: 'Trạng thái', 
      key: 'status', 
      align: 'center',
      formatter: (val) => {
        if (['ACCEPTED', 'success'].includes(val)) return 'Đã chấp nhận';
        if (['REJECTED', 'fail'].includes(val)) return 'Đã từ chối';
        return 'Chờ duyệt';
      }
    }
  ], []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedRequests = useMemo(() => {
    let result = Array.isArray(requests) ? [...requests] : [];

    // Lọc theo loại yêu cầu
    if (selectedTypeFilter !== 'ALL') {
      result = result.filter(item => item.type === selectedTypeFilter);
    }

    // Xử lý Sắp xếp: ƯU TIÊN Khẩn cấp xếp lên đầu tiên, sau đó mới xếp theo thuộc tính được chọn
    result.sort((a, b) => {
      const aPriorityRank = PRIORITY_MAP[getEffectivePriority(a)]?.rank || 2;
      const bPriorityRank = PRIORITY_MAP[getEffectivePriority(b)]?.rank || 2;

      if (aPriorityRank !== bPriorityRank) {
        return aPriorityRank - bPriorityRank;
      }

      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';

      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }

      if (sortConfig.key === 'priority') {
        aVal = aPriorityRank;
        bVal = bPriorityRank;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [requests, selectedTypeFilter, sortConfig]);

  const totalPages = Math.ceil(processedRequests.length / PAGE_SIZE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedRequests.slice(start, start + PAGE_SIZE);
  }, [processedRequests, currentPage]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleAccept = async (ticket) => {
    if (window.confirm(`Xác nhận CHẤP NHẬN yêu cầu từ ${ticket.employeeName}?`)) {
      try {
        await maintenanceApi.approveRepair(ticket.id, {
          approved_by: Number(getCurrentEmployeeId()) || 1,
          status: 'success'
        });
        setRequests(prev => prev.map(item => item.id === ticket.id ? { ...item, status: 'success' } : item));
      } catch (error) {
        console.error('Không thể duyệt yêu cầu sửa chữa:', error);
        alert(error?.message || 'Không thể duyệt yêu cầu sửa chữa.');
        return;
      }

      const formattedDeviceCode = Array.isArray(ticket.deviceCodes) 
        ? ticket.deviceCodes[0] || ''
        : (ticket.deviceCode || ticket.deviceCodes || '');

      const isScrap = ticket.content?.toLowerCase().includes('thanh lý');

      // 1. Trường hợp báo hỏng thanh lý -> Thông báo trực tiếp
      if (ticket.type === 'REPORT_BROKEN' && isScrap) {
        alert(`Đã duyệt yêu cầu thanh lý cho thiết bị ${formattedDeviceCode}`);
        return;
      }

      // 2. Điều hướng sang Trang Lập kế hoạch bảo trì/sửa chữa
      navigate('/maintenance-plan', {
        state: {
          fromApproval: true,
          requestData: {
            deviceCode: formattedDeviceCode,
            deviceStatus: ticket.deviceStatus || 'Đang sử dụng',
            type: ticket.type,
            content: ticket.content || null,
            estimatedCost: ticket.estimatedCost || 0,
            employeeName: ticket.employeeName || null,
            requestId: ticket.id || null
          }
        }
      });
    }
  };

  const handleOpenReject = (ticket) => {
    setSelectedTicket(ticket);
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async (ticket, reason) => {
    try {
      await maintenanceApi.approveRepair(ticket.id, {
        approved_by: Number(getCurrentEmployeeId()) || 1,
        status: 'fail'
      });
      setRequests(prev => prev.map(item => item.id === ticket.id ? { ...item, status: 'fail', rejectReason: reason } : item));
    } catch (error) {
      console.error('Không thể từ chối yêu cầu sửa chữa:', error);
      alert(error?.message || 'Không thể từ chối yêu cầu sửa chữa.');
      return;
    }
    setIsRejectOpen(false);
    setSelectedTicket(null);
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return <span className="sort-arrow inactive">▲▼</span>;
    return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>

      <div className="page-body-wrapper">
        <aside className="sidebar-container">
          <ManagerSidebar />
        </aside>

        <main className="main-content-container">
          <h2 className="plan-page-title">
            Danh sách yêu cầu từ người dùng thiết bị
          </h2>

          <div className="filter-bar-container">
            <div className="filter-group">
              <label>LOẠI YÊU CẦU</label>
              <select 
                className="filter-control"
                value={selectedTypeFilter}
                onChange={(e) => { setSelectedTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">-- Tất cả loại yêu cầu --</option>
                {Object.entries(USER_REQUEST_TYPES).map(([key, item]) => (
                  <option key={key} value={key}>{item.label}</option>
                ))}
              </select>
            </div>

            <ExportExcelButton 
              data={processedRequests}
              fileName="Danh_sach_yeu_cau_nguoi_dung"
              tableTitle="DANH SÁCH YÊU CẦU TỪ NGƯỜI DÙNG THIẾT BỊ"
              columns={excelColumns}
            />
          </div>

          <div className="frame-33-table-wrapper">
            <table className="tech-requests-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  <th className="sortable-th" onClick={() => handleSort('type')}>
                    <div className="th-content">Loại yêu cầu {renderSortArrow('type')}</div>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('priority')}>
                    <div className="th-content">Độ khẩn cấp {renderSortArrow('priority')}</div>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('deviceCode')}>
                    <div className="th-content">Mã TB {renderSortArrow('deviceCode')}</div>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('employeeName')}>
                    <div className="th-content">Nhân viên yêu cầu {renderSortArrow('employeeName')}</div>
                  </th>
                  <th>Nội dung yêu cầu</th>
                  <th className="sortable-th" onClick={() => handleSort('createdAt')}>
                    <div className="th-content">Thời gian gửi {renderSortArrow('createdAt')}</div>
                  </th>
                  <th className="sortable-th" onClick={() => handleSort('estimatedCost')}>
                    <div className="th-content">Dự toán {renderSortArrow('estimatedCost')}</div>
                  </th>
                  <th>Quản lý</th>
                  <th>Lý do từ chối</th>
                  <th className="action-header-col">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-table-msg">Không có dữ liệu yêu cầu</td>
                  </tr>
                ) : (
                  paginatedRequests.map((item, index) => {
                    const isExpanded = expandedId === item.id;
                    const typeInfo = USER_REQUEST_TYPES[item.type] || { label: item.type, badgeClass: '' };
                    
                    const priorityKey = getEffectivePriority(item);
                    const priorityInfo = PRIORITY_MAP[priorityKey];
                    const isUrgent = priorityKey === 'URGENT';

                    return (
                      <tr key={item.id || index} className={isUrgent ? 'row-urgent-highlight' : ''}>
                        <td className="text-center">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td>
                          <span className={`request-type-badge ${typeInfo.badgeClass}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={`priority-badge ${priorityInfo.class}`}>
                            {priorityInfo.label}
                          </span>
                        </td>
                        <td className="text-center font-bold">
                          <span className="device-code-tag">{item.deviceCode || '-'}</span>
                        </td>
                        <td className="font-bold">{item.employeeName || '-'}</td>
                        <td>
                          <div className="request-content-box">
                            <p className={`content-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
                              {item.content}
                            </p>
                            {item.content && item.content.length > 40 && (
                              <button 
                                type="button" 
                                className="btn-toggle-detail"
                                onClick={() => toggleExpand(item.id)}
                              >
                                {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="text-center">{formatDateDisplay(item.createdAt)}</td>
                        <td className="text-right font-bold text-primary">
                          {item.estimatedCost ? `${item.estimatedCost.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </td>
                        <td>{item.managerName || '-'}</td>
                        <td className="reject-reason-cell">
                          {item.rejectReason ? (
                            <span className="text-danger">{item.rejectReason}</span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="text-center action-cell">
                          {item.status === 'ACCEPTED' ? (
                            <span className="badge-accepted">Đã chấp nhận</span>
                          ) : item.status === 'REJECTED' ? (
                            <span className="badge-rejected">Đã từ chối</span>
                          ) : (
                            <div className="action-btn-group">
                              <button 
                                type="button" 
                                className="btn-action btn-accept"
                                onClick={() => handleAccept(item)}
                              >
                                Chấp nhận
                              </button>
                              <button 
                                type="button" 
                                className="btn-action btn-reject"
                                onClick={() => handleOpenReject(item)}
                              >
                                Từ chối
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />

          {isRejectOpen && (
            <RejectModal 
              isOpen={isRejectOpen}
              onClose={() => setIsRejectOpen(false)}
              onSubmit={handleConfirmReject}
              ticketData={selectedTicket}
            />
          )}
        </main>
      </div>
    </div>
  );
}