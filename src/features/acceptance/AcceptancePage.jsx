import React, { useState, useEffect, useMemo } from 'react';
import HeaderInfo from '../../components/HeaderInfo';
import ManagerSidebar from '../../components/ManagerSidebar';
import ApproveModal from './components/ApproveModal';
import RejectModal from './components/RejectModal';
import Pagination from '../tickets/components/Pagination';
import ExportExcelButton from '../../components/ExportExcelButton';
import { MOCK_ACCEPTANCE_REQUESTS } from '../../constants/acceptanceMockData'; 
import './AcceptancePage.css';

const PAGE_SIZE = 30;

// Cấu hình các cột dữ liệu cần xuất ra file Excel
const ACCEPTANCE_EXCEL_COLUMNS = [
  { header: 'Mã Thiết Bị', key: 'deviceCode', align: 'center' },
  { header: 'Tên Thiết Bị', key: 'deviceName', align: 'left' },
  { header: 'Nhân Viên Gửi', key: 'employeeName', align: 'left' },
  { header: 'Nội Dung Lỗi', key: 'errorDescription', align: 'left' },
  { header: 'Phương Án Sửa', key: 'solution', align: 'left' },
  { header: 'Linh Kiện Dùng', key: 'usedComponents', align: 'left' },
  { 
    header: 'Xác Nhận ND', 
    key: 'userConfirmation',
    align: 'center',
    formatter: (val) => (val ? 'Đã xác nhận' : 'Chưa xác nhận')
  },
  { header: 'Thời Gian Gửi', key: 'createdAt', align: 'center' },
  { 
    header: 'Chi Phí (Đồng)', 
    key: 'estimatedCost',
    align: 'right',
    formatter: (val) => (val ? val.toLocaleString('vi-VN') : '0')
  },
  { header: 'Quản Lý', key: 'managerName', align: 'left' },
  { 
    header: 'Trạng Thái', 
    key: 'status',
    align: 'center',
    formatter: (val) => val === 'APPROVED' ? 'Đã duyệt' : val === 'REJECTED' ? 'Đã từ chối' : 'Chờ nghiệm thu'
  }
];

