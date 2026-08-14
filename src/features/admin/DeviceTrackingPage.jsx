import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import DeviceTrackingRow from './DeviceTrackingRow';
import './DeviceTrackingPage.css';

const ITEMS_PER_PAGE = 20;

// MOCK DATA: Nhật ký theo dõi thiết bị văn phòng (Máy in HP LaserJet)
const INITIAL_LOGS = [
  {
    id: 1,
    selected: false,
    actionType: 'Báo hư hỏng',
    transferDate: '2026-02-10',
    eventTime: '2026-02-10T09:15',
    maintenanceContent: 'Báo hỏng kẹt giấy liên tục và in bị sọc đen dọc trang',
    cost: 0,
    deviceStatus: 'Chờ sửa chữa'
  },
  {
    id: 2,
    selected: false,
    actionType: 'Sửa chữa',
    transferDate: '2026-02-11',
    eventTime: '2026-02-11T14:30',
    maintenanceContent: 'Thay bao lụa, quả lô cao su ép và vệ sinh hộp mực',
    cost: 650000,
    deviceStatus: 'Đang sửa chữa'
  },
  {
    id: 3,
    selected: false,
    actionType: 'Nghiệm thu',
    transferDate: '2026-02-12',
    eventTime: '2026-02-12T10:00',
    maintenanceContent: 'In thử 50 bản đạt chất lượng nét, không kẹt giấy, bàn giao về phòng Kế toán',
    cost: 0,
    deviceStatus: 'Hoạt động bình thường'
  },
  {
    id: 4,
    selected: false,
    actionType: 'Bảo trì định kỳ',
    transferDate: '2026-05-15',
    eventTime: '2026-05-15T08:30',
    maintenanceContent: 'Vệ sinh công nghiệp toàn bộ máy, thay hộp mực mới HP 76A',
    cost: 1200000,
    deviceStatus: 'Hoạt động bình thường'
  }
];

