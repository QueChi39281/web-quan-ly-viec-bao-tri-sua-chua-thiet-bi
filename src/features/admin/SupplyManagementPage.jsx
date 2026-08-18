import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import SupplyTableRow from './SupplyTableRow';
import { inventoryApi } from '../../services/api';
import './SupplyManagementPage.css';

const ITEMS_PER_PAGE = 20;

export default function SupplyManagementPage() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true);
        const response = await inventoryApi.getItems({ limit: 100 });
        const rawData = Array.isArray(response) ? response : response?.data || response?.items || [];

        const mapped = (Array.isArray(rawData) ? rawData : []).map((inventory, index) => {
          const item = inventory?.item || inventory || {};
          const quantity = Number(inventory?.quantity ?? item?.quantity ?? inventory?.stock ?? 0);
          const supplierName = inventory?.supplier?.name || inventory?.supplierName || item?.supplierName || 'N/A';

          return {
            id: inventory?.id || item?.id || item?._id || index + 1,
            selected: false,
            supplyName: item?.name || inventory?.name || item?.supplyName || 'N/A',
            supplyCode: item?.code || inventory?.code || item?.itemCode || item?.supplyCode || `VT-${index + 1}`,
            supplier: supplierName,
            importQuantity: quantity,
            remainingQuantity: quantity,
          };
        });

        setSupplies(mapped);
      } catch (error) {
        console.error('Không thể tải vật tư từ API:', error);
        setSupplies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplies();
  }, []);
  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  const [filterForm, setFilterForm] = useState({
    supplyName: '',
    supplyCode: '',
    supplier: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    supplyName: '',
    supplyCode: '',
    supplier: ''
  });

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const excelColumns = useMemo(() => [
    { header: 'STT', key: 'stt', align: 'center', formatter: (_, __, idx) => idx + 1 },
    { header: 'Tên vật tư', key: 'supplyName', align: 'left' },
    { header: 'Mã vật tư', key: 'supplyCode', align: 'center' },
    { header: 'Nhà cung cấp', key: 'supplier', align: 'left' },
    { header: 'Số lượng nhập', key: 'importQuantity', align: 'center' },
    { header: 'Số lượng còn lại', key: 'remainingQuantity', align: 'center' }
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
        setSupplies(prev => prev.map(item => item.id === backupRow.id ? backupRow : item));
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
    const emptyFilters = { supplyName: '', supplyCode: '', supplier: '' };
    setFilterForm(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const filteredSupplies = useMemo(() => {
    return supplies.filter(item => {
      if (appliedFilters.supplyName.trim() && !item.supplyName.toLowerCase().includes(appliedFilters.supplyName.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.supplyCode.trim() && !item.supplyCode.toLowerCase().includes(appliedFilters.supplyCode.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.supplier.trim() && !item.supplier.toLowerCase().includes(appliedFilters.supplier.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [supplies, appliedFilters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSupplies = useMemo(() => {
    let sortable = [...filteredSupplies];
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
  }, [filteredSupplies, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    }
    return <span className="sort-arrow inactive">▲▼</span>;
  };

  const totalItems = sortedSupplies.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedSupplies = sortedSupplies.slice(startIndex, endIndex);

  const selectAll = useMemo(() => {
    if (filteredSupplies.length === 0) return false;
    return filteredSupplies.every(item => item.selected);
  }, [filteredSupplies]);

  const handleSelectAll = useCallback(() => {
    const targetState = !selectAll;
    const filteredIds = new Set(filteredSupplies.map(i => i.id));
    setSupplies(prev => prev.map(i => filteredIds.has(i.id) ? { ...i, selected: targetState } : i));
  }, [selectAll, filteredSupplies]);

  const handleSelectRow = useCallback((id) => {
    setSupplies(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const handleRowChange = useCallback((id, field, value) => {
    setSupplies(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  const handleAddSupply = () => {
    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const newId = Date.now();
    const newSupply = {
      id: newId,
      selected: false,
      supplyName: '',
      supplyCode: `VT-${Math.floor(100 + Math.random() * 900)}`,
      supplier: '',
      importQuantity: 0,
      remainingQuantity: 0
    };

    setSupplies(prev => [newSupply, ...prev]);
    setEditingRowId(newId);
    setBackupRow(null);
  };

  const handleEditSupply = () => {
    const selected = supplies.filter(i => i.selected);
    if (selected.length !== 1) {
      alert("Vui lòng chọn đúng 1 vật tư để sửa!");
      return;
    }

    if (editingRowId !== null && !checkUnsavedChanges()) return;

    setEditingRowId(selected[0].id);
    setBackupRow(JSON.parse(JSON.stringify(selected[0])));
  };

  const handleSavePage = async () => {
    if (editingRowId === null) {
      alert("Không có dữ liệu nào đang trong trạng thái chỉnh sửa.");
      return;
    }

    const targetRow = supplies.find((item) => item.id === editingRowId);
    if (!targetRow) {
      alert("Dữ liệu đang chỉnh sửa không tồn tại.");
      return;
    }

    const isNewRow = typeof targetRow.id === 'number' && targetRow.id > 1_000_000_000;
    const payload = {
      quantity: Number(targetRow.importQuantity ?? targetRow.remainingQuantity ?? 0),
      item: {
        code: String(targetRow.supplyCode || '').trim() || `VT-${Date.now()}`,
        name: String(targetRow.supplyName || '').trim(),
        unit: 'Cái',
        minimum_stock: Number(targetRow.remainingQuantity ?? 0),
      },
      supplier: {
        name: String(targetRow.supplier || '').trim() || 'N/A',
      },
      manufacturer: {
        name: 'N/A',
      },
    };

    if (!payload.item.name) {
      alert('Tên vật tư không được để trống.');
      return;
    }

    const confirmSave = window.confirm('Bạn có chắc chắn muốn lưu thông tin vật tư này không?');
    if (!confirmSave) return;

    try {
      const response = isNewRow
        ? await inventoryApi.createInventory(payload)
        : await inventoryApi.updateInventory(targetRow.id, payload);

      const createdOrUpdated = response?.data || response;
      const serverItem = createdOrUpdated?.item || createdOrUpdated || null;

      setSupplies((prev) => prev.map((item) => {
        if (item.id !== editingRowId) return item;

        const nextItem = {
          ...item,
          supplyName: serverItem?.name || item.supplyName,
          supplyCode: serverItem?.code || item.supplyCode,
          supplier: createdOrUpdated?.supplier?.name || item.supplier,
          importQuantity: Number(createdOrUpdated?.quantity ?? item.importQuantity ?? 0),
          remainingQuantity: Number(createdOrUpdated?.quantity ?? item.remainingQuantity ?? 0),
        };

        if (createdOrUpdated?.id) {
          nextItem.id = createdOrUpdated.id;
        }

        return nextItem;
      }));

      setEditingRowId(null);
      setBackupRow(null);
      alert('Đã lưu thông tin vật tư thành công!');
    } catch (error) {
      console.error('Lỗi lưu vật tư:', error);
      alert('Không thể lưu vật tư lên server. Vui lòng thử lại.');
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
          <h2 className="plan-page-title">Quản lý vật tư</h2>

          {/* 1. BỘ LỌC DỮ LIỆU */}
          <div className="filter-bar-container">
            <div className="filter-inputs-wrapper">
              <div className="filter-group">
                <label>Tên vật tư:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập tên vật tư..."
                  value={filterForm.supplyName}
                  onChange={(e) => handleFilterInputChange('supplyName', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                />
              </div>

              <div className="filter-group">
                <label>Mã vật tư:</label>
                <input
                  type="text"
                  className="filter-control"
                  placeholder="Nhập mã vật tư..."
                  value={filterForm.supplyCode}
                  onChange={(e) => handleFilterInputChange('supplyCode', e.target.value)}
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

          {/* 2. THANH THAO TÁC (Tất cả nút Xuất Excel, Hành động, Lưu gom chung 1 nhóm nằm bên phải) */}
          <div className="top-action-bar">
            <ExportExcelButton
              data={sortedSupplies}
              fileName="Danh_sach_vat_tu"
              tableTitle="DANH SÁCH VẬT TƯ"
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
                  <div className="menu-option" onClick={() => { handleAddSupply(); setShowActionMenu(false); }}>
                    ➕ Thêm
                  </div>
                  <div className="menu-option" onClick={() => { handleEditSupply(); setShowActionMenu(false); }}>
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

          {/* 3. BẢNG DỮ LIỆU */}
          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              <colgroup>
                <col className="col-checkbox" />
                <col className="col-stt" />
                <col style={{ width: '220px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th className="col-stt sortable-th" onClick={() => handleSort('id')}>
                    <div className="th-content">STT {renderSortArrow('id')}</div>
                  </th>
                  <th onClick={() => handleSort('supplyName')} className="sortable-th">
                    <div className="th-content">Tên vật tư {renderSortArrow('supplyName')}</div>
                  </th>
                  <th onClick={() => handleSort('supplyCode')} className="sortable-th">
                    <div className="th-content">Mã vật tư {renderSortArrow('supplyCode')}</div>
                  </th>
                  <th onClick={() => handleSort('supplier')} className="sortable-th">
                    <div className="th-content">Nhà cung cấp {renderSortArrow('supplier')}</div>
                  </th>
                  <th onClick={() => handleSort('importQuantity')} className="sortable-th">
                    <div className="th-content">Số lượng nhập {renderSortArrow('importQuantity')}</div>
                  </th>
                  <th onClick={() => handleSort('remainingQuantity')} className="sortable-th">
                    <div className="th-content">Số lượng còn lại {renderSortArrow('remainingQuantity')}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSupplies.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      Không tìm thấy vật tư phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedSupplies.map((item, index) => (
                    <SupplyTableRow
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

          {/* 4. PHÂN TRANG */}
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