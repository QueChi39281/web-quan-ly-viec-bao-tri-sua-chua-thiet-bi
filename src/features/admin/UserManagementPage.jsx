import React, { useMemo, useState } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import './UserManagementPage.css';

const ITEMS_PER_PAGE = 10;

export const INITIAL_SYSTEM_LOGS = [
  {
    id: 1001,
    actor_employee_id: 'EMP-001',
    actor_name: 'Nguyễn Văn A',
    action: 'INSERT',
    service_name: 'userService',
    table_name: 'users',
    record_id: 'USR-1001',
    old_value: null,
    new_value: { username: 'nguyenvana', email: 'a@company.com', status: 'active' },
    created_at: '2026-08-17T08:10:00Z'
  },
  {
    id: 1002,
    actor_employee_id: 'EMP-004',
    actor_name: 'Trần Thị B',
    action: 'UPDATE',
    service_name: 'assetService',
    table_name: 'assets',
    record_id: 'AST-204',
    old_value: { status: 'maintenance', assigned_to: 'EMP-009' },
    new_value: { status: 'available', assigned_to: null },
    created_at: '2026-08-17T09:15:00Z'
  },
  {
    id: 1003,
    actor_employee_id: 'EMP-020',
    actor_name: 'Lê Văn C',
    action: 'DELETE',
    service_name: 'ticketService',
    table_name: 'tickets',
    record_id: 'TCK-775',
    old_value: { id: 'TCK-775', priority: 'high', status: 'pending' },
    new_value: null,
    created_at: '2026-08-17T10:40:00Z'
  },
  {
    id: 1004,
    actor_employee_id: 'EMP-010',
    actor_name: 'Phạm Nam D',
    action: 'UPDATE',
    service_name: 'maintenanceService',
    table_name: 'maintenance_requests',
    record_id: 'MR-312',
    old_value: { technician_id: 'EMP-005', status: 'assigned' },
    new_value: { technician_id: 'EMP-011', status: 'in_progress' },
    created_at: '2026-08-17T11:05:00Z'
  },
  {
    id: 1005,
    actor_employee_id: 'EMP-030',
    actor_name: 'Đỗ Thị E',
    action: 'INSERT',
    service_name: 'supplierService',
    table_name: 'supplies',
    record_id: 'SUP-882',
    old_value: null,
    new_value: { name: 'Cáp mạng Cat6', quantity: 48, unit: 'met' },
    created_at: '2026-08-17T12:22:00Z'
  }
];

