import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import AutoScheduleModal from './components/AutoScheduleModal';
import MaintenanceRow from './components/MaintenanceRow';
import FilterBar from './components/FilterBar';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import { maintenanceApi, deviceApi, userApi, getCurrentEmployeeId } from '../../services/api';
import { 
  DEVICE_OPTIONS, 
  STAFF_OPTIONS, 
  SUPPLY_SUGGESTIONS 
} from '../../constants/maintenance';
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

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch maintenance plans from API
  useEffect(() => {
    const fetchMaintenancePlans = async () => {
      try {
        setLoading(true);
        // Lấy danh sách kế hoạch bảo trì từ API thật
        const response = await maintenanceApi.getPlans({ limit: 100 });
        const plansData = Array.isArray(response) ? response : response?.data || [];
        
        // Map dữ liệu từ API sang cấu trúc component
        const plans = plansData.map(item => ({
          id: item.id || item._id,
          selected: false,
          deviceType: item.plan_type === 'repair' ? 'Sửa chữa' : 'Bảo trì',
          deviceCode: item.device_id ? `DEV-${item.device_id}` : 'N/A',
          status: item.actual_end_at ? 'Hoàn thành' : item.actual_start_at ? 'Đang thực hiện' : 'Chờ thực hiện',
          actionType: item.plan_type === 'repair' ? 'Sửa chữa' : 'Bảo trì',
          content: item.description || '',
          supplies: [],
          cost: item.estimated_cost ? Number(item.estimated_cost) : 0,
          assignedStaffs: Array.isArray(item.plan_assignments) 
            ? item.plan_assignments.map(a => ({ id: a.employee_id, name: `EMP-${a.employee_id}`, status: a.availability_status || 'available' }))
            : [],
          startDate: item.planned_start_at ? item.planned_start_at.split('T')[0] : '',
          endDate: item.planned_end_at ? item.planned_end_at.split('T')[0] : '',
          actualStartDate: item.actual_start_at ? item.actual_start_at.split('T')[0] : '',
          actualEndDate: item.actual_end_at ? item.actual_end_at.split('T')[0] : '',
          planId: item.id,
          autoInterval: null
        }));
        setRows(plans);
      } catch (error) {
        console.error('Failed to fetch maintenance plans:', error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMaintenancePlans();
  }, [todayStr]);

  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  const [filterForm, setFilterForm] = useState(DEFAULT_FILTER);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTER);

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // State managing Old/New Comparison Modal
  const [compareModalData, setCompareModalData] = useState(null);

  // 1. Excel Columns Configuration
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

  // 2. Handle Navigation Logic from Request Approval Page
  useEffect(() => {
    if (!location.state?.fromApproval || !location.state?.requestData) return;

    const { deviceCode, deviceStatus, content, estimatedCost, employeeName, type } = location.state.requestData;
    if (!deviceCode) return;

    let matchedDeviceType = '';
    if (deviceCode.startsWith('TB')) matchedDeviceType = 'Máy nén khí Piston';
    else if (deviceCode.startsWith('PG')) matchedDeviceType = 'Máy phát điện Cummins';

    const assignedStaffs = employeeName 
      ? [{ id: `ST-${Date.now()}`, name: employeeName, status: 'Sẵn sàng' }] 
      : [];

    const isUsing = deviceStatus === 'Đang sử dụng' || deviceStatus === 'Đang hoạt động';

    if (isUsing) {
      const newId = Date.now();
      const newRowFromRequest = {
        id: newId,
        selected: false,
        deviceType: matchedDeviceType,
        deviceCode: deviceCode,
        status: type === 'RESCHEDULE' ? 'Đang hoạt động' : 'Cần sửa chữa',
        actionType: type === 'RESCHEDULE' ? 'Bảo trì' : 'Sửa chữa',
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
    } else {
      setRows(prevRows => {
        const latestRow = prevRows.find(r => r.deviceCode === deviceCode);
        setCompareModalData({
          deviceCode,
          deviceType: matchedDeviceType,
          latestRow: latestRow || null,
          newRequestData: {
            content: content ? `[Cập nhật từ ${employeeName || 'KTV'}]: ${content}` : '',
            cost: estimatedCost || 0,
            assignedStaffs
          }
        });
        return prevRows;
      });
    }

    window.history.replaceState({}, document.title);
  }, [location.state, todayStr]);

  // Dropdown Click Outside Listener
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

  // Missing Handler Implementation 1: Auto Schedule Applied
  const handleApplyAutoSchedule = (autoConfig) => {
    const selectedRows = rows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      alert("Vui lòng chọn ít nhất một thiết bị để áp dụng lịch tự động!");
      return;
    }

    setRows(prev => prev.map(row => {
      if (!row.selected) return row;
      return {
        ...row,
        autoInterval: autoConfig?.interval || '1M',
        actionType: 'Bảo trì',
        status: 'Đang hoạt động'
      };
    }));

    setIsAutoModalOpen(false);
    alert(`Đã áp dụng lịch tự động cho ${selectedRows.length} bản ghi!`);
  };

  // Missing Handler Implementation 2: Old vs New Comparison Confirmation
  const handleConfirmUpdateOldRow = (shouldUpdateOld) => {
    if (!compareModalData) return;

    const { deviceCode, deviceType, latestRow, newRequestData } = compareModalData;

    if (shouldUpdateOld && latestRow) {
      setRows(prev => prev.map(row => {
        if (row.id === latestRow.id) {
          return {
            ...row,
            content: newRequestData.content || row.content,
            cost: newRequestData.cost || row.cost,
            assignedStaffs: newRequestData.assignedStaffs.length > 0 ? newRequestData.assignedStaffs : row.assignedStaffs
          };
        }
        return row;
      }));
      setEditingRowId(latestRow.id);
    } else {
      const newId = Date.now();
      const newRow = {
        id: newId,
        selected: false,
        deviceType: deviceType || '',
        deviceCode: deviceCode || '',
        status: 'Đang sử dụng',
        actionType: 'Sửa chữa',
        content: newRequestData?.content || '',
        supplies: [{ name: '', quantity: 1, price: 0 }],
        cost: newRequestData?.cost || 0,
        assignedStaffs: newRequestData?.assignedStaffs || [],
        startDate: todayStr,
        endDate: todayStr,
        autoInterval: null
      };

      setRows(prev => [newRow, ...prev]);
      setEditingRowId(newId);
    }

    setCompareModalData(null);
  };

  // Handlers for Filters & Pagination
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

  // Row Change Handlers
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
        const updatedSupplies = r.supplies.map((sup, idx) => {
          if (idx !== supplyIdx) return sup;

          const updatedItem = { ...sup };
          if (field === 'name') {
            updatedItem.name = val;
            const found = SUPPLY_SUGGESTIONS.find(s => s.name === val);
            if (found) updatedItem.price = found.price;
          } else if (field === 'quantity') {
            updatedItem.quantity = Number(val) || 0;
          }
          return updatedItem;
        });

        const totalCost = updatedSupplies.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
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
        const totalCost = updatedSupplies.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
        return { ...r, supplies: updatedSupplies, cost: totalCost };
      }
      return r;
    }));
  }, []);

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

  const handleSavePage = async () => {
    if (editingRowId === null) {
      alert("Không có dữ liệu nào đang trong trạng thái chỉnh sửa.");
      return;
    }

    const editingRow = rows.find(r => r.id === editingRowId);
    if (!editingRow) {
      alert("Không tìm thấy dòng đang chỉnh sửa!");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn lưu nội dung này không?")) {
      try {
        // Chuẩn bị dữ liệu gửi lên API
        const planData = {
          created_by: parseInt(getCurrentEmployeeId()) || 2,
          device_id: editingRow.deviceCode ? parseInt(editingRow.deviceCode.replace('DEV-', '')) : 1,
          plan_type: editingRow.actionType === 'Sửa chữa' ? 'repair' : 'maintenance',
          description: editingRow.content,
          estimated_cost: editingRow.cost,
          planned_start_at: `${editingRow.startDate}T08:00:00Z`,
          planned_end_at: `${editingRow.endDate}T17:00:00Z`,
          employee_ids: editingRow.assignedStaffs.map(s => parseInt(s.id.replace('EMP-', '')))
        };

        let result;
        if (editingRow.planId) {
          // Update existing plan
          result = await maintenanceApi.updatePlan(editingRow.planId, {
            description: editingRow.content,
            employeesList: editingRow.assignedStaffs.map(s => ({
              employee_id: parseInt(s.id.replace('EMP-', '')),
              availability_status: 'available'
            }))
          });
        } else {
          // Create new plan
          result = await maintenanceApi.createPlan(planData);
        }

        console.log('Save result:', result);
        setEditingRowId(null);
        setBackupRow(null);
        alert("Đã lưu thành công!");
        
        // Refresh data
        const response = await maintenanceApi.getPlans({ limit: 100 });
        const plansData = Array.isArray(response) ? response : response?.data || [];
        const plans = plansData.map(item => ({
          id: item.id || item._id,
          selected: false,
          deviceType: item.plan_type === 'repair' ? 'Sửa chữa' : 'Bảo trì',
          deviceCode: item.device_id ? `DEV-${item.device_id}` : 'N/A',
          status: item.actual_end_at ? 'Hoàn thành' : item.actual_start_at ? 'Đang thực hiện' : 'Chờ thực hiện',
          actionType: item.plan_type === 'repair' ? 'Sửa chữa' : 'Bảo trì',
          content: item.description || '',
          supplies: [],
          cost: item.estimated_cost ? Number(item.estimated_cost) : 0,
          assignedStaffs: Array.isArray(item.plan_assignments) 
            ? item.plan_assignments.map(a => ({ id: a.employee_id, name: `EMP-${a.employee_id}`, status: a.availability_status || 'available' }))
            : [],
          startDate: item.planned_start_at ? item.planned_start_at.split('T')[0] : '',
          endDate: item.planned_end_at ? item.planned_end_at.split('T')[0] : '',
          actualStartDate: item.actual_start_at ? item.actual_start_at.split('T')[0] : '',
          actualEndDate: item.actual_end_at ? item.actual_end_at.split('T')[0] : '',
          planId: item.id,
          autoInterval: null
        }));
        setRows(plans);
      } catch (error) {
        console.error('Error saving plan:', error);
        alert(`Lỗi khi lưu: ${error.message}`);
      }
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

          <FilterBar 
            filterForm={filterForm}
            onInputChange={handleFilterInputChange}
            onApply={handleApplyFilter}
            onReset={handleResetFilters}
          />

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

          {compareModalData && (
            <div className="modal-overlay">
              <div className="modal-compare-card">
                <h3>Xác nhận Cập nhật thông tin Lập kế hoạch</h3>
                <p>Thiết bị <strong>{compareModalData.deviceCode}</strong> đang ở trạng thái không thuộc nhóm hoạt động bình thường. Bạn có muốn cập nhật bản ghi cũ gần nhất bằng nội dung yêu cầu mới không?</p>
                
                <div className="compare-grid">
                  <div className="compare-box">
                    <h4>Bản ghi cũ gần nhất</h4>
                    <p><strong>Nội dung:</strong> {compareModalData.latestRow?.content || '(Chưa có)'}</p>
                    <p><strong>Kinh phí:</strong> {compareModalData.latestRow?.cost ? compareModalData.latestRow.cost.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ'}</p>
                    <p><strong>Nhân viên:</strong> {compareModalData.latestRow?.assignedStaffs?.map(s => s.name).join(', ') || '-'}</p>
                  </div> 
                  <div className="compare-box new-data">
                    <h4>Nội dung yêu cầu mới</h4>
                    <p><strong>Nội dung:</strong> {compareModalData.newRequestData?.content || '(Không có)'}</p>
                    <p><strong>Kinh phí:</strong> {compareModalData.newRequestData?.cost ? compareModalData.newRequestData.cost.toLocaleString('vi-VN') + ' VNĐ' : '0 VNĐ'}</p>
                    <p><strong>Nhân viên:</strong> {compareModalData.newRequestData?.assignedStaffs?.map(s => s.name).join(', ') || '-'}</p>
                  </div>
                </div> 
                <div className="compare-modal-actions">
                  <button 
                    type="button" 
                    className="btn-confirm-update"
                    onClick={() => handleConfirmUpdateOldRow(true)}
                  >
                    Cập nhật bản ghi cũ
                  </button>
                  <button 
                    type="button" 
                    className="btn-create-new"
                    onClick={() => handleConfirmUpdateOldRow(false)}
                  >
                    Tạo dòng mới tự nhập
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}