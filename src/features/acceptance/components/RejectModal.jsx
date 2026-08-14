import React, { useState } from 'react';
import './ApproveModal&RejectModal.css';

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
    <div className="acceptance-modal-overlay">
      <div className="acceptance-modal-card">
        {/* Title: In đậm, 15px, màu ĐỎ, căn giữa */}
        <h3 className="reject-modal-title">Từ chối</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="reject-reason">Nêu lý do:</label>
            <textarea
              id="reject-reason"
              className="modal-textarea border-blue"
              rows={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do từ chối nghiệm thu..."
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-modal-send btn-blue">
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}