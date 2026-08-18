import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  availableDevices = [],
  handleSelectRow, 
  handleSelectDeviceType, 
  handleDeviceCodeChange,
  handleRowChange,
  handleSupplyChange, 
  handleAddSupplyItem, 
  handleRemoveSupplyItem, 
  handleDateChange,
  onToggleStaff // Function xử lý chọn/bỏ chọn NV: (rowId, staffObj) => void
}) => {
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const [showDeviceSuggestions, setShowDeviceSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 240 });
  const [deviceSuggestionPosition, setDeviceSuggestionPosition] = useState({ top: 0, left: 0, width: 180 });
  const dropdownRef = useRef(null);
  const staffButtonRef = useRef(null);
  const staffDropdownRef = useRef(null);
  const deviceInputRef = useRef(null);
  const deviceSuggestionsRef = useRef(null);

  const selectedSupplyNames = row.supplies ? row.supplies.map(s => s.name).filter(Boolean) : [];
  const availableSupplies = safeSupplySuggestions.filter(s => !selectedSupplyNames.includes(s.name));

  // Đóng dropdown chọn nhân viên khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !staffDropdownRef.current?.contains(e.target) &&
        !deviceSuggestionsRef.current?.contains(e.target)
      ) {
        setShowStaffDropdown(false);
      }
      if (
        deviceInputRef.current &&
        !deviceInputRef.current.contains(e.target) &&
        !deviceSuggestionsRef.current?.contains(e.target)
      ) {
        setShowDeviceSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showStaffDropdown) return undefined;

    const updateDropdownPosition = () => {
      const buttonRect = staffButtonRef.current?.getBoundingClientRect();
      if (!buttonRect) return;

      const dropdownHeight = 280;
      const openAbove = buttonRect.bottom + dropdownHeight > window.innerHeight && buttonRect.top > dropdownHeight;
      const top = openAbove ? buttonRect.top - dropdownHeight - 4 : buttonRect.bottom + 4;
      const left = Math.min(buttonRect.left, Math.max(8, window.innerWidth - 268));

      setDropdownPosition({
        top: Math.max(8, top),
        left,
        width: Math.max(240, buttonRect.width)
      });
    };

    updateDropdownPosition();
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);
    return () => {
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [showStaffDropdown]);

  useEffect(() => {
    if (!showDeviceSuggestions) return undefined;

    const updateDeviceSuggestionPosition = () => {
      const inputRect = deviceInputRef.current?.getBoundingClientRect();
      if (!inputRect) return;

      const maxHeight = 220;
      const openAbove = inputRect.bottom + maxHeight > window.innerHeight && inputRect.top > maxHeight;
      setDeviceSuggestionPosition({
        top: openAbove ? inputRect.top - maxHeight - 4 : inputRect.bottom + 4,
        left: inputRect.left,
        width: Math.max(180, inputRect.width)
      });
    };

    updateDeviceSuggestionPosition();
    window.addEventListener('resize', updateDeviceSuggestionPosition);
    window.addEventListener('scroll', updateDeviceSuggestionPosition, true);
    return () => {
      window.removeEventListener('resize', updateDeviceSuggestionPosition);
      window.removeEventListener('scroll', updateDeviceSuggestionPosition, true);
    };
  }, [showDeviceSuggestions, row.deviceCode]);

  const deviceSuggestions = availableDevices
    .map((device) => ({
      device,
      code: device.code || device.device_code || device.deviceCode || device.asset_code || device.serial_number || device.serialNumber || ''
    }))
    .filter(({ code }) => code.toLowerCase().includes(String(row.deviceCode || '').trim().toLowerCase()))
    .slice(0, 50);

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
          <>
            <input 
              type="text"
              className="table-input"
              autoComplete="off"
              ref={deviceInputRef}
              value={row.deviceCode || ''}
              onFocus={() => setShowDeviceSuggestions(true)}
              onChange={(e) => handleDeviceCodeChange
                ? handleDeviceCodeChange(row.id, e.target.value)
                : handleRowChange(row.id, 'deviceCode', e.target.value)}
              placeholder="Mã thiết bị..."
            />
            {showDeviceSuggestions && createPortal(
              <div
                ref={deviceSuggestionsRef}
                className="device-suggestions-dropdown"
                style={deviceSuggestionPosition}
              >
                {deviceSuggestions.length > 0 ? deviceSuggestions.map(({ device, code }) => (
                  <button
                    type="button"
                    className="device-suggestion-item"
                    key={`${device.id || device._id}-${code}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      handleDeviceCodeChange?.(row.id, code);
                      setShowDeviceSuggestions(false);
                    }}
                  >
                    <strong>{code}</strong>
                    <span>{device.name || device.model || device.device_name || device.deviceName || 'Thiết bị'}</span>
                  </button>
                )) : (
                  <div className="device-suggestions-empty">Không tìm thấy thiết bị</div>
                )}
              </div>,
              document.body
            )}
          </>
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
                ref={staffButtonRef}
                onClick={() => {
                  setShowStaffDropdown(prev => !prev);
                  setStaffSearch('');
                }}
              >
                ⚙️ Chọn nhân viên ({row.assignedStaffs?.length || 0})
              </button>

              {showStaffDropdown && createPortal(
                <div
                  ref={staffDropdownRef}
                  className="staff-selector-dropdown"
                  style={dropdownPosition}
                >
                  <div className="dropdown-header">Chọn NV tham gia:</div>
                  <input
                    type="search"
                    className="staff-search-input"
                    value={staffSearch}
                    onChange={(event) => setStaffSearch(event.target.value)}
                    placeholder="Gõ tên hoặc mã nhân viên..."
                    aria-label="Tìm nhân viên"
                  />
                  <div className="dropdown-list">
                    {availableStaffs
                      .filter((staff) => {
                        const query = staffSearch.trim().toLowerCase();
                        if (!query) return true;
                        return `${staff.name || ''} ${staff.id || staff.staffId || ''}`.toLowerCase().includes(query);
                      })
                      .map((staff) => {
                      const staffId = String(staff.id || staff.staffId || '');
                      const isChecked = row.assignedStaffs?.some(
                        (s) => String(s.staffId || s.id || '') === staffId
                      );
                      return (
                        <label key={staffId} className="staff-checkbox-item">
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
                    {availableStaffs.length > 0 && !availableStaffs.some((staff) => `${staff.name || ''} ${staff.id || staff.staffId || ''}`.toLowerCase().includes(staffSearch.trim().toLowerCase())) && (
                      <div className="staff-empty-result">Không tìm thấy nhân viên</div>
                    )}
                  </div>
                </div>,
                document.body
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