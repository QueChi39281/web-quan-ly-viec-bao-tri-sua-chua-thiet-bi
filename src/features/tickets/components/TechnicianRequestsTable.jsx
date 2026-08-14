import React from 'react';
import { REQUEST_TYPES } from '../../../constants/technicianRequests';

export default function TechnicianRequestsTable({ 
  requests = [], 
  expandedId, 
  toggleExpand, 
  handleAccept, 
  handleOpenReject,
  sortConfig = { key: 'createdAt', direction: 'desc' },
  onSort,
  startIndex = 0
}) {
  const renderSortArrow = (columnKey) => {
    if (sortConfig.key !== columnKey) return <span className="sort-arrow inactive">▲▼</span>;
    return <span className="sort-arrow active">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // Xử lý mã thiết bị hỗ trợ cả dạng Chuỗi và Mảng
  const renderDeviceCode = (item) => {
    const rawCodes = item.deviceCodes || item.deviceCode;
    if (Array.isArray(rawCodes)) {
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {rawCodes.map((code, idx) => (
            <span key={idx} className="device-code-tag">{code}</span>
          ))}
        </div>
      );
    }
    return <span className="device-code-tag">{rawCodes || '-'}</span>;
  };

  return (
    <div className="table-scroll-container">
      <table className="tech-requests-table">
        <thead>
          <tr>
            <th>STT</th>
            <th className="sortable-th" onClick={() => onSort('type')}>
              <div className="th-content">Loại yêu cầu {renderSortArrow('type')}</div>
            </th>
            <th className="sortable-th" onClick={() => onSort('deviceCode')}>
              <div className="th-content">Mã TB {renderSortArrow('deviceCode')}</div>
            </th>
            <th className="sortable-th" onClick={() => onSort('employeeName')}>
              <div className="th-content">Nhân viên {renderSortArrow('employeeName')}</div>
            </th>
            <th>Nội dung yêu cầu</th>
            <th className="sortable-th" onClick={() => onSort('createdAt')}>
              <div className="th-content">Thời gian gửi {renderSortArrow('createdAt')}</div>
            </th>
            <th className="sortable-th" onClick={() => onSort('estimatedCost')}>
              <div className="th-content">Dự toán {renderSortArrow('estimatedCost')}</div>
            </th>
            <th>Quản lý</th>
            <th>Lý do từ chối</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="10" className="empty-table-msg">Không tìm thấy yêu cầu nào.</td>
            </tr>
          ) : (
            requests.map((item, index) => {
              const isExpanded = expandedId === item.id;
              const typeConfig = REQUEST_TYPES?.[item.type] || {};

              return (
                <tr key={item.id || index}>
                  <td className="text-center">{startIndex + index + 1}</td>
                  <td className="text-center">
                    {/* Đã cập nhật áp dụng màu động trực tiếp từ REQUEST_TYPES */}
                    <span 
                      className="request-type-badge"
                      style={{
                        color: typeConfig.color || '#333333',
                        backgroundColor: typeConfig.bg || '#f1f5f9',
                        borderColor: typeConfig.color ? `${typeConfig.color}40` : '#cbd5e1'
                      }}
                    >
                      {typeConfig.label || item.type || '-'}
                    </span>
                  </td>
                  <td className="text-center">
                    {renderDeviceCode(item)}
                  </td>
                  <td className="font-bold">{item.employeeName || '-'}</td>
                  <td>
                    <div className="request-content-box">
                      <p className={`content-text ${!isExpanded ? 'collapsed' : ''}`}>
                        {item.content || '-'}
                      </p>
                      {item.content && item.content.length > 50 && (
                        <button 
                          type="button"
                          className="btn-toggle-detail" 
                          onClick={() => toggleExpand(item.id)}
                        >
                          {isExpanded ? 'Thu gọn ▲' : 'Xem chi tiết ▼'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="text-center">{formatDate(item.createdAt)}</td>
                  <td className="text-right font-bold text-primary">
                    {typeof item.estimatedCost === 'number'
                      ? `${item.estimatedCost.toLocaleString('vi-VN')} đ`
                      : (item.estimatedCost || '-')}
                  </td>
                  <td>{item.managerName || '-'}</td>
                  <td className="reject-reason-cell text-danger">
                    {item.status === 'REJECTED' ? (item.rejectReason || 'Không có lý do') : '-'}
                  </td>
                  <td className="text-center">
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
  );
}