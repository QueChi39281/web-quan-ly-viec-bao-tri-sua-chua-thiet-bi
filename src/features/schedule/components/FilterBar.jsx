import React from 'react';
import AutocompleteInput from './AutocompleteInput';
import { DEVICE_OPTIONS, STAFF_OPTIONS } from '../../../constants/maintenance';
import './FilterBar.css';

export default function FilterBar({ 
  filterForm, 
  onInputChange, 
  onApply, 
  onReset 
}) {
  const deviceCodesList = ['TB-9981', 'PG-001', 'TB-002', 'TB-003'];

  return (
    <div className="filter-bar-container">
      {/* 1. Loại thiết bị */}
      <div className="filter-group">
        <label>Loại thiết bị:</label>
        <AutocompleteInput
          className="filter-control"
          value={filterForm.deviceType}
          onChange={(val) => onInputChange('deviceType', val)}
          options={DEVICE_OPTIONS}
          placeholder="Nhập loại thiết bị..."
        />
      </div>

      {/* 2. Mã thiết bị */}
      <div className="filter-group">
        <label>Mã thiết bị:</label>
        <AutocompleteInput
          className="filter-control"
          value={filterForm.deviceCode}
          onChange={(val) => onInputChange('deviceCode', val)}
          options={deviceCodesList}
          placeholder="Nhập mã thiết bị..."
        />
      </div>

      {/* 3. Trạng thái TB */}
      <div className="filter-group">
        <label>Trạng thái TB:</label>
        <select 
          className="filter-control"
          value={filterForm.status}
          onChange={(e) => onInputChange('status', e.target.value)}
        >
          <option value="">-- Tất cả --</option>
          <option value="Đang hoạt động">Đang hoạt động</option>
          <option value="Cần sửa chữa">Cần sửa chữa</option>
        </select>
      </div>

      {/* 4. Hành động */}
      <div className="filter-group">
        <label>Hành động:</label>
        <select 
          className="filter-control"
          value={filterForm.actionType}
          onChange={(e) => onInputChange('actionType', e.target.value)}
        >
          <option value="">-- Tất cả --</option>
          <option value="Bảo trì">Bảo trì</option>
          <option value="Sửa chữa">Sửa chữa</option>
        </select>
      </div>

      {/* 5. Nhân viên */}
      <div className="filter-group">
        <label>Nhân viên:</label>
        <AutocompleteInput
          className="filter-control"
          value={filterForm.staff}
          onChange={(val) => onInputChange('staff', val)}
          options={STAFF_OPTIONS}
          placeholder="Nhập tên nhân viên..."
        />
      </div>

      {/* 6. Thời gian thực hiện */}
      <div className="filter-group filter-date-range">
        <label>Thời gian thực hiện:</label>
        <div className="filter-date-inputs">
          <input 
            type="date"
            className="filter-control date-control"
            value={filterForm.fromDate}
            onChange={(e) => onInputChange('fromDate', e.target.value)}
          />
          <span style={{ fontSize: '13px', color: '#64748b' }}>-</span>
          <input 
            type="date"
            className="filter-control date-control"
            value={filterForm.toDate}
            min={filterForm.fromDate}
            onChange={(e) => onInputChange('toDate', e.target.value)}
          />
        </div>
      </div>

      {/* 7. Nút thao tác */}
      <div className="filter-actions-group">
        <button type="button" className="btn-apply-filter" onClick={onApply}>🔍 Lọc</button>
        <button type="button" className="btn-reset-filter" onClick={onReset}>Đặt lại</button>
      </div>
    </div>
  );
}