export default function DeviceTrackingPage() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  // Bộ lọc tìm kiếm TB
  const [searchFilter, setSearchFilter] = useState({ deviceName: '', deviceCode: '' });
  
  // Thông tin TB chi tiết hiển thị ở trên (Thiết bị Văn phòng)
  const [selectedDeviceInfo, setSelectedDeviceInfo] = useState({
    deviceName: 'Máy in HP LaserJet Pro M404dn',
    deviceCode: 'TB-VP01',
    supplier: 'Phong Vũ Computer',
    info: 'In 2 mặt tự động, tốc độ 38 trang/phút, kết nối LAN',
    currentStatus: 'Hoạt động bình thường',
    currentLocation: 'Tầng 2 - Phòng Kế toán'
  });

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [timeSortOrder, setTimeSortOrder] = useState('desc'); 

  const excelColumns = useMemo(() => [
    { header: 'STT', key: 'stt', align: 'center', formatter: (_, __, idx) => idx + 1 },
    { header: 'Hành động', key: 'actionType', align: 'left' },
    { header: 'Ngày chuyển đổi đơn vị', key: 'transferDate', align: 'center' },
    { header: 'Thời gian', key: 'eventTime', align: 'center' },
    { header: 'Nội dung sửa chữa bảo trì', key: 'maintenanceContent', align: 'left' },
    { header: 'Kinh phí', key: 'cost', align: 'right', formatter: (val) => val ? val.toLocaleString('vi-VN') + ' đ' : '0 đ' },
    { header: 'Trạng thái thiết bị', key: 'deviceStatus', align: 'center' }
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
        setLogs(prev => prev.map(item => item.id === backupRow.id ? backupRow : item));
      }
      setEditingRowId(null);
      setBackupRow(null);
      setCurrentPage(newPage);
    }
  };

  const handleSearch = () => {
    if (!checkUnsavedChanges()) return;
    alert(`Đã tìm kiếm theo Tên TB: "${searchFilter.deviceName}" - Mã TB: "${searchFilter.deviceCode}"`);
  };

  // Sắp xếp danh sách theo thời gian
  const sortedLogs = useMemo(() => {
    let sorted = [...logs];
    sorted.sort((a, b) => {
      const timeA = new Date(a.eventTime || a.transferDate).getTime();
      const timeB = new Date(b.eventTime || b.transferDate).getTime();
      return timeSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });
    return sorted;
  }, [logs, timeSortOrder]);

  const totalItems = sortedLogs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedLogs = sortedLogs.slice(startIndex, endIndex);

  const selectAll = useMemo(() => {
    if (logs.length === 0) return false;
    return logs.every(item => item.selected);
  }, [logs]);

  const handleSelectAll = useCallback(() => {
    const targetState = !selectAll;
    setLogs(prev => prev.map(i => ({ ...i, selected: targetState })));
  }, [selectAll]);

  const handleSelectRow = useCallback((id) => {
    setLogs(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  }, []);

  const handleRowChange = useCallback((id, field, value) => {
    setLogs(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  }, []);

  // HÀNH ĐỘNG: THÊM - SỬA - XÓA
  const handleAddLog = () => {
    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toISOString().slice(0, 16);

    const newId = Date.now();
    const newLog = {
      id: newId,
      selected: false,
      actionType: 'Báo hư hỏng',
      transferDate: todayStr,
      eventTime: nowStr,
      maintenanceContent: '',
      cost: 0,
      deviceStatus: selectedDeviceInfo.currentStatus
    };

    setLogs(prev => [newLog, ...prev]);
    setEditingRowId(newId);
    setBackupRow(null);
  };

  const handleEditLog = () => {
    const selected = logs.filter(i => i.selected);
    if (selected.length !== 1) {
      alert("Vui lòng chọn đúng 1 bản ghi để sửa!");
      return;
    }

    if (editingRowId !== null && !checkUnsavedChanges()) return;

    setEditingRowId(selected[0].id);
    setBackupRow(JSON.parse(JSON.stringify(selected[0])));
  };

  const handleDeleteLog = () => {
    const selected = logs.filter(i => i.selected);
    if (selected.length === 0) {
      alert("Vui lòng chọn ít nhất 1 bản ghi để xóa!");
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selected.length} bản ghi đã chọn?`)) {
      setLogs(prev => prev.filter(i => !i.selected));
      if (editingRowId && selected.some(i => i.id === editingRowId)) {
        setEditingRowId(null);
        setBackupRow(null);
      }
    }
  };

  const handleSavePage = () => {
    if (editingRowId === null) {
      alert("Không có dữ liệu nào đang trong trạng thái chỉnh sửa.");
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn lưu thông tin này không?")) {
      setEditingRowId(null);
      setBackupRow(null);
      alert("Đã lưu thông tin sổ theo dõi thành công!");
    }
  };

  return (
    <div className="device-tracking-page-container"> 
      <div className="page-root-layout">
        <header className="page-header-wrapper">
          <HeaderInfo />
        </header>

        <div className="page-body-wrapper">
          <ManagerSidebar />

          <main className="main-content-container">
            <h2 className="plan-page-title">Sổ theo dõi thiết bị văn phòng</h2>

            {/* KHU VỰC TÌM KIẾM THEO TÊN/MÃ TB */}
            <div className="device-search-bar">
              <div className="search-inputs-group">
                <div className="search-row">
                  <label>Tên TB:</label>
                  <input
                    type="text"
                    className="filter-control"
                    value={searchFilter.deviceName}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, deviceName: e.target.value }))}
                    placeholder="Nhập tên thiết bị (vd: Máy in, Máy chiếu...)..."
                  />
                </div>
                <div className="search-row">
                  <label>Mã TB:</label>
                  <input
                    type="text"
                    className="filter-control"
                    value={searchFilter.deviceCode}
                    onChange={(e) => setSearchFilter(prev => ({ ...prev, deviceCode: e.target.value }))}
                    placeholder="Nhập mã thiết bị (vd: TB-VP01)..."
                  />
                </div>
              </div>
              <button type="button" className="btn-apply-filter" onClick={handleSearch}>
                Lọc
              </button>
            </div>

            {/* KHU VỰC HIỂN THỊ THÔNG TIN CHI TIẾT THIẾT BỊ VĂN PHÒNG */}
            <div className="device-info-card">
              <div className="info-column">
                <p><strong>Tên thiết bị:</strong> <span>{selectedDeviceInfo.deviceName}</span></p>
                <p><strong>Mã TB:</strong> <span>{selectedDeviceInfo.deviceCode}</span></p>
                <p><strong>Nhà cung cấp:</strong> <span>{selectedDeviceInfo.supplier}</span></p>
                <p><strong>Thông tin kỹ thuật:</strong> <span>{selectedDeviceInfo.info}</span></p>
              </div>
              <div className="info-column">
                <p><strong>Trạng thái hiện tại:</strong> <span className="status-highlight">{selectedDeviceInfo.currentStatus}</span></p>
                <p><strong>Vị trí lắp đặt:</strong> <span>{selectedDeviceInfo.currentLocation}</span></p>
              </div>
            </div>

            {/* THANH THAO TÁC + BỘ SẮP XẾP THỜI GIAN */}
            <div className="top-action-bar">
              <div className="sort-time-wrapper">
                <label>Sắp xếp thời gian:</label>
                <select
                  className="sort-select-control"
                  value={timeSortOrder}
                  onChange={(e) => setTimeSortOrder(e.target.value)}
                >
                  <option value="desc">Từ mới đến cũ (Mới nhất trước)</option>
                  <option value="asc">Từ cũ đến mới (Cũ nhất trước)</option>
                </select>
              </div>

              <div className="right-btn-group">
                <ExportExcelButton
                  data={sortedLogs}
                  fileName="So_theo_doi_thiet_bi_van_phong"
                  tableTitle="SỔ THEO DÕI THIẾT BỊ VĂN PHÒNG"
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
                      <div className="menu-option" onClick={() => { handleAddLog(); setShowActionMenu(false); }}>
                        ➕ Thêm
                      </div>
                      <div className="menu-option" onClick={() => { handleEditLog(); setShowActionMenu(false); }}>
                        ✏️ Sửa
                      </div>
                      <div className="menu-option option-danger" onClick={() => { handleDeleteLog(); setShowActionMenu(false); }}>
                        🗑️ Xóa
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
            </div>

            {/* BẢNG SỔ THEO DÕI THIẾT BỊ */}
            <div className="frame-33-table-wrapper">
              <table className="maintenance-table">
                <colgroup>
                  <col className="col-checkbox" />
                  <col className="col-stt" />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '280px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '180px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="col-checkbox">
                      <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                    </th>
                    <th className="col-stt">STT</th>
                    <th>Hành động</th>
                    <th>Ngày chuyển đổi đơn vị sử dụng</th>
                    <th>Thời gian</th>
                    <th>Nội dung sửa chữa bảo trì</th>
                    <th>Kinh phí</th>
                    <th>Trạng thái thiết bị</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-table-msg">
                        Chưa có lịch sử theo dõi cho thiết bị văn phòng này.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((item, index) => (
                      <DeviceTrackingRow
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
    </div>
  );
}