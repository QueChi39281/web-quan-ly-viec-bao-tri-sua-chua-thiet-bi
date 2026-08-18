import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import AssetListRow from './components/AssetListRow';
import { deviceApi } from '../../services/api';
import './AssetListPage.css';

const ITEMS_PER_PAGE = 20;

export default function AssetListPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await deviceApi.getDevices({ limit: 100 });
        const data = Array.isArray(response) ? response : response?.data || response?.items || [];

        const mapped = (Array.isArray(data) ? data : []).map((device, index) => ({
          id: device.id || device._id || index + 1,
          selected: false,
          assetName: device.deviceName || device.name || device.assetName || 'N/A',
          assetCode: device.deviceCode || device.code || device.assetCode || `TB-${index + 1}`,
          supplier: device.supplierName || device.supplier || device.manufacturerName || device.vendor || 'N/A',
          location: device.location || device.currentLocation || device.assignedLocation || 'Chưa có vị trí',
          info: device.info || device.description || device.model || device.specification || '',
        }));

        setAssets(mapped);
      } catch (error) {
        console.error('Không thể tải danh sách thiết bị từ API:', error);
        setAssets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);
  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  const [filterForm, setFilterForm] = useState({
    assetName: '',
    assetCode: '',
    supplier: '',
    location: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    assetName: '',
    assetCode: '',
    supplier: '',
    location: ''
  });

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const excelColumns = useMemo(() => [
    { header: 'STT', key: 'stt', align: 'center', formatter: (_, __, idx) => idx + 1 },
    { header: 'Tên thiết bị', key: 'assetName', align: 'left' },
    { header: 'Mã TB', key: 'assetCode', align: 'center' },
    { header: 'Nhà cung cấp', key: 'supplier', align: 'left' },
    { header: 'Vị trí TB', key: 'location', align: 'left' },
    { header: 'Thông tin thiết bị', key: 'info', align: 'left' }
  ], []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-wrapper')) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const checkUnsavedChanges = () => {
    if (editingRowId !== null) {
      return window.confirm("Bạn có thay đổi chưa lưu! Bạn có muốn bỏ qua thay đổi và tiếp tục không?");
    }
    return true;
  };

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    if (checkUnsavedChanges()) {
      if (backupRow) {
        setAssets(prev => prev.map(item => item.id === backupRow.id ? backupRow : item));
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
    const emptyFilters = { assetName: '', assetCode: '', supplier: '', location: '' };
    setFilterForm(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const filteredAssets = useMemo(() => {
    return assets.filter(item => {
      if (appliedFilters.assetName.trim() && !item.assetName.toLowerCase().includes(appliedFilters.assetName.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.assetCode.trim() && !item.assetCode.toLowerCase().includes(appliedFilters.assetCode.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.supplier.trim() && !item.supplier.toLowerCase().includes(appliedFilters.supplier.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.location.trim() && !item.location.toLowerCase().includes(appliedFilters.location.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [assets, appliedFilters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAssets = useMemo(() => {
    let sortable = [...filteredAssets];
    if (sortConfig.key !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] ?? '';
        let bVal = b[sortConfig.key] ?? '';

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredAssets, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    }
    return <span className="sort-arrow inactive">▲▼</span>;
  };

  const totalItems = sortedAssets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedAssets = sortedAssets.slice(startIndex, endIndex);

  const selectAll = useMemo(() => {
    if (filteredAssets.length === 0) return false;
    return filteredAssets.every(item => item.selected);
  }, [filteredAssets]);

  const handleSelectAll = useCallback(() => {
    const targetState = !selectAll;
    const filteredIds = new Set(filteredAssets.map(i => i.id));
    setAssets(prev => prev.map(i => filteredIds.has(i.id) ? { ...i, selected: targetState } : i));
  }, [selectAll, filteredAssets]);

  const handleSelectRow = useCallback((id) => {
    setAssets(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const handleRowChange = useCallback((id, field, value) => {
    setAssets(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  const handleAddAsset = () => {
    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const newId = Date.now();
    const newAsset = {
      id: newId,
      selected: false,
      assetName: '',
      assetCode: `TB-${Math.floor(100 + Math.random() * 900)}`,
      supplier: '',
      location: '',
      info: ''
    };

    setAssets(prev => [newAsset, ...prev]);
    setEditingRowId(newId);
    setBackupRow(null);
  };

  const handleEditAsset = () => {
    const selected = assets.filter(i => i.selected);
    if (selected.length !== 1) {
      alert("Vui lòng chọn đúng 1 thiết bị để sửa!");
      return;
    }

    if (editingRowId !== null && !checkUnsavedChanges()) return;

    setEditingRowId(selected[0].id);
    setBackupRow(JSON.parse(JSON.stringify(selected[0])));
  };

  const handleSavePage = () => {
    if (editingRowId === null) {
      alert("Không có dữ liệu nào đang trong trạng thái chỉnh sửa.");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn lưu thông tin thiết bị này không?")) {
      setEditingRowId(null);
      setBackupRow(null);
      alert("Đã lưu thông tin thiết bị thành công!");
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
          <h2 className="plan-page-title">Quản lý thiết bị</h2>

          {/* BỘ LỌC DỮ LIỆU */}
          <div className="filter-bar-container">
            <div className="filter-inputs-wrapper">
              <div className="filter-group">
                <label>Tên thiết bị:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập tên thiết bị..."
                  value={filterForm.assetName}
                  onChange={(e) => handleFilterInputChange('assetName', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                />
              </div>

              <div className="filter-group">
                <label>Mã TB:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập mã TB..."
                  value={filterForm.assetCode}
                  onChange={(e) => handleFilterInputChange('assetCode', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                />
              </div>

              <div className="filter-group">
                <label>Nhà cung cấp:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập nhà cung cấp..."
                  value={filterForm.supplier}
                  onChange={(e) => handleFilterInputChange('supplier', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                />
              </div>

              <div className="filter-group">
                <label>Vị trí TB:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập vị trí..."
                  value={filterForm.location}
                  onChange={(e) => handleFilterInputChange('location', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
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

          {/* THANH THAO TÁC (Xuất Excel, Hành động, Lưu góc phải) */}
          <div className="top-action-bar">
            <ExportExcelButton
              data={sortedAssets}
              fileName="Danh_sach_thiet_bi"
              tableTitle="DANH SÁCH THIẾT BỊ"
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
                  <div className="menu-option" onClick={() => { handleAddAsset(); setShowActionMenu(false); }}>
                    ➕ Thêm
                  </div>
                  <div className="menu-option" onClick={() => { handleEditAsset(); setShowActionMenu(false); }}>
                    ✏️ Sửa
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn-save-main"
              disabled={editingRowId === null}
              onClick={handleSavePage}
            >
              Lưu
            </button>
          </div>

          {/* BẢNG DỮ LIỆU THIẾT BỊ */}
          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              <colgroup>
                <col className="col-checkbox" />
                <col className="col-stt" />
                <col style={{ width: '200px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '240px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th className="col-stt sortable-th" onClick={() => handleSort('id')}>
                    <div className="th-content">STT {renderSortArrow('id')}</div>
                  </th>
                  <th onClick={() => handleSort('assetName')} className="sortable-th">
                    <div className="th-content">Tên thiết bị {renderSortArrow('assetName')}</div>
                  </th>
                  <th onClick={() => handleSort('assetCode')} className="sortable-th">
                    <div className="th-content">Mã TB {renderSortArrow('assetCode')}</div>
                  </th>
                  <th onClick={() => handleSort('supplier')} className="sortable-th">
                    <div className="th-content">Nhà cung cấp {renderSortArrow('supplier')}</div>
                  </th>
                  <th onClick={() => handleSort('location')} className="sortable-th">
                    <div className="th-content">Vị trí TB {renderSortArrow('location')}</div>
                  </th>
                  <th onClick={() => handleSort('info')} className="sortable-th">
                    <div className="th-content">Thông tin thiết bị {renderSortArrow('info')}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedAssets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      Không tìm thấy thiết bị phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((item, index) => (
                    <AssetListRow
                      key={item.id}
                      item={item}
                      index={index}
                      startIndex={startIndex}
                      editingRowId={editingRowId}
                      onSelectRow={handleSelectRow}
                      onRowChange={handleRowChange}
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
        </main>
      </div>
    </div>
  );
}