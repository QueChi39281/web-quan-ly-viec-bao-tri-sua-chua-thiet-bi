import React, { useState, useRef, useEffect } from 'react';
import { 
  SUPPLY_SUGGESTIONS, 
  DEVICE_OPTIONS 
} from '../../../constants/maintenance';
import '../MaintenancePlanPage.css';

const safeDeviceOptions = DEVICE_OPTIONS || [];
const safeSupplySuggestions = SUPPLY_SUGGESTIONS || [];

const MaintenanceRow = React.memo(({ 
  row, 
  index, 
  startIndex, 
  todayStr, 
  isEditing,
  availableStaffs = [], // Danh sách NV kèm trạng thái: [{ id, name, status }]
  handleSelectRow, 
  handleSelectDeviceType, 
  handleRowChange,
  handleSupplyChange, 
  handleAddSupplyItem, 
  handleRemoveSupplyItem, 
  handleDateChange,
  onToggleStaff // Function xử lý chọn/bỏ chọn NV: (rowId, staffObj) => void
}) => {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const selectedSupplyNames = row.supplies ? row.supplies.map(s => s.name).filter(Boolean) : [];
  const availableSupplies = safeSupplySuggestions.filter(s => !selectedSupplyNames.includes(s.name));

  // Đóng dropdown chọn nhân viên khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowStaffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <tr className={`${row.selected ? 'row-selected' : ''} ${isEditing ? 'row-editing' : ''}`}>
      <td>
        <input 
          type="checkbox" 
          checked={!!row.selected} 
          onChange={() => handleSelectRow(row.id)} 
        />
      </td>
      <td>{startIndex + index + 1}</td>

      {/* LOẠI THIẾT BỊ */}
      <td>
        {isEditing ? (
          <>
            <textarea 
              className="table-textarea"
              rows={2}
              list={`devices-${row.id}`}
              value={row.deviceType || ''}
              onChange={(e) => handleSelectDeviceType(row.id, e.target.value)}
              placeholder="Nhập hoặc chọn..."
            />
            <datalist id={`devices-${row.id}`}>
              {safeDeviceOptions.map((dev, i) => <option key={i} value={dev} />)}
            </datalist>
          </>
        ) : (
          <div className="read-only-text">{row.deviceType || '-'}</div>
        )}
      </td>

      {/* MÃ THIẾT BỊ (1 Kế hoạch - 1 Thiết bị) */}
      <td>
        {isEditing ? (
          <input 
            type="text"
            className="table-input"
            value={row.deviceCode || ''}
            onChange={(e) => handleRowChange(row.id, 'deviceCode', e.target.value)}
            placeholder="Mã thiết bị..."
          />
        ) : (
          <span className="badge-device-single">
            {row.deviceCode || 'Chưa chọn'}
          </span>
        )}
      </td>

      {/* TRẠNG THÁI THIẾT BỊ */}
      <td>
        <span className={`status-badge status-${row.status === 'Cần sửa chữa' ? 'danger' : 'success'}`}>
          {row.status || 'Đang hoạt động'}
        </span>
      </td>

      {/* HÀNH ĐỘNG */}
      <td>
        {isEditing ? (
          <select 
            className="table-select action-select"
            value={row.actionType || 'Bảo trì'}
            onChange={(e) => handleRowChange(row.id, 'actionType', e.target.value)}
          >
            <option value="Bảo trì">Bảo trì</option>
            <option value="Sửa chữa">Sửa chữa</option>
          </select>
        ) : (
          <span>{row.actionType || 'Bảo trì'}</span>
        )}
      </td>

      {/* NỘI DUNG BẢO TRÌ */}
      <td>
        {isEditing ? (
          <textarea 
            className="table-textarea"
            rows={2}
            value={row.content || ''}
            onChange={(e) => handleRowChange(row.id, 'content', e.target.value)}
            placeholder="Nhập nội dung công việc..."
          />
        ) : (
          <div className="read-only-text">{row.content || '-'}</div>
        )}
      </td>

      {/* SỐ LƯỢNG VẬT TƯ */}
      <td>
        {isEditing ? (
          <div className="supplies-cell">
            {row.supplies && row.supplies.map((s, sIdx) => (
              <div key={sIdx} className="supply-item-row">
                <input 
                  type="text" 
                  className="table-input flex-1"
                  list={`supplies-list-${row.id}-${sIdx}`}
                  value={s.name || ''}
                  onChange={(e) => handleSupplyChange(row.id, sIdx, 'name', e.target.value)}
                  placeholder="Tên vật tư"
                />
                <datalist id={`supplies-list-${row.id}-${sIdx}`}>
                  {availableSupplies.concat(s.name ? [{ name: s.name }] : []).map((sup, i) => (
                    <option key={i} value={sup.name} />
                  ))}
                </datalist>
                <input 
                  type="number" 
                  className="table-input qty-input"
                  min={1}
                  value={s.quantity || 1}
                  onChange={(e) => handleSupplyChange(row.id, sIdx, 'quantity', e.target.value)}
                />
                {row.supplies.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-remove-supply"
                    onClick={() => handleRemoveSupplyItem(row.id, sIdx)}
                    title="Xóa vật tư"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              className="btn-add-supply"
              onClick={() => handleAddSupplyItem(row.id)}
            >
              + Thêm vật tư
            </button>
          </div>
        ) : (
          <div className="supplies-read-only">
            {row.supplies && row.supplies.length > 0 ? (
              row.supplies.map((s, idx) => (
                <div key={idx}>
                  {s.name ? `${s.name} (x${s.quantity})` : '-'}
                </div>
              ))
            ) : (
              <span>-</span>
            )}
          </div>
        )}
      </td>

      {/* KINH PHÍ */}
      <td>
        {isEditing ? (
          <input 
            type="number" 
            className="table-input font-bold"
            value={row.cost || 0}
            onChange={(e) => handleRowChange(row.id, 'cost', Number(e.target.value) || 0)}
          />
        ) : (
          <strong>{(row.cost || 0).toLocaleString('vi-VN')} đ</strong>
        )}
      </td>

      {/* NHÂN VIÊN THỰC HIỆN (Giao việc cho Nhiều Nhân viên + Trạng thái) */}
      <td>
        <div className="staff-assignment-container" ref={dropdownRef}>
          {/* Danh sách thẻ Nhân viên đã chọn */}
          <div className="assigned-tags-wrapper">
            {row.assignedStaffs && row.assignedStaffs.length > 0 ? (
              row.assignedStaffs.map((st) => (
                <span 
                  key={st.staffId || st.id} 
                  className={`staff-tag status-${(st.status || 'sẵn sàng').toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {st.name} <small>({st.status || 'Sẵn sàng'})</small>
                </span>
              ))
            ) : (
              <span className="text-muted" style={{ fontSize: '12px' }}>Chưa phân công</span>
            )}
          </div>

          {/* Bảng chọn nhiều NV khi bấm Chỉnh sửa */}
          {isEditing && (
            <div className="staff-picker-wrapper">
              <button 
                type="button" 
                className="btn-toggle-staff-select"
                onClick={() => setShowStaffDropdown(!showStaffDropdown)}
              >
                ⚙️ Chọn nhân viên ({row.assignedStaffs?.length || 0})
              </button>

              {showStaffDropdown && (
                <div className="staff-selector-dropdown">
                  <div className="dropdown-header">Chọn NV tham gia:</div>
                  <div className="dropdown-list">
                    {availableStaffs.map((staff) => {
                      const isChecked = row.assignedStaffs?.some(
                        (s) => (s.staffId || s.id) === (staff.id || staff.staffId)
                      );
                      return (
                        <label key={staff.id || staff.staffId} className="staff-checkbox-item">
                          <input 
                            type="checkbox" 
                            checked={!!isChecked}
                            onChange={() => onToggleStaff && onToggleStaff(row.id, staff)}
                          />
                          <span className="staff-name">{staff.name}</span>
                          <span className={`status-pill ${staff.status === 'Sẵn sàng' ? 'ready' : 'busy'}`}>
                            {staff.status}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </td>

      {/* THỜI GIAN THỰC HIỆN */}
      <td>
        <div className="date-range-cell">
          {row.autoInterval && (
            <div className="auto-interval-badge">
              🔄 Lặp {row.autoInterval} tháng/lần
            </div>
          )}
          {isEditing ? (
            <>
              <div className="date-group">
                <span>Từ:</span>
                <input 
                  type="date" 
                  className="table-input-date"
                  min={todayStr}
                  value={row.startDate || ''}
                  onChange={(e) => handleDateChange(row.id, 'startDate', e.target.value)}
                />
              </div>
              <div className="date-group">
                <span>Đến:</span>
                <input 
                  type="date" 
                  className="table-input-date"
                  min={row.startDate || todayStr}
                  value={row.endDate || ''}
                  onChange={(e) => handleDateChange(row.id, 'endDate', e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="read-only-date">
              <div>Từ: {row.startDate || '-'}</div>
              <div>Đến: {row.endDate || '-'}</div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

export default MaintenanceRow;