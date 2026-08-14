import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import AssetListRow from './components/AssetListRow';
import './AssetListPage.css';

const ITEMS_PER_PAGE = 20;

export const INITIAL_ASSETS = [
  {
    id: 1,
    selected: false,
    assetName: 'Máy in HP LaserJet Pro M404dn',
    assetCode: 'TB-VP01',
    supplier: 'Phong Vũ Computer',
    location: 'Tầng 2 - Phòng Kế toán',
    info: 'In 2 mặt tự động, tốc độ 38 trang/phút'
  },
  {
    id: 2,
    selected: false,
    assetName: 'Máy photocopy Ricoh Aficio MP 3555',
    assetCode: 'TB-VP02',
    supplier: 'Công ty Phú Sơn Copier',
    location: 'Tầng 1 - Sảnh hành chính',
    info: 'Chức năng In/Scan/Copy A3-A4, tốc độ 35 bản/phút'
  },
  {
    id: 3,
    selected: false,
    assetName: 'Laptop Dell Latitude 5420',
    assetCode: 'TB-VP03',
    supplier: 'FPT Shop',
    location: 'Tầng 3 - Phòng Nhân sự',
    info: 'Core i5-1135G7, RAM 16GB, SSD 512GB'
  },
  {
    id: 4,
    selected: false,
    assetName: 'Máy tính để bàn HP ProDesk 400 G7',
    assetCode: 'TB-VP04',
    supplier: 'Công ty Máy tính Trần Anh',
    location: 'Tầng 2 - Phòng Kinh doanh',
    info: 'Core i7-10700, RAM 16GB, SSD 256GB'
  },
  {
    id: 5,
    selected: false,
    assetName: 'Máy chiếu Epson EB-FH52',
    assetCode: 'TB-VP05',
    supplier: 'Thế Giới Máy Chiếu',
    location: 'Tầng 4 - Phòng họp lớn',
    info: 'Độ sáng 4.000 Ansi Lumens, độ phân giải Full HD'
  },
  {
    id: 6,
    selected: false,
    assetName: 'Router Wi-Fi MikroTik RB4011iGS+RM',
    assetCode: 'TB-VP06',
    supplier: 'Thiết bị Mạng MTC',
    location: 'Tầng 3 - Phòng Server',
    info: '10 cổng Gigabit Ethernet, 1 cổng SFP+ 10Gbps'
  },
  {
    id: 7,
    selected: false,
    assetName: 'Switch Cisco Catalyst WS-C2960X-24PS-L',
    assetCode: 'TB-VP07',
    supplier: 'Cisco Việt Nam',
    location: 'Tầng 3 - Phòng Server',
    info: '24 cổng PoE+, 4 cổng SFP 1G, công suất PoE 370W'
  },
  {
    id: 8,
    selected: false,
    assetName: 'Bộ lưu điện UPS APC Smart-UPS 2200VA',
    assetCode: 'TB-VP08',
    supplier: 'Tập đoàn Nguyên Kim UPS',
    location: 'Tầng 3 - Phòng Server',
    info: 'Công suất 1980W/2200VA, điện áp 230V'
  },
  {
    id: 9,
    selected: false,
    assetName: 'Máy chấm công Ronald Jack FA110',
    assetCode: 'TB-VP09',
    supplier: 'Điện máy Quang Minh',
    location: 'Tầng 1 - Cửa ra vào chính',
    info: 'Nhận diện khuôn mặt (500) & Vân tay (1.000)'
  },
  {
    id: 10,
    selected: false,
    assetName: 'Điều hòa âm trần Daikin 24.000 BTU',
    assetCode: 'TB-VP10',
    supplier: 'Điện máy Xanh',
    location: 'Tầng 3 - Phòng Giám đốc',
    info: 'Inverter 1 chiều, Gas R32, model FCF71CVM'
  },
  {
    id: 11,
    selected: false,
    assetName: 'Máy hủy tài liệu Silicon PS-800C',
    assetCode: 'TB-VP11',
    supplier: 'Văn phòng phẩm Hồng Hà',
    location: 'Tầng 2 - Phòng Hành chính',
    info: 'Kiểu hủy vụn 2x10mm, dung tích thùng chứa 21 lít'
  },
  {
    id: 12,
    selected: false,
    assetName: 'Màn hình Dell UltraSharp U2422H',
    assetCode: 'TB-VP12',
    supplier: 'Hà Nội Computer',
    location: 'Tầng 4 - Phòng Thiết kế',
    info: 'Kích thước 23.8 inch, tấm nền IPS, Full HD, USB-C'
  }
];

export default function AssetListPage() {
  const [assets, setAssets] = useState(INITIAL_ASSETS);
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