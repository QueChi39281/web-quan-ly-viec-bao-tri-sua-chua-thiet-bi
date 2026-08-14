import React from 'react';

const UserTableRow = React.memo(({
  user,
  index,
  startIndex,
  editingRowId,
  roleOptions = [],
  onSelectRow,
  onRowChange
}) => {
  const isEditing = editingRowId === user.id;

  return (
    <tr className={`${user.selected ? 'selected-row' : ''} ${isEditing ? 'editing-row' : ''}`}>
      {/* Cột Checkbox */}
      <td className="col-checkbox">
        <input
          type="checkbox"
          checked={!!user.selected}
          onChange={() => onSelectRow(user.id)}
        />
      </td>

      {/* Cột STT */}
      <td className="col-stt">{startIndex + index + 1}</td>

      {/* Tên tài khoản */}
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={user.username || ''}
            onChange={(e) => onRowChange(user.id, 'username', e.target.value)}
            placeholder="Tên tài khoản..."
          />
        ) : (
          <span>{user.username || '-'}</span>
        )}
      </td>

      {/* Quyền */}
      <td>
        {isEditing ? (
          <select
            className="table-select"
            value={user.role || ''}
            onChange={(e) => onRowChange(user.id, 'role', e.target.value)}
          >
            {roleOptions.map((role, idx) => (
              <option key={idx} value={role}>
                {role}
              </option>
            ))}
          </select>
        ) : (
          <span>{user.role || '-'}</span>
        )}
      </td>

      {/* SĐT */}
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={user.phone || ''}
            onChange={(e) => onRowChange(user.id, 'phone', e.target.value)}
            placeholder="Số điện thoại..."
          />
        ) : (
          <span>{user.phone || '-'}</span>
        )}
      </td>

      {/* Email */}
      <td>
        {isEditing ? (
          <input
            type="email"
            className="table-input"
            value={user.email || ''}
            onChange={(e) => onRowChange(user.id, 'email', e.target.value)}
            placeholder="Email..."
          />
        ) : (
          <span>{user.email || '-'}</span>
        )}
      </td>

      {/* Trạng thái */}
      <td>
        {isEditing ? (
          <select
            className="table-select"
            value={user.status || 'Hoạt động'}
            onChange={(e) => onRowChange(user.id, 'status', e.target.value)}
          >
            <option value="Hoạt động">Hoạt động</option>
            <option value="Đã khóa">Đã khóa</option>
          </select>
        ) : (
          <span className={`status-badge ${user.status === 'Hoạt động' ? 'badge-success' : 'badge-danger'}`}>
            {user.status || 'Chưa xác định'}
          </span>
        )}
      </td>
    </tr>
  );
});

export default UserTableRow;