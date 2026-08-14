import React, { useState, useEffect } from 'react';
import { deviceApi } from '../../../services/api.js';

export default function ManagementRequestForm({
  formData,
  setFormData,
  onSubmit,
  onScanQR
}) {
  const [devicesList, setDevicesList] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  // Lấy danh sách thiết bị khi chọn loại "YEU_CAU_THIET_BI"
  useEffect(() => {
    if (formData.requestCategory === 'YEU_CAU_THIET_BI') {
      const fetchDevices = async () => {
        try {
          setLoadingDevices(true);
          const response = await deviceApi.getDevices({ limit: 100 });
          const list = response.data?.data || response.data?.items || response.data || [];
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
            <select
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              className="select-field"
              required
            >
              <option value="">
                -- {loadingDevices ? 'Đang tải danh sách...' : 'Chọn thiết bị'} --
              </option>
              {devicesList.map((device) => (
                <option key={device.id || device._id} value={device.id || device._id || device.code}>
                  {device.name || device.deviceName} ({device.code || device.deviceId || 'Mã N/A'})
                </option>
              ))}
            </select>
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