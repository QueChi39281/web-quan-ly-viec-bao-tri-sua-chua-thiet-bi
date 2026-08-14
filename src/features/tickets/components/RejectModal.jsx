import React, { useState } from 'react';
import './RejectModal.css';

export default function RejectModal({ isOpen, onClose, onSubmit, ticketData }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Vui lòng nhập lý do từ chối!");
      return;
    }
    onSubmit(ticketData, reason);
    setReason('');
    onClose();
  };

  return (
    <div className="reject-modal-overlay">
      <div className="reject-modal-card">
        {/* Title: In đậm, 15px, màu đỏ, căn giữa */}
        <h3 className="reject-modal-title">Từ chối</h3>

        <form onSubmit={handleSubmit} className="reject-modal-form">
          <div className="form-group">
            <label htmlFor="reject-reason">Nêu lý do:</label>
            {/* Khung viền xanh, độ rộng hiển thị tương đương 5 dòng (rows=5) */}
            <textarea
              id="reject-reason"
              className="reject-textarea"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối yêu cầu tại đây..."
              required
            />
          </div>

          <div className="reject-modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Hủy
            </button>
            {/* Nút gửi: Chữ trắng, in đậm, nền xanh */}
            <button type="submit" className="btn-modal-send">
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}