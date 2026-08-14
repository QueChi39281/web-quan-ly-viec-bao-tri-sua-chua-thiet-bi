import React, { useState, useEffect, useMemo, useCallback } from 'react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import ExportExcelButton from '../../components/ExportExcelButton';
import UserTableRow from './UserTableRow';
import './UserManagementPage.css';

const ITEMS_PER_PAGE = 20;

export const INITIAL_USERS = [
  {
    id: 1,
    selected: false,
    username: 'admin_sys',
    role: 'Quản trị viên',
    phone: '0901234567',
    email: 'admin@company.com',
    status: 'Hoạt động'
  },
  {
    id: 2,
    selected: false,
    username: 'tech_lead',
    role: 'Kỹ thuật viên',
    phone: '0912345678',
    email: 'techlead@company.com',
    status: 'Hoạt động'
  },
  {
    id: 3,
    selected: false,
    username: 'user_temp',
    role: 'Nhân viên',
    phone: '',
    email: 'user_temp@company.com',
    status: 'Đã khóa'
  },
  {
    id: 4,
    selected: false,
    username: 'mgr_nam',
    role: 'Quản lý',
    phone: '0903112233',
    email: 'nam.tran@company.com',
    status: 'Hoạt động'
  },
  {
    id: 5,
    selected: false,
    username: 'tech_dung',
    role: 'Kỹ thuật viên',
    phone: '0918223344',
    email: 'dung.nguyen@company.com',
    status: 'Hoạt động'
  },
  {
    id: 6,
    selected: false,
    username: 'user_hoa',
    role: 'Nhân viên',
    phone: '0987334455',
    email: 'hoa.le@company.com',
    status: 'Hoạt động'
  },
  {
    id: 7,
    selected: false,
    username: 'admin_sec',
    role: 'Quản trị viên',
    phone: '0909445566',
    email: 'sec_admin@company.com',
    status: 'Hoạt động'
  },
  {
    id: 8,
    selected: false,
    username: 'mgr_lan',
    role: 'Quản lý',
    phone: '0938556677',
    email: 'lan.pham@company.com',
    status: 'Hoạt động'
  },
  {
    id: 9,
    selected: false,
    username: 'tech_hung',
    role: 'Kỹ thuật viên',
    phone: '0976667788',
    email: 'hung.vu@company.com',
    status: 'Hoạt động'
  },
  {
    id: 10,
    selected: false,
    username: 'user_tuan',
    role: 'Nhân viên',
    phone: '0945778899',
    email: 'tuan.hoang@company.com',
    status: 'Đã khóa'
  },
  {
    id: 11,
    selected: false,
    username: 'mgr_hung_dev',
    role: 'Quản lý',
    phone: '0902889900',
    email: 'hung.dev@company.com',
    status: 'Hoạt động'
  },
  {
    id: 12,
    selected: false,
    username: 'tech_minh',
    role: 'Kỹ thuật viên',
    phone: '0913990011',
    email: 'minh.do@company.com',
    status: 'Hoạt động'
  },
  {
    id: 13,
    selected: false,
    username: 'user_mai',
    role: 'Nhân viên',
    phone: '0981001122',
    email: 'mai.ngo@company.com',
    status: 'Hoạt động'
  },
  {
    id: 14,
    selected: false,
    username: 'user_linh',
    role: 'Nhân viên',
    phone: '',
    email: 'linh.bui@company.com',
    status: 'Chờ kích hoạt'
  },
  {
    id: 15,
    selected: false,
    username: 'tech_cuong',
    role: 'Kỹ thuật viên',
    phone: '0932112233',
    email: 'cuong.ly@company.com',
    status: 'Hoạt động'
  },
  {
    id: 16,
    selected: false,
    username: 'mgr_quang',
    role: 'Quản lý',
    phone: '0973223344',
    email: 'quang.truong@company.com',
    status: 'Hoạt động'
  },
  {
    id: 17,
    selected: false,
    username: 'user_vy',
    role: 'Nhân viên',
    phone: '0944334455',
    email: 'vy.dinh@company.com',
    status: 'Hoạt động'
  },
  {
    id: 18,
    selected: false,
    username: 'admin_backup',
    role: 'Quản trị viên',
    phone: '0905445566',
    email: 'backup_admin@company.com',
    status: 'Đã khóa'
  },
  {
    id: 19,
    selected: false,
    username: 'tech_son',
    role: 'Kỹ thuật viên',
    phone: '0916556677',
    email: 'son.phung@company.com',
    status: 'Hoạt động'
  },
  {
    id: 20,
    selected: false,
    username: 'user_trang',
    role: 'Nhân viên',
    phone: '0987667788',
    email: 'trang.vo@company.com',
    status: 'Hoạt động'
  },
  {
    id: 21,
    selected: false,
    username: 'mgr_thanh',
    role: 'Quản lý',
    phone: '0939778899',
    email: 'thanh.phan@company.com',
    status: 'Hoạt động'
  },
  {
    id: 22,
    selected: false,
    username: 'tech_tuan_elec',
    role: 'Kỹ thuật viên',
    phone: '0971889900',
    email: 'tuan.elec@company.com',
    status: 'Hoạt động'
  },
  {
    id: 23,
    selected: false,
    username: 'user_hieu',
    role: 'Nhân viên',
    phone: '0942990011',
    email: 'hieu.dang@company.com',
    status: 'Chờ kích hoạt'
  },
  {
    id: 24,
    selected: false,
    username: 'user_diep',
    role: 'Nhân viên',
    phone: '0903001122',
    email: 'diep.bui@company.com',
    status: 'Hoạt động'
  },
  {
    id: 25,
    selected: false,
    username: 'tech_hai',
    role: 'Kỹ thuật viên',
    phone: '0914112233',
    email: 'hai.duong@company.com',
    status: 'Hoạt động'
  },
  {
    id: 26,
    selected: false,
    username: 'mgr_duc',
    role: 'Quản lý',
    phone: '0985223344',
    email: 'duc.cao@company.com',
    status: 'Hoạt động'
  },
  {
    id: 27,
    selected: false,
    username: 'user_phuong',
    role: 'Nhân viên',
    phone: '',
    email: 'phuong.ha@company.com',
    status: 'Đã khóa'
  },
  {
    id: 28,
    selected: false,
    username: 'tech_khoa',
    role: 'Kỹ thuật viên',
    phone: '0936334455',
    email: 'khoa.trinh@company.com',
    status: 'Hoạt động'
  },
  {
    id: 29,
    selected: false,
    username: 'user_nhan',
    role: 'Nhân viên',
    phone: '0977445566',
    email: 'nhan.luong@company.com',
    status: 'Hoạt động'
  },
  {
    id: 30,
    selected: false,
    username: 'mgr_kieu',
    role: 'Quản lý',
    phone: '0948556677',
    email: 'kieu.dao@company.com',
    status: 'Hoạt động'
  },
  {
    id: 31,
    selected: false,
    username: 'tech_viet',
    role: 'Kỹ thuật viên',
    phone: '0909667788',
    email: 'viet.ma@company.com',
    status: 'Chờ kích hoạt'
  },
  {
    id: 32,
    selected: false,
    username: 'user_kieu_anh',
    role: 'Nhân viên',
    phone: '0911778899',
    email: 'kieuanh.ta@company.com',
    status: 'Hoạt động'
  },
  {
    id: 33,
    selected: false,
    username: 'admin_audit',
    role: 'Quản trị viên',
    phone: '0982889900',
    email: 'audit_admin@company.com',
    status: 'Hoạt động'
  }
];