const formatJson = (value) => {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

export default function UserManagementPage() {
  const [logs] = useState(INITIAL_SYSTEM_LOGS);
  const [filterForm, setFilterForm] = useState({
    actor_employee_id: '',
    actor_name: '',
    action: '',
    service_name: '',
    table_name: '',
    record_id: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    actor_employee_id: '',
    actor_name: '',
    action: '',
    service_name: '',
    table_name: '',
    record_id: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const excelColumns = useMemo(() => [
    { header: 'ID Log', key: 'id', align: 'center' },
    { header: 'actor_employee_id', key: 'actor_employee_id', align: 'left' },
    { header: 'actor_name', key: 'actor_name', align: 'left' },
    { header: 'action', key: 'action', align: 'left' },
    { header: 'service_name', key: 'service_name', align: 'left' },
    { header: 'table_name', key: 'table_name', align: 'left' },
    { header: 'record_id', key: 'record_id', align: 'left' },
    { header: 'old_value JSONB', key: 'old_value', align: 'left', formatter: formatJson },
    { header: 'new_value JSONB', key: 'new_value', align: 'left', formatter: formatJson },
    { header: 'created_at', key: 'created_at', align: 'left' }
  ], []);

  const handleFilterInputChange = (field, value) => {
    setFilterForm(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filterForm });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    const empty = {
      actor_employee_id: '',
      actor_name: '',
      action: '',
      service_name: '',
      table_name: '',
      record_id: ''
    };
    setFilterForm(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const actorEmployee = (log.actor_employee_id || '').toString().toLowerCase();
      const actorName = (log.actor_name || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const serviceName = (log.service_name || '').toLowerCase();
      const tableName = (log.table_name || '').toLowerCase();
      const recordId = (log.record_id || '').toString().toLowerCase();

      if (appliedFilters.actor_employee_id && !actorEmployee.includes(appliedFilters.actor_employee_id.trim().toLowerCase())) return false;
      if (appliedFilters.actor_name && !actorName.includes(appliedFilters.actor_name.trim().toLowerCase())) return false;
      if (appliedFilters.action && !action.includes(appliedFilters.action.trim().toLowerCase())) return false;
      if (appliedFilters.service_name && !serviceName.includes(appliedFilters.service_name.trim().toLowerCase())) return false;
      if (appliedFilters.table_name && !tableName.includes(appliedFilters.table_name.trim().toLowerCase())) return false;
      if (appliedFilters.record_id && !recordId.includes(appliedFilters.record_id.trim().toLowerCase())) return false;
      return true;
    });
  }, [logs, appliedFilters]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      const nextDirection = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction: nextDirection };
    });
  };

  const sortedLogs = useMemo(() => {
    const items = [...filteredLogs];
    if (!sortConfig.key) return items;

    items.sort((a, b) => {
      const left = a[sortConfig.key] ?? '';
      const right = b[sortConfig.key] ?? '';
      const leftValue = typeof left === 'string' ? left.toLowerCase() : String(left).toLowerCase();
      const rightValue = typeof right === 'string' ? right.toLowerCase() : String(right).toLowerCase();

      if (leftValue < rightValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [filteredLogs, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    }
    return <span className="sort-arrow inactive">▲▼</span>;
  };

  const totalItems = sortedLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>

      <div className="page-body-wrapper">
        <ManagerSidebar />

        <main className="main-content-container">
          <h2 className="plan-page-title">Quản lý tài khoản</h2>
          <p style={{ margin: '-10px 0 18px', color: '#52607a', fontWeight: 600 }}>Xem log hệ thống</p>

          <div className="filter-bar-container">
            <div className="filter-group">
              <label>Mã nhân viên:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.actor_employee_id}
                onChange={(e) => handleFilterInputChange('actor_employee_id', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Tên nhân viên:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.actor_name}
                onChange={(e) => handleFilterInputChange('actor_name', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Hành động:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.action}
                onChange={(e) => handleFilterInputChange('action', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Service:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.service_name}
                onChange={(e) => handleFilterInputChange('service_name', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Bảng:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.table_name}
                onChange={(e) => handleFilterInputChange('table_name', e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>ID bản ghi:</label>
              <input
                type="text"
                className="filter-control"
                value={filterForm.record_id}
                onChange={(e) => handleFilterInputChange('record_id', e.target.value)}
              />
            </div>
            <div className="filter-actions-group">
              <button type="button" className="btn-apply-filter" onClick={handleApplyFilter}>🔍 Lọc</button>
              <button type="button" className="btn-reset-filter" onClick={handleResetFilters}>Đặt lại</button>
            </div>
          </div>

          <div className="top-action-bar">
            <ExportExcelButton
              data={sortedLogs}
              fileName="system_logs"
              tableTitle="LOG HỆ THỐNG"
              columns={excelColumns}
            />
          </div>

          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th className="col-stt sortable-th" onClick={() => handleSort('id')}><div className="th-content">ID log {renderSortArrow('id')}</div></th>
                  <th onClick={() => handleSort('actor_employee_id')} className="sortable-th"><div className="th-content">actor_employee_id {renderSortArrow('actor_employee_id')}</div></th>
                  <th onClick={() => handleSort('actor_name')} className="sortable-th"><div className="th-content">actor_name {renderSortArrow('actor_name')}</div></th>
                  <th onClick={() => handleSort('action')} className="sortable-th"><div className="th-content">action {renderSortArrow('action')}</div></th>
                  <th onClick={() => handleSort('service_name')} className="sortable-th"><div className="th-content">service_name {renderSortArrow('service_name')}</div></th>
                  <th onClick={() => handleSort('table_name')} className="sortable-th"><div className="th-content">table_name {renderSortArrow('table_name')}</div></th>
                  <th onClick={() => handleSort('record_id')} className="sortable-th"><div className="th-content">record_id {renderSortArrow('record_id')}</div></th>
                  <th>old_value JSONB</th>
                  <th>new_value JSONB</th>
                  <th onClick={() => handleSort('created_at')} className="sortable-th"><div className="th-content">created_at {renderSortArrow('created_at')}</div></th>
                </tr>
              </thead>
              <tbody>
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-table-msg">Không tìm thấy log phù hợp.</td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.id}</td>
                      <td>{log.actor_employee_id || '-'}</td>
                      <td>{log.actor_name || '-'}</td>
                      <td>{log.action || '-'}</td>
                      <td>{log.service_name || '-'}</td>
                      <td>{log.table_name || '-'}</td>
                      <td>{log.record_id || '-'}</td>
                      <td style={{ maxWidth: '220px', whiteSpace: 'pre-wrap' }}>{formatJson(log.old_value)}</td>
                      <td style={{ maxWidth: '220px', whiteSpace: 'pre-wrap' }}>{formatJson(log.new_value)}</td>
                      <td>{log.created_at || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-wrapper">
            <div className="record-counter">
              Hiển thị <strong>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> / Tổng số <strong>{totalItems}</strong> bản ghi
            </div>

            <div className="modern-pagination">
              <button type="button" className="page-nav-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
              <button type="button" className="page-nav-btn" onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>‹</button>
              <div className="page-numbers-group">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button type="button" className="page-nav-btn" onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>›</button>
              <button type="button" className="page-nav-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»»</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}