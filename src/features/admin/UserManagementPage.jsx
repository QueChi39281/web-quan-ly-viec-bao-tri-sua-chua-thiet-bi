import { useEffect, useMemo, useState } from "react";
import ManagerSidebar from "../../components/ManagerSidebar";
import HeaderInfo from "../../components/HeaderInfo";
import ExportExcelButton from "../../components/ExportExcelButton";
import { userApi } from "../../services/api";
import "./UserManagementPage.css";

const PAGE_SIZE = 10;
const ROLES = ["ALL", "USER", "ADMIN", "MANAGER", "TECHNICIAN"];
const columns = [
  ["employee_code", "Mã nhân viên"],
  ["full_name", "Họ và tên"],
  ["email", "Email"],
  ["department", "Phòng ban"],
  ["position", "Chức vụ"],
  ["phone", "Số điện thoại"],
  ["role", "Vai trò"],
  ["status", "Trạng thái"],
  ["hire_date", "Ngày vào làm"],
];

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN");
};

const normalizeUser = (item) => {
  const employee = item?.employee || {};
  return {
    employee_id: item?.employee_id || "-",
    employee_code: employee.employee_code || "-",
    full_name: employee.full_name || "-",
    email: item?.email || "-",
    department: employee.department?.name || "-",
    position: employee.position || "-",
    phone: employee.phone || "-",
    role: item?.role || "-",
    status: item?.status || "-",
    hire_date: employee.hire_date,
  };
};

export default function UserManagementPage() {
  const [role, setRole] = useState("USER");
  const [employeeCode, setEmployeeCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "", direction: "asc" });

  useEffect(() => {
    let cancelled = false;
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = searchCode
          ? await userApi.getUserByEmployeeCode(searchCode)
          : role === "ALL"
            ? await userApi.getUsers()
            : await userApi.getUsersByRole(role);
        const list = searchCode ? (response ? [response] : []) : response;
        if (!cancelled)
          setUsers((Array.isArray(list) ? list : []).map(normalizeUser));
      } catch (requestError) {
        if (!cancelled) {
          setUsers([]);
          setError(
            requestError?.response?.data?.message || "Không thể tải tài khoản.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUsers();
    return () => {
      cancelled = true;
    };
  }, [role, searchCode]);

  const sortedUsers = useMemo(() => {
    if (!sort.key) return users;
    return [...users].sort((left, right) => {
      const a = String(left[sort.key] || "").toLowerCase();
      const b = String(right[sort.key] || "").toLowerCase();
      const result = a < b ? -1 : a > b ? 1 : 0;
      return sort.direction === "asc" ? result : -result;
    });
  }, [users, sort]);

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE) || 1;
  const visibleUsers = sortedUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const setSortKey = (key) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  const search = () => {
    setSearchCode(employeeCode.trim());
    setPage(1);
  };
  const reset = () => {
    setEmployeeCode("");
    setSearchCode("");
    setPage(1);
  };
  const excelColumns = columns.map(([key, header]) => ({
    key,
    header,
    formatter: key === "hire_date" ? formatDate : undefined,
  }));

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>
      <div className="page-body-wrapper">
        <ManagerSidebar />
        <main className="main-content-container">
          <h2 className="plan-page-title">Quản lý tài khoản</h2>
          <p
            style={{
              margin: "-10px 0 18px",
              color: "#52607a",
              fontWeight: 600,
            }}
          >
            Tra cứu tài khoản nhân viên
          </p>
          <div className="filter-bar-container">
            <div className="filter-group">
              <label htmlFor="role">Vai trò:</label>
              <select
                id="role"
                className="filter-control"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  reset();
                }}
              >
                {ROLES.map((value) => (
                  <option key={value} value={value}>
                    {value === "ALL" ? "Tất cả" : value}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="employee-code">Mã nhân viên:</label>
              <input
                id="employee-code"
                className="filter-control"
                value={employeeCode}
                onChange={(event) => setEmployeeCode(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && search()}
              />
            </div>
            <div className="filter-actions-group">
              <button
                type="button"
                className="btn-apply-filter"
                onClick={search}
              >
                🔍 Tra cứu
              </button>
              <button
                type="button"
                className="btn-reset-filter"
                onClick={reset}
              >
                Đặt lại
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="top-action-bar">
            <ExportExcelButton
              data={sortedUsers}
              fileName="user_accounts"
              tableTitle="DANH SÁCH TÀI KHOẢN"
              columns={excelColumns}
            />
          </div>
          <div className="frame-33-table-wrapper">
            <table className="maintenance-table">
              <thead>
                <tr>
                  {columns.map(([key, label]) => (
                    <th
                      key={key}
                      className="sortable-th"
                      onClick={() => setSortKey(key)}
                    >
                      <div className="th-content">
                        {label}{" "}
                        <span className="sort-arrow">
                          {sort.key === key
                            ? sort.direction === "asc"
                              ? "▲"
                              : "▼"
                            : "▲▼"}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="empty-table-msg">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table-msg">
                      Không tìm thấy tài khoản phù hợp.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={`${user.employee_id}-${user.employee_code}`}>
                      {columns.map(([key]) => (
                        <td key={key}>
                          {key === "hire_date" ? (
                            formatDate(user[key])
                          ) : key === "status" ? (
                            <span
                              className={`status-badge ${user[key] === "active" ? "badge-success" : "badge-danger"}`}
                            >
                              {user[key]}
                            </span>
                          ) : (
                            user[key]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="pagination-wrapper">
            <div className="record-counter">
              Tổng số <strong>{sortedUsers.length}</strong> tài khoản
            </div>
            <div className="modern-pagination">
              <button
                type="button"
                className="page-nav-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    type="button"
                    className={`page-num-btn ${page === number ? "active" : ""}`}
                    key={number}
                    onClick={() => setPage(number)}
                  >
                    {number}
                  </button>
                ),
              )}
              <button
                type="button"
                className="page-nav-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                ›
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
