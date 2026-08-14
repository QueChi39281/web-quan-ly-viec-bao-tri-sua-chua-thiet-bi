import React, { useState } from 'react';
import './ApproveModal&RejectModal.css';

export default function ApproveModal({ isOpen, onClose, onSubmit, ticketData }) {
  const [evaluation, setEvaluation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!evaluation.trim()) {
      alert("Vui lòng nhập đánh giá kết quả!");
      return;
    }
    onSubmit(ticketData, evaluation);
    setEvaluation('');
    onClose();
  };

  return (
    <div className="acceptance-modal-overlay">
      <div className="acceptance-modal-card">
        {/* Title: In đậm, 15px, màu XANH BIỂN, căn giữa */}
        <h3 className="approve-modal-title">Duyệt</h3>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="approve-evaluation">Đánh giá kết quả:</label>
            {/* Khung viền xanh, 5 dòng */}
            <textarea
              id="approve-evaluation"
              className="modal-textarea border-blue"
              rows={5}
              value={evaluation}
              onChange={(e) => setEvaluation(e.target.value)}
              placeholder="Nhập đánh giá kết quả nghiệm thu..."
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Hủy
            </button>
            {/* Nút gửi: Chữ trắng, in đậm, nền xanh */}
            <button type="submit" className="btn-modal-send btn-blue">
              Gửi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}