const ROLE_OPTIONS = ['Quản trị viên', 'Kỹ thuật viên', 'Nhân viên', 'Quản lý'];

export default function UserManagementPage() {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [editingRowId, setEditingRowId] = useState(null);
  const [backupRow, setBackupRow] = useState(null);

  // Form Lọc dữ liệu
  const [filterForm, setFilterForm] = useState({
    username: '',
    role: '',
    status: '',
    phone: '',
    email: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    username: '',
    role: '',
    status: '',
    phone: '',
    email: ''
  });

  const [showActionMenu, setShowActionMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Cấu hình các cột cho file Xuất Excel
  const excelColumns = useMemo(() => [
    { header: 'STT', key: 'stt', align: 'center', formatter: (_, __, idx) => idx + 1 },
    { header: 'Tên tài khoản', key: 'username', align: 'left' },
    { header: 'Quyền', key: 'role', align: 'left' },
    { header: 'SĐT', key: 'phone', align: 'center', formatter: (val) => val || '-' },
    { header: 'Email', key: 'email', align: 'left', formatter: (val) => val || '-' },
    { header: 'Trạng thái', key: 'status', align: 'center' }
  ], []);

  // Đóng Action Menu khi bấm ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-wrapper')) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cảnh báo thoát trang nếu chưa lưu
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
        setUsers(prev => prev.map(u => u.id === backupRow.id ? backupRow : u));
      }
      setEditingRowId(null);
      setBackupRow(null);
      setCurrentPage(newPage);
    }
  };

  // Xử lý Bộ lọc
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
    const emptyFilters = { username: '', role: '', status: '', phone: '', email: '' };
    setFilterForm(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (appliedFilters.username.trim() && !user.username.toLowerCase().includes(appliedFilters.username.toLowerCase().trim())) {
        return false;
      }
      if (appliedFilters.role && user.role !== appliedFilters.role) {
        return false;
      }
      if (appliedFilters.status && user.status !== appliedFilters.status) {
        return false;
      }
      if (appliedFilters.phone.trim() && !user.phone.includes(appliedFilters.phone.trim())) {
        return false;
      }
      if (appliedFilters.email.trim() && !user.email.toLowerCase().includes(appliedFilters.email.toLowerCase().trim())) {
        return false;
      }
      return true;
    });
  }, [users, appliedFilters]);

  // Sắp xếp
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = useMemo(() => {
    let sortable = [...filteredUsers];
    if (sortConfig.key !== null) {
      sortable.sort((a, b) => {
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

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
  }, [filteredUsers, sortConfig]);

  const renderSortArrow = (key) => {
    if (sortConfig.key === key) {
      return <span className="sort-arrow">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    }
    return <span className="sort-arrow inactive">▲▼</span>;
  };

  // Phân trang
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Checkbox Select All / Select Row
  const selectAll = useMemo(() => {
    if (filteredUsers.length === 0) return false;
    return filteredUsers.every(u => u.selected);
  }, [filteredUsers]);

  const handleSelectAll = useCallback(() => {
    const targetState = !selectAll;
    const filteredIds = new Set(filteredUsers.map(u => u.id));
    setUsers(prev => prev.map(u => filteredIds.has(u.id) ? { ...u, selected: targetState } : u));
  }, [selectAll, filteredUsers]);

  const handleSelectRow = useCallback((id) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, selected: !u.selected } : u));
  }, []);

  // Thay đổi trực tiếp các ô trong dòng (Sử dụng useCallback để tránh re-render UserTableRow)
  const handleRowChange = useCallback((id, field, value) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  }, []);

  // HÀNH ĐỘNG
  const handleAddUser = () => {
    if (editingRowId !== null && !checkUnsavedChanges()) return;

    const newId = Date.now();
    const newUser = {
      id: newId,
      selected: false,
      username: '',
      role: 'Nhân viên',
      phone: '',
      email: '',
      status: 'Hoạt động'
    };

    setUsers(prev => [newUser, ...prev]);
    setEditingRowId(newId);
    setBackupRow(null);
  };

  const handleEditRole = () => {
    const selected = users.filter(u => u.selected);
    if (selected.length === 0) return alert("Vui lòng chọn tài khoản cần sửa quyền!");
    const newRole = prompt("Nhập quyền mới (Quản trị viên, Kỹ thuật viên, Nhân viên, Quản lý):", selected[0].role);
    if (newRole && ROLE_OPTIONS.includes(newRole)) {
      setUsers(prev => prev.map(u => u.selected ? { ...u, role: newRole } : u));
    } else if (newRole) {
      alert("Quyền không hợp lệ!");
    }
  };

  const handleEditContactInfo = () => {
    const selected = users.filter(u => u.selected);
    if (selected.length !== 1) return alert("Vui lòng chọn đúng 1 tài khoản để sửa thông tin!");

    if (editingRowId !== null && !checkUnsavedChanges()) return;

    setEditingRowId(selected[0].id);
    setBackupRow(JSON.parse(JSON.stringify(selected[0])));
  };

  const handleLockAccount = () => {
    const selectedCount = users.filter(u => u.selected).length;
    if (selectedCount === 0) return alert("Vui lòng chọn tài khoản cần khóa!");

    if (window.confirm(`Bạn có chắc chắn muốn khóa ${selectedCount} tài khoản đã chọn?`)) {
      setUsers(prev => prev.map(u => u.selected ? { ...u, status: 'Đã khóa' } : u));
    }
  };

  const handleUnlockAccount = () => {
    const selectedCount = users.filter(u => u.selected).length;
    if (selectedCount === 0) return alert("Vui lòng chọn tài khoản cần mở khóa!");

    if (window.confirm(`Bạn có chắc chắn muốn mở khóa ${selectedCount} tài khoản đã chọn?`)) {
      setUsers(prev => prev.map(u => u.selected ? { ...u, status: 'Hoạt động' } : u));
    }
  };

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
          <h2 className="plan-page-title">Quản lý tài khoản</h2>

          {/* BỘ LỌC DỮ LIỆU */}
          <div className="filter-bar-container">
            <div className="filter-group">
              <label>Tên tài khoản:</label>
              <input
                type="text"
                className="filter-control"
                placeholder="Nhập tài khoản..."
                value={filterForm.username}
                onChange={(e) => handleFilterInputChange('username', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>

            <div className="filter-group">
              <label>Quyền:</label>
              <select
                className="filter-control"
                value={filterForm.role}
                onChange={(e) => handleFilterInputChange('role', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                {ROLE_OPTIONS.map((role, i) => <option key={i} value={role}>{role}</option>)}
              </select>
            </div>

            <div className="filter-group">
              <label>SĐT:</label>
              <input
                type="text"
                className="filter-control"
                placeholder="Nhập SĐT..."
                value={filterForm.phone}
                onChange={(e) => handleFilterInputChange('phone', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>

            <div className="filter-group">
              <label>Email:</label>
              <input
                type="text"
                className="filter-control"
                placeholder="Nhập email..."
                value={filterForm.email}
                onChange={(e) => handleFilterInputChange('email', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>

            <div className="filter-group">
              <label>Trạng thái:</label>
              <select
                className="filter-control"
                value={filterForm.status}
                onChange={(e) => handleFilterInputChange('status', e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Đã khóa">Đã khóa</option>
              </select>
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

          {/* THANH HÀNH ĐỘNG VÀ XUẤT FILE */}
          <div className="top-action-bar">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <ExportExcelButton
                data={sortedUsers}
                fileName="Danh_sach_tai_khoan"
                tableTitle="DANH SÁCH TÀI KHOẢN NGƯỜI DÙNG"
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
                    <div className="menu-option" onClick={() => { handleAddUser(); setShowActionMenu(false); }}>
                      ➕ Tạo tài khoản
                    </div>
                    <div className="menu-option" onClick={() => { handleEditRole(); setShowActionMenu(false); }}>
                      🔑 Sửa quyền
                    </div>
                    <div className="menu-option" onClick={() => { handleEditContactInfo(); setShowActionMenu(false); }}>
                      ✏️ Sửa thông tin liên lạc
                    </div>
                    <div className="menu-option text-danger" onClick={() => { handleLockAccount(); setShowActionMenu(false); }}>
                      🔒 Khóa tài khoản
                    </div>
                    <div className="menu-option" onClick={() => { handleUnlockAccount(); setShowActionMenu(false); }}>
                      🔓 Mở tài khoản
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              className="btn-save-main"
              disabled={editingRowId === null}
              onClick={handleSavePage}
            >
              Lưu
            </button>
          </div>

          {/* BẢNG BẢN GHI */}
          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              {/* Thêm colgroup để kiểm soát chính xác độ rộng cột */}
              <colgroup>
                <col className="col-checkbox" />
                <col className="col-stt" />
                <col style={{ width: '180px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '220px' }} />
                <col style={{ width: '130px' }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input type="checkbox" checked={selectAll} onChange={handleSelectAll} />
                  </th>
                  <th className="col-stt sortable-th" onClick={() => handleSort('id')}>
                    <div className="th-content">STT {renderSortArrow('id')}</div>
                  </th>
                  <th onClick={() => handleSort('username')} className="sortable-th">
                    <div className="th-content">Tên tài khoản {renderSortArrow('username')}</div>
                  </th>
                  <th onClick={() => handleSort('role')} className="sortable-th">
                    <div className="th-content">Quyền {renderSortArrow('role')}</div>
                  </th>
                  <th onClick={() => handleSort('phone')} className="sortable-th">
                    <div className="th-content">SĐT {renderSortArrow('phone')}</div>
                  </th>
                  <th onClick={() => handleSort('email')} className="sortable-th">
                    <div className="th-content">Email {renderSortArrow('email')}</div>
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable-th">
                    <div className="th-content">Trạng thái {renderSortArrow('status')}</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table-msg">
                      Không tìm thấy tài khoản phù hợp.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <UserTableRow
                      key={user.id}
                      user={user}
                      index={index}
                      startIndex={startIndex}
                      editingRowId={editingRowId}
                      roleOptions={ROLE_OPTIONS}
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