export default function AcceptancePage() {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedReasonId, setExpandedReasonId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const [selectedUserConfirmFilter, setSelectedUserConfirmFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Nạp dữ liệu từ file mock
  useEffect(() => {
    setRequests(MOCK_ACCEPTANCE_REQUESTS);
  }, []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedRequests = useMemo(() => {
    let result = Array.isArray(requests) ? [...requests] : [];

    if (selectedUserConfirmFilter !== 'ALL') {
      const isConfirmed = selectedUserConfirmFilter === 'YES';
      result = result.filter(item => item.userConfirmation === isConfirmed);
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';

      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [requests, selectedUserConfirmFilter, sortConfig]);

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
  const toggleExpandReason = (id) => setExpandedReasonId(expandedReasonId === id ? null : id);

  const handleOpenApprove = (ticket) => {
    setSelectedTicket(ticket);
    setIsApproveOpen(true);
  };

  const handleOpenReject = (ticket) => {
    setSelectedTicket(ticket);
    setIsRejectOpen(true);
  };

  const handleConfirmApprove = (ticket, evaluation) => {
    setRequests(prev => prev.map(item => 
      item.id === ticket.id ? { ...item, status: 'APPROVED', evaluation } : item
    ));
    setIsApproveOpen(false);
    setSelectedTicket(null);
  };

  const handleConfirmReject = (ticket, reason) => {
    setRequests(prev => prev.map(item => 
      item.id === ticket.id ? { ...item, status: 'REJECTED', rejectReason: reason } : item
    ));
    setIsRejectOpen(false);
    setSelectedTicket(null);
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key !== key) return null;
    return <span className="sort-arrow-white">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
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
            Danh sách yêu cầu nghiệm thu
          </h2>

          {/* Thanh lọc + Nút Xuất Excel */}
          <div className="filter-bar-container">
            <div className="filter-group">
              <label>XÁC NHẬN NGƯỜI DÙNG</label>
              <select 
                className="filter-control"
                value={selectedUserConfirmFilter}
                onChange={(e) => { setSelectedUserConfirmFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">-- Tất cả trạng thái --</option>
                <option value="YES">Đã xác nhận (Có)</option>
                <option value="NO">Chưa xác nhận (Không)</option>
              </select>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              <ExportExcelButton 
                data={processedRequests} 
                fileName="Danh_Sach_Nghiem_Thu"
                tableTitle="DANH SÁCH YÊU CẦU NGHIỆM THU"
                columns={ACCEPTANCE_EXCEL_COLUMNS}
              />
            </div>
          </div>

          {/* Bảng dữ liệu */}
          <div className="frame-33-table-wrapper">
            <table className="tech-requests-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>STT</th>
                  
                  <th className="sortable-th col-device-code" onClick={() => handleSort('deviceCode')}>
                    <div className="th-content">Mã TB {renderSortArrow('deviceCode')}</div>
                  </th>
                  <th className="sortable-th col-device-name" onClick={() => handleSort('deviceName')}>
                    <div className="th-content">Tên Thiết Bị {renderSortArrow('deviceName')}</div>
                  </th>

                  <th className="sortable-th col-employee-name" onClick={() => handleSort('employeeName')}>
                    <div className="th-content">Nhân viên gửi {renderSortArrow('employeeName')}</div>
                  </th>

                  <th className="col-acceptance-content">Nội dung nghiệm thu</th>

                  <th className="sortable-th" onClick={() => handleSort('userConfirmation')}>
                    <div className="th-content">Xác nhận ND {renderSortArrow('userConfirmation')}</div>
                  </th>

                  <th className="sortable-th" onClick={() => handleSort('createdAt')}>
                    <div className="th-content">Thời gian gửi {renderSortArrow('createdAt')}</div>
                  </th>

                  <th className="sortable-th" onClick={() => handleSort('estimatedCost')}>
                    <div className="th-content">Chi phí {renderSortArrow('estimatedCost')}</div>
                  </th>

                  <th>Quản lý</th>
                  
                  <th className="col-evaluation">Đánh giá / Lý do từ chối</th>
                  
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-table-msg">Không có dữ liệu nghiệm thu</td>
                  </tr>
                ) : (
                  paginatedRequests.map((item, index) => {
                    const isExpanded = expandedId === item.id;
                    const isReasonExpanded = expandedReasonId === item.id;

                    return (
                      <tr key={item.id || index}>
                        <td className="text-center">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        
                        <td className="text-center">
                          <span className="device-code-badge">{item.deviceCode}</span>
                        </td>

                        <td className="font-bold">{item.deviceName}</td>

                        <td className="font-bold text-nowrap">{item.employeeName || '-'}</td>

                        <td>
                          <div className="request-content-box">
                            <div className={`content-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
                              <p><strong>Lỗi:</strong> {item.errorDescription}</p>
                              <p><strong>Phương án:</strong> {item.solution}</p>
                              <p><strong>Linh kiện:</strong> {item.usedComponents}</p>
                            </div>
                            <button 
                              type="button" 
                              className="btn-toggle-detail"
                              onClick={() => toggleExpand(item.id)}
                            >
                              {isExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                            </button>
                          </div>
                        </td>

                        <td className="text-center">
                          <span className={`confirm-badge ${item.userConfirmation ? 'confirm-yes' : 'confirm-no'}`}>
                            {item.userConfirmation ? 'Đã xác nhận' : 'Chưa xác nhận'}
                          </span>
                        </td>

                        <td className="text-center text-nowrap">{item.createdAt || '-'}</td>

                        <td className="text-right font-bold text-primary text-nowrap">
                          {item.estimatedCost ? `${item.estimatedCost.toLocaleString('vi-VN')} đ` : '0 đ'}
                        </td>

                        <td className="text-nowrap">{item.managerName || '-'}</td>

                        <td>
                          {item.status === 'APPROVED' && item.evaluation ? (
                            <div className="request-content-box">
                              <div className={`content-text ${isReasonExpanded ? 'expanded' : 'collapsed'}`}>
                                <p className="text-success"><strong>Đánh giá:</strong> {item.evaluation}</p>
                              </div>
                              <button 
                                type="button" 
                                className="btn-toggle-detail"
                                onClick={() => toggleExpandReason(item.id)}
                              >
                                {isReasonExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                              </button>
                            </div>
                          ) : item.status === 'REJECTED' && item.rejectReason ? (
                            <div className="request-content-box">
                              <div className={`content-text ${isReasonExpanded ? 'expanded' : 'collapsed'}`}>
                                <p className="text-danger"><strong>Lý do từ chối:</strong> {item.rejectReason}</p>
                              </div>
                              <button 
                                type="button" 
                                className="btn-toggle-detail"
                                onClick={() => toggleExpandReason(item.id)}
                              >
                                {isReasonExpanded ? '▲ Thu gọn' : '▼ Xem chi tiết'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-muted">-</div>
                          )}
                        </td>

                        <td className="text-center">
                          {item.status === 'APPROVED' ? (
                            <span className="badge-accepted">Đã duyệt</span>
                          ) : item.status === 'REJECTED' ? (
                            <span className="badge-rejected">Đã từ chối</span>
                          ) : (
                            <div className="action-btn-group">
                              <button 
                                type="button" 
                                className="btn-action btn-approve"
                                onClick={() => handleOpenApprove(item)}
                              >
                                Duyệt
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

          {/* Phân trang */}
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />

          {/* Modals */}
          {isApproveOpen && (
            <ApproveModal 
              isOpen={isApproveOpen}
              onClose={() => setIsApproveOpen(false)}
              onSubmit={handleConfirmApprove}
              ticketData={selectedTicket}
            />
          )}

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