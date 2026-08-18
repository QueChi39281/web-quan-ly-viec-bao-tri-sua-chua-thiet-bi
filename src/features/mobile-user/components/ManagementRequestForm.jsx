import React, { useState, useEffect, useMemo } from 'react';
import { deviceApi } from '../../../services/api.js';

export default function ManagementRequestForm({
  formData,
  setFormData,
  onSubmit,
  onScanQR
}) {
  const [devicesList, setDevicesList] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [typedDeviceName, setTypedDeviceName] = useState('');

  // Lấy danh sách thiết bị khi chọn loại "YEU_CAU_THIET_BI"
  useEffect(() => {
    if (formData.requestCategory === 'YEU_CAU_THIET_BI') {
      const fetchDevices = async () => {
        try {
          setLoadingDevices(true);
          const response = await deviceApi.getDevices({ limit: 100 });
          const list = Array.isArray(response)
            ? response
            : response?.data?.data || response?.data?.items || response?.data || response?.items || [];
          setDevicesList(Array.isArray(list) ? list : []);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách thiết bị:', error);
        } finally {
          setLoadingDevices(false);
        }
      };

      fetchDevices();
    }
  }, [formData.requestCategory]);

  // Kiểm tra điều kiện ẩn trường "Độ khẩn cấp"
  const hidePriority =
    formData.requestCategory === 'TRA_THIET_BI' ||
    formData.requestCategory === 'DOI_LICH_BAO_TRI';

  const filteredDeviceSuggestions = useMemo(() => {
    const keyword = typedDeviceName.trim().toLowerCase();
    if (!keyword) return devicesList.slice(0, 10);

    return devicesList
      .filter((device) => {
        const name = (device.name || device.deviceName || '').toLowerCase();
        const code = (device.code || device.deviceCode || device.deviceId || '').toLowerCase();
        return name.includes(keyword) || code.includes(keyword);
      })
      .slice(0, 10);
  }, [devicesList, typedDeviceName]);

  const handleDeviceNameChange = (value) => {
    setTypedDeviceName(value);
    setFormData({ ...formData, deviceId: value });
  };

  const handleSuggestionSelect = (device) => {
    const selectedValue = device.id || device._id || device.code || device.deviceId || device.name || '';
    setTypedDeviceName(device.name || device.deviceName || '');
    setFormData({ ...formData, deviceId: selectedValue });
  };

  useEffect(() => {
    if (formData.requestCategory !== 'YEU_CAU_THIET_BI') return;

    const rawValue = String(formData.deviceId || '').trim();
    if (!rawValue) {
      setTypedDeviceName('');
      return;
    }

    const normalizedValue = rawValue.toLowerCase();
    const matchedDevice = devicesList.find((device) => {
      const candidates = [
        device.name,
        device.deviceName,
        device.code,
        device.deviceCode,
        device.deviceId,
        device.id,
        device._id
      ].filter(Boolean).map((value) => String(value).trim().toLowerCase());

      return candidates.some((candidate) => candidate === normalizedValue || candidate.includes(normalizedValue));
    });

    if (matchedDevice) {
      const nextName = matchedDevice.name || matchedDevice.deviceName || '';
      const nextValue = matchedDevice.id || matchedDevice._id || matchedDevice.code || matchedDevice.deviceCode || matchedDevice.deviceId || rawValue;
      setTypedDeviceName(nextName);
      setFormData((prev) => ({ ...prev, deviceId: nextValue }));
    } else {
      setTypedDeviceName(rawValue);
    }
  }, [devicesList, formData.deviceId, formData.requestCategory]);

  return (
    <div className="form-card">
      {/* Selector Chọn loại đề xuất */}
      <div className="category-selector">
        <label className="category-label">Chọn loại đề xuất quản lý:</label>
        <select
          value={formData.requestCategory}
          onChange={(e) => setFormData({ ...formData, requestCategory: e.target.value })}
          className="select-field select-center"
        >
          <option value="YEU_CAU_THIET_BI">Yêu cầu thiết bị</option>
          <option value="TRA_THIET_BI">Yêu cầu trả thiết bị</option>
          <option value="DOI_LICH_BAO_TRI">Yêu cầu dời lịch bảo trì</option>
        </select>
      </div>

      <form onSubmit={onSubmit}>
        {/* Mã thiết bị / Select tên thiết bị */}
        <div className="form-group">
          <label className="form-label">
            {formData.requestCategory === 'YEU_CAU_THIET_BI'
              ? 'Tên thiết bị đề xuất:'
              : 'Mã thiết bị:'}
          </label>

          {formData.requestCategory === 'YEU_CAU_THIET_BI' ? (
            <div className="device-search-wrap">
              <input
                type="text"
                value={typedDeviceName}
                onChange={(e) => handleDeviceNameChange(e.target.value)}
                placeholder={loadingDevices ? 'Đang tải danh sách...' : 'Nhập tên thiết bị (gợi ý tối đa 10)'}
                className="input-field"
                list="device-suggestions"
                autoComplete="off"
                required
              />
              <datalist id="device-suggestions">
                {filteredDeviceSuggestions.map((device) => (
                  <option key={device.id || device._id || device.code || device.deviceName} value={device.name || device.deviceName} />
                ))}
              </datalist>
              {filteredDeviceSuggestions.length > 0 && (
                <div className="device-suggestion-box">
                  {filteredDeviceSuggestions.map((device) => (
                    <button
                      key={device.id || device._id || device.code || device.deviceName}
                      type="button"
                      className="device-suggestion-item"
                      onClick={() => handleSuggestionSelect(device)}
                    >
                      {device.name || device.deviceName} {device.code || device.deviceId ? `(${device.code || device.deviceId})` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <input
              type="text"
              placeholder="Nhập mã thiết bị (Ví dụ: LP_03)"
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="input-field"
              required
            />
          )}
        </div>

        {/* Nội dung chi tiết */}
        <div className="form-group">
          <label className="form-label">Nội dung chi tiết:</label>
          <textarea
            placeholder="Nhập lý do, thông tin chi tiết cho đề xuất này..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows="4"
            required
          />
        </div>

        {/* Độ khẩn cấp (Tự động ẩn với Trả thiết bị / Dời lịch) */}
        {!hidePriority && (
          <div className="form-group w-2-3">
            <label className="form-label">Độ cấp khẩn cấp:</label>
            <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                /* Nếu chọn HIGH thì thêm class priority-high để đổi nguyên ô select thành chữ ĐỎ */
                className={`select-field ${formData.priority === 'HIGH' ? 'priority-high' : ''}`}
            >
                <option value="LOW" className="option-normal">
                Bình thường
                </option>
                <option value="HIGH" className="option-danger">
                Khẩn cấp
                </option>
            </select>
          </div>
        )}

        {/* Nút Submit */}
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            Gửi đề xuất
          </button>
        </div>
      </form>

      {/* Nút Quét mã QR */}
      <div className="qr-floating-wrapper">
        <button
          type="button"
          onClick={onScanQR}
          className="qr-button"
          title="Quét mã QR"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3z" />
            <path d="M17 17h3v3h-3z" />
            <path d="M14 20h3" />
            <path d="M20 14v3" />
          </svg>
        </button>
        <span className="qr-badge-text">Quét mã QR</span>
      </div>
    </div>
  );
}