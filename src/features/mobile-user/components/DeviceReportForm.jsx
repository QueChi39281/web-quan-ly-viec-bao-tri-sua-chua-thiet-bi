import React from 'react';

export default function DeviceReportForm({
  formData,
  setFormData,
  onSubmit,
  onScanQR
}) {
  return (
    <div className="form-card">
      <h3 className="form-title">BÁO CÁO HƯ HỎNG THIẾT BỊ</h3>

      <form onSubmit={onSubmit}>
        {/* Mã thiết bị */}
        <div className="form-group">
          <label className="form-label">Mã thiết bị:</label>
          <input
            type="text"
            placeholder="Nhập mã thiết bị (tối đa 20 ký tự)"
            maxLength={20}
            value={formData.deviceId}
            onChange={(e) => setFormData({ ...formData, deviceId: e.target.value.slice(0, 20) })}
            className="input-field"
            required
          />
        </div>

        {/* Nội dung chi tiết */}
        <div className="form-group">
          <label className="form-label">Nội dung chi tiết:</label>
          <textarea
            placeholder="Mô tả tình trạng lỗi chi tiết..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-field"
            rows="4"
            required
          />
        </div>

        {/* Độ khẩn cấp */}
        <div className="form-group w-2-3">
          <label className="form-label">Độ cấp khẩn cấp:</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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

        {/* Nút Submit */}
        <div className="form-actions">
          <button type="submit" className="btn-submit">
            Gửi báo lỗi
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