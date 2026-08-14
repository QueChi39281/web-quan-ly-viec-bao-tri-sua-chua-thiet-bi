import React, { useState } from 'react';
import './AutoScheduleModal.css';

export default function AutoScheduleModal({ isOpen, onClose, onApply }) {
  const [intervalMonths, setIntervalMonths] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  if (!isOpen) return null;

  // Xử lý khi thay đổi ngày "Từ"
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    // Nếu đã chọn ngày "Đến" mà ngày "Đến" nhỏ hơn ngày "Từ" mới -> Tự động xoá/reset ngày "Đến"
    if (endDate && newStartDate && endDate < newStartDate) {
      setEndDate('');
    }
  };

  // Xử lý khi thay đổi ngày "Đến"
  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    if (startDate && newEndDate && newEndDate < startDate) {
      alert("Ngày 'Đến' không được nhỏ hơn ngày 'Từ'!");
      return;
    }
    setEndDate(newEndDate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!startDate) {
      alert("Vui lòng chọn ngày bắt đầu (Từ)");
      return;
    }

    if (!intervalMonths || intervalMonths <= 0) {
      alert("Vui lòng nhập số tháng hợp lệ (lớn hơn 0)");
      return;
    }

    // Ràng buộc kiểm tra bổ sung trước khi Submit
    if (endDate && endDate < startDate) {
      alert("Ngày 'Đến' phải lớn hơn hoặc bằng ngày 'Từ'!");
      return;
    }

    onApply({ intervalMonths, startDate, endDate });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="frame-46-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn-modal-close-x" onClick={onClose} aria-label="Đóng">
          &times;
        </button>

        <h3 className="frame-46-title">Lịch bảo trì tự động</h3>

        <form onSubmit={handleSubmit} className="frame-46-form">
          <div className="form-group">
            <label>Chọn khoảng thời gian bảo trì (tháng)</label>
            <input 
              type="number" 
              min="1"
              placeholder="Mỗi ... tháng"
              value={intervalMonths} 
              onChange={(e) => setIntervalMonths(Number(e.target.value))}
              className="frame-46-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Từ</label>
            <input 
              type="date" 
              value={startDate}
              onChange={handleStartDateChange}
              className="frame-46-input"
              required
            />
          </div>

          <div className="form-group">
            <label>Đến</label>
            <input 
              type="date" 
              value={endDate}
              min={startDate} // Chặn không cho chọn ngày nhỏ hơn startDate trên UI
              onChange={handleEndDateChange}
              className="frame-46-input"
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div className="frame-46-actions">
            <button type="button" className="btn-cancel-gray" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save-blue">
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}