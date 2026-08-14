import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AutoScheduleModal from './components/AutoScheduleModal';
import MaintenanceRow from './components/MaintenanceRow';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import { 
  DEVICE_OPTIONS, 
  STAFF_OPTIONS, 
  SUPPLY_SUGGESTIONS 
} from '../../constants/maintenance';
import { getInitialMaintenanceRows } from '../../constants/maintenanceData';
import './MaintenancePlanPage.css';

const ITEMS_PER_PAGE = 20;

const INITIAL_STAFF_LIST = (STAFF_OPTIONS || []).map((name, index) => ({
  id: `ST-${index + 1}`,
  staffId: `ST-${index + 1}`,
  name,
  status: index % 3 === 0 ? 'Đang bận' : index % 5 === 0 ? 'Nghỉ phép' : 'Sẵn sàng'
}));

const DEFAULT_FILTER = {
  deviceCode: '',
  deviceType: '',
  status: '',
  actionType: '',
  staff: '',
  fromDate: '',
  toDate: ''
};

export default function MaintenancePlanPage() {
  const location = useLocation();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [availableStaffs] = useState(INITIAL_STAFF_LIST);

  const [rows, setRows] = useState(() => {
    const rawData = getInitialMaintenanceRows(todayStr);
    return rawData.map(item => ({
      ...item,
      deviceCode: Array.isArray(item.deviceCodes) ? item.deviceCodes[0] || '' : (item.deviceCode || ''),
      assignedStaffs: item.assignedStaffs || (item.staff ? [{ id: 'ST-1', name: item.staff, status: 'Sẵn sàng' }] : [])
    }));
  });

  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  const [filterForm, setFilterForm] = useState(DEFAULT_FILTER);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTER);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // 1. Cấu hình Excel Columns
  const excelColumns = useMemo(() => [
    { header: 'Loại thiết bị', key: 'deviceType', align: 'left' },
    { header: 'Mã thiết bị', key: 'deviceCode', align: 'center' },
    { header: 'Trạng thái TB', key: 'status', align: 'center' },
    { header: 'Hành động', key: 'actionType', align: 'center' },
    { header: 'Nội dung bảo trì', key: 'content', align: 'left' },
    { 
      header: 'Vật tư', 
      key: 'supplies', 
      align: 'left',
      formatter: (val) => Array.isArray(val) 
        ? val.filter(s => s.name).map(s => `${s.name} (SL: ${s.quantity})`).join('; ') 
        : val 
    },
    { 
      header: 'Kinh phí (VNĐ)', 
      key: 'cost', 
      align: 'right',
      formatter: (val) => typeof val === 'number' ? val.toLocaleString('vi-VN') : val 
    },
    { 
      header: 'Nhân viên', 
      key: 'assignedStaffs', 
      align: 'left',
      formatter: (val) => Array.isArray(val) ? val.map(s => s.name).join(', ') : '-'
    },
    { 
      header: 'Thời gian thực hiện', 
      key: 'startDate', 
      align: 'center',
      formatter: (val, item) => {
        if (item.startDate && item.endDate) return `${item.startDate} - ${item.endDate}`;
        return item.startDate || item.endDate || '-';
      }
    }
  ], []);

  // 2. Nhận dữ liệu từ location state
  useEffect(() => {
    if (!location.state) return;

    if (location.state.fromApproval) {
      const { deviceType, deviceCode, reason } = location.state;
      const newId = Date.now();
      const approvedRow = {
        id: newId,
        selected: false,
        deviceType: deviceType || '',
        deviceCode: deviceCode || '',
        status: 'Cần sửa chữa',
        actionType: 'Sửa chữa',
        content: reason ? `Sửa chữa sự cố: ${reason}` : 'Thực hiện sửa chữa theo yêu cầu đã duyệt',
        supplies: [{ name: '', quantity: 1, price: 0 }],
        cost: 0,
        assignedStaffs: [],
        startDate: todayStr,
        endDate: todayStr,
        autoInterval: null
      };
      setRows(prev => [approvedRow, ...prev]);
      setEditingRowId(newId);
    }

    if (location.state.requestData) {
      const { deviceCode, content, estimatedCost, employeeName } = location.state.requestData;
      const newId = Date.now();

      let matchedDeviceType = '';
      if (deviceCode) {
        if (deviceCode.startsWith('TB')) matchedDeviceType = 'Máy nén khí Piston';
        else if (deviceCode.startsWith('PG')) matchedDeviceType = 'Máy phát điện Cummins';
      }

      const assignedStaffs = employeeName 
        ? [{ id: `ST-${Date.now()}`, name: employeeName, status: 'Sẵn sàng' }] 
        : [];

      const newRowFromRequest = {
        id: newId,
        selected: false,
        deviceType: matchedDeviceType,
        deviceCode: deviceCode || '',
        status: 'Cần sửa chữa',
        actionType: 'Sửa chữa',
        content: content ? `[Yêu cầu từ ${employeeName || 'KTV'}]: ${content}` : '',
        supplies: [{ name: '', quantity: 1, price: 0 }],
        cost: estimatedCost || 0,
        assignedStaffs,
        startDate: todayStr,
        endDate: todayStr,
        autoInterval: null
      };

      setRows(prev => [newRowFromRequest, ...prev]);
      setEditingRowId(newId);
    }
  }, [location.state, todayStr]);

  // Handle click outside action dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-wrapper')) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prevent refresh/leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (editingRowId !== null) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingRowId]);

  const checkUnsavedChanges = useCallback(() => {
    if (editingRowId !== null) {
      return window.confirm("Bạn có thay đổi chưa lưu! Bạn có muốn bỏ qua thay đổi và tiếp tục không?");
    }
    return true;
  }, [editingRowId]);

  // Handlers Lọc & Phân trang
  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    if (checkUnsavedChanges()) {
      if (backupRow) {
        setRows(prev => prev.map(r => r.id === backupRow.id ? backupRow : r));
      }
      setEditingRowId(null);
      setBackupRow(null);
      setCurrentPage(newPage);
    }
  };

  const handleFilterInputChange = (field, value) => {
    setFilterForm(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    if (!checkUnsavedChanges()) return;
    setAppliedFilters({ ...filterForm });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    if (!checkUnsavedChanges()) return;
    setFilterForm(DEFAULT_FILTER);
    setAppliedFilters(DEFAULT_FILTER);
    setCurrentPage(1);
  };

  // Filtered & Sorted Rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (appliedFilters.deviceCode.trim()) {
        const queryCode = appliedFilters.deviceCode.toLowerCase().trim();
        if (!row.deviceCode || !row.deviceCode.toLowerCase().includes(queryCode)) return false;
      }
      if (appliedFilters.deviceType && row.deviceType !== appliedFilters.deviceType) return false;
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      if (appliedFilters.actionType && row.actionType !== appliedFilters.actionType) return false;
      if (appliedFilters.staff) {
        const hasStaff = row.assignedStaffs?.some(s => s.name === appliedFilters.staff);
        if (!hasStaff) return false;
      }
      if (appliedFilters.fromDate && (!row.startDate || row.startDate < appliedFilters.fromDate)) return false;
      if (appliedFilters.toDate && (!row.endDate || row.endDate > appliedFilters.toDate)) return false;

      return true;
    });
  }, [rows, appliedFilters]);

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'assignedStaffs') {
        aVal = (aVal || []).map(s => s.name).join(', ');
        bVal = (bVal || []).map(s => s.name).join(', ');
      } else if (sortConfig.key === 'supplies') {
        aVal = (aVal || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
        bVal = (bVal || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    }
    return <span className="sort-arrow inactive">▲▼</span>;
  };

  // Pagination bounds
  const totalItems = sortedRows.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  // Row Selection logic
  const selectAll = useMemo(() => {
    if (filteredRows.length === 0) return false;
    return filteredRows.every(r => r.selected);
  }, [filteredRows]);

  const handleSelectAll = useCallback(() => {
    const targetState = !selectAll;
    const filteredIds = new Set(filteredRows.map(r => r.id));
    setRows(prev => prev.map(r => filteredIds.has(r.id) ? { ...r, selected: targetState } : r));
  }, [selectAll, filteredRows]);

  const handleSelectRow = useCallback((id) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  }, []);

  // Batch actions
  const handleAssignDefaultStaff = () => {
    const selectedCount = rows.filter(r => r.selected).length;
    if (selectedCount === 0) {
      alert("Vui lòng chọn dòng cần gán nhân viên!");
      return;
    }
    const defaultStaff = availableStaffs[0];
    setRows(prev => prev.map(r => r.selected ? { 
      ...r, 
      assignedStaffs: defaultStaff ? [defaultStaff] : [] 
    } : r));
  };

  const handleEditSelectedRow = () => {
    const selectedRows = rows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      alert("Vui lòng chọn 1 dòng cần sửa!");
      return;
    }
    if (selectedRows.length > 1) {
      alert("Chỉ được phép chỉnh sửa mỗi lần 1 dòng!");
      return;
    }

    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const targetRow = selectedRows[0];
    setEditingRowId(targetRow.id);
    setBackupRow(JSON.parse(JSON.stringify(targetRow)));
  };

  const handleAddRow = () => {
    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const newId = Date.now();
    const newRow = {
      id: newId,
      selected: false,
      deviceType: '',
      deviceCode: '',
      status: 'Đang hoạt động',
      actionType: 'Bảo trì',
      content: '',
      supplies: [{ name: '', quantity: 1, price: 0 }],
      cost: 0,
      assignedStaffs: [],
      startDate: todayStr,
      endDate: todayStr,
      autoInterval: null
    };

    setRows(prev => [newRow, ...prev]);
    setEditingRowId(newId);
    setBackupRow(null);
  };

  const handleDeleteSelectedRows = () => {
    const selectedCount = rows.filter(r => r.selected).length;
    if (selectedCount === 0) {
      alert("Vui lòng chọn ít nhất một dòng để xóa!");
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedCount} lịch đã chọn?`)) {
      setRows(prev => prev.filter(r => !r.selected));
      setEditingRowId(null);
      setBackupRow(null);
    }
  };

  // Row Change Handlers (Memoized)
  const handleSelectDeviceType = useCallback((rowId, deviceName) => {
    let defaultCode = '';
    if (deviceName === 'Máy nén khí Piston') defaultCode = 'TB-9981';
    else if (deviceName === 'Máy phát điện Cummins') defaultCode = 'PG-001';
    else if (deviceName) defaultCode = 'TB-DEFAULT-01';

    setRows(prev => prev.map(r => r.id === rowId ? {
      ...r,
      deviceType: deviceName,
      deviceCode: defaultCode
    } : r));
  }, []);

  const handleRowChange = useCallback((rowId, field, value) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r));
  }, []);

  const handleToggleStaff = useCallback((rowId, staffObj) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        const currentStaffs = r.assignedStaffs || [];
        const exists = currentStaffs.some(
          s => (s.staffId || s.id) === (staffObj.id || staffObj.staffId)
        );

        const updatedStaffs = exists
          ? currentStaffs.filter(s => (s.staffId || s.id) !== (staffObj.id || staffObj.staffId))
          : [...currentStaffs, staffObj];

        return { ...r, assignedStaffs: updatedStaffs };
      }
      return r;
    }));
  }, []);

  const handleSupplyChange = useCallback((rowId, supplyIdx, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        const updatedSupplies = [...r.supplies];
        if (field === 'name') {
          updatedSupplies[supplyIdx].name = val;
          const found = SUPPLY_SUGGESTIONS.find(s => s.name === val);
          if (found) updatedSupplies[supplyIdx].price = found.price;
        } else if (field === 'quantity') {
          updatedSupplies[supplyIdx].quantity = Number(val) || 0;
        }
        const totalCost = updatedSupplies.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        return { ...r, supplies: updatedSupplies, cost: totalCost };
      }
      return r;
    }));
  }, []);

  const handleAddSupplyItem = useCallback((rowId) => {
    setRows(prev => prev.map(r => r.id === rowId ? {
      ...r,
      supplies: [...r.supplies, { name: '', quantity: 1, price: 0 }]
    } : r));
  }, []);

  const handleRemoveSupplyItem = useCallback((rowId, supplyIdx) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        const updatedSupplies = r.supplies.filter((_, idx) => idx !== supplyIdx);
        const totalCost = updatedSupplies.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        return { ...r, supplies: updatedSupplies, cost: totalCost };
      }
      return r;
    }));
  }, []);

  const handleApplyAutoSchedule = (autoData) => {
    const selectedCount = rows.filter(r => r.selected).length;
    if (selectedCount === 0) {
      alert("Vui lòng chọn dòng cần đặt lịch tự động!");
      return;
    }

    setRows(prev => prev.map(r => {
      if (r.selected) {
        return {
          ...r,
          startDate: autoData.startDate,
          endDate: autoData.endDate || autoData.startDate,
          autoInterval: autoData.intervalMonths
        };
      }
      return r;
    }));
    alert("Đã áp dụng Đặt lịch bảo trì tự động thành công!");
  };

  const handleDateChange = useCallback((rowId, field, val) => {
    setRows(prev => prev.map(r => {
      if (r.id === rowId) {
        let updatedStart = r.startDate;
        let updatedEnd = r.endDate;

        if (field === 'startDate') {
          updatedStart = val;
          if (updatedEnd && updatedEnd < val) updatedEnd = val;
        } else if (field === 'endDate') {
          if (updatedStart && val < updatedStart) {
            alert("Ngày 'Đến' không được nhỏ hơn ngày 'Từ'!");
            return r;
          }
          updatedEnd = val;
        }
        return { ...r, startDate: updatedStart, endDate: updatedEnd };
      }
      return r;
    }));
  }, []);

  const handleSavePage = () => {
    if (editingRowId === null) {
      alert("Không có dữ liệu nào đang trong trạng thái chỉnh sửa.");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn lưu nội dung này không?")) {
      setEditingRowId(null);
      setBackupRow(null);
      alert("Đã lưu thành công!");
    }
  };

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>

      <div className="page-body-wrapper">
        <ManagerSidebar />

        <main className="main-content-container">
          <h2 className="plan-page-title">Kế hoạch bảo trì/sửa chữa thiết bị</h2>

          {/* THANH BỘ LỌC DỮ LIỆU */}
          <div className="filter-bar-container">
            <div className="filter-group">
              <label>Loại thiết bị:</label>
              <select 
                className="filter-control"
                value={filterForm.deviceType}
                onChange={(e) => handleFilterInputChange('deviceType', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                {DEVICE_OPTIONS.map((dev, i) => <option key={i} value={dev}>{dev}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>Mã thiết bị:</label>
              <input 
                type="text"
                className="filter-control"
                placeholder="Nhập mã (vd: TB-9981)..."
                value={filterForm.deviceCode}
                onChange={(e) => handleFilterInputChange('deviceCode', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>

            <div className="filter-group">
              <label>Trạng thái TB:</label>
              <select 
                className="filter-control"
                value={filterForm.status}
                onChange={(e) => handleFilterInputChange('status', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Cần sửa chữa">Cần sửa chữa</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Hành động:</label>
              <select 
                className="filter-control"
                value={filterForm.actionType}
                onChange={(e) => handleFilterInputChange('actionType', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="Bảo trì">Bảo trì</option>
                <option value="Sửa chữa">Sửa chữa</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Nhân viên:</label>
              <select 
                className="filter-control"
                value={filterForm.staff}
                onChange={(e) => handleFilterInputChange('staff', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                {STAFF_OPTIONS.map((st, i) => <option key={i} value={st}>{st}</option>)}
              </select>
            </div>

            <div className="filter-group filter-date-range">
              <label>Thời gian thực hiện:</label>
              <div className="filter-date-inputs">
                <input 
                  type="date"
                  className="filter-control date-control"
                  value={filterForm.fromDate}
                  onChange={(e) => handleFilterInputChange('fromDate', e.target.value)}
                />
                <span>-</span>
                <input 
                  type="date"
                  className="filter-control date-control"
                  value={filterForm.toDate}
                  onChange={(e) => handleFilterInputChange('toDate', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions-group">
              <button type="button" className="btn-apply-filter" onClick={handleApplyFilter}>
                🔍 Lọc
              </button>
              <button type="button" className="btn-reset-filter" onClick={handleResetFilters}>
                Đặt lại
              </button>
            </div>
          </div>

          {/* BAR HÀNH ĐỘNG, XUẤT EXCEL VÀ LƯU */}
          <div className="top-action-bar">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <ExportExcelButton 
                data={sortedRows}
                fileName="Ke_hoach_bao_tri_thiet_bi"
                tableTitle="DANH SÁCH KẾ HOẠCH BẢO TRÌ THIẾT BỊ"
                columns={excelColumns}
              />
              <div className="dropdown-action-wrapper">
                <button 
                  className="btn-action-trigger"
                  onClick={() => setShowActionMenu(!showActionMenu)}
                >
                  Hành động ▾
                </button>

                {showActionMenu && (
                  <div className="frame-38-menu">
                    <div className="menu-option" onClick={() => { 
                      handleEditSelectedRow();
                      setShowActionMenu(false);
                    }}>
                      ✏️ Sửa dòng được chọn
                    </div>
                    <div className="menu-option" onClick={() => { 
                      setIsAutoModalOpen(true); 
                      setShowActionMenu(false);
                    }}>
                      🔄 Đặt lịch bảo trì tự động
                    </div>
                    <div className="menu-option" onClick={() => {
                      handleAssignDefaultStaff();
                      setShowActionMenu(false);
                    }}>
                      👤 Gán nhân viên mặc định
                    </div>
                    <div className="menu-option text-danger" onClick={() => { 
                      handleDeleteSelectedRows(); 
                      setShowActionMenu(false); 
                    }}>
                      🗑️ Xóa lịch bảo trì
                    </div>
                    <div className="menu-option" onClick={() => { 
                      handleAddRow(); 
                      setShowActionMenu(false); 
                    }}>
                      ➕ Tạo thêm lịch bảo trì
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button 
              className={`btn-save-main ${editingRowId !== null ? 'active-save' : ''}`} 
              onClick={handleSavePage}
            >
              Lưu
            </button>
          </div>

          {/* BẢNG DỮ LIỆU */}
          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th style={{ width: '60px' }} onClick={() => handleSort('id')} className="sortable-th">
                    <div className="th-content">STT {renderSortArrow('id')}</div>
                  </th>
                  <th style={{ width: '190px' }} onClick={() => handleSort('deviceType')} className="sortable-th">
                    <div className="th-content">Loại thiết bị {renderSortArrow('deviceType')}</div>
                  </th>
                  <th style={{ width: '150px' }} onClick={() => handleSort('deviceCode')} className="sortable-th">
                    <div className="th-content">Mã thiết bị {renderSortArrow('deviceCode')}</div>
                  </th>
                  <th style={{ width: '130px' }} onClick={() => handleSort('status')} className="sortable-th">
                    <div className="th-content">Trạng thái TB {renderSortArrow('status')}</div>
                  </th>
                  <th style={{ width: '120px' }} onClick={() => handleSort('actionType')} className="sortable-th">
                    <div className="th-content">Hành động {renderSortArrow('actionType')}</div>
                  </th>
                  <th style={{ width: '260px' }} onClick={() => handleSort('content')} className="sortable-th">
                    <div className="th-content">Nội dung bảo trì {renderSortArrow('content')}</div>
                  </th>
                  <th style={{ width: '240px' }} onClick={() => handleSort('supplies')} className="sortable-th">
                    <div className="th-content">Số lượng vật tư {renderSortArrow('supplies')}</div>
                  </th>
                  <th style={{ width: '130px' }} onClick={() => handleSort('cost')} className="sortable-th">
                    <div className="th-content">Kinh phí (đồng) {renderSortArrow('cost')}</div>
                  </th>
                  <th style={{ width: '220px' }} onClick={() => handleSort('assignedStaffs')} className="sortable-th">
                    <div className="th-content">Nhân viên thực hiện {renderSortArrow('assignedStaffs')}</div>
                  </th>
                  <th style={{ width: '210px' }} onClick={() => handleSort('startDate')} className="sortable-th">
                    <div className="th-content">Thời gian thực hiện {renderSortArrow('startDate')}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-table-msg">
                      Không tìm thấy bản ghi phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, index) => (
                    <MaintenanceRow
                      key={row.id}
                      row={row}
                      index={index}
                      startIndex={startIndex}
                      todayStr={todayStr}
                      isEditing={editingRowId === row.id}
                      availableStaffs={availableStaffs}
                      handleSelectRow={handleSelectRow}
                      handleSelectDeviceType={handleSelectDeviceType}
                      handleRowChange={handleRowChange}
                      handleSupplyChange={handleSupplyChange}
                      handleAddSupplyItem={handleAddSupplyItem}
                      handleRemoveSupplyItem={handleRemoveSupplyItem}
                      handleDateChange={handleDateChange}
                      onToggleStaff={handleToggleStaff}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PHÂN TRANG */}
          <div className="pagination-wrapper">
            <div className="record-counter">
              Hiển thị <strong>{totalItems === 0 ? 0 : startIndex + 1} - {endIndex}</strong> / Tổng số <strong>{totalItems}</strong> bản ghi
            </div>

            <div className="modern-pagination">
              <button 
                type="button" 
                className="page-nav-btn"
                onClick={() => handlePageChange(1)} 
                disabled={currentPage === 1}
                title="Trang đầu"
              >
                ««
              </button>
              <button 
                type="button" 
                className="page-nav-btn"
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} 
                disabled={currentPage === 1}
                title="Trang trước"
              >
                ‹
              </button>
              <div className="page-numbers-group">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button 
                type="button" 
                className="page-nav-btn"
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} 
                disabled={currentPage === totalPages}
                title="Trang sau"
              >
                ›
              </button>
              <button 
                type="button" 
                className="page-nav-btn"
                onClick={() => handlePageChange(totalPages)} 
                disabled={currentPage === totalPages}
                title="Trang cuối"
              >
                »»
              </button>
            </div>
          </div>

          <AutoScheduleModal 
            isOpen={isAutoModalOpen}
            onClose={() => setIsAutoModalOpen(false)}
            onApply={handleApplyAutoSchedule}
          />
        </main>
      </div>
    </div>
  );
}