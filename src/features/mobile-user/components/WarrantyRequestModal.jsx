import React, { useState } from 'react';
import './ModalStyles.css';

export default function WarrantyRequestModal({ isOpen, onClose, onSubmit, deviceCode }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ deviceCode, reason });
    setReason('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="custom-modal-box">
        <button type="button" className="close-x-btn" onClick={onClose}>X</button>
        <h2 className="modal-title-bold">Yêu cầu bảo hành</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group-custom">
            <label>Mã thiết bị:</label>
            <input type="text" className="modal-input" value={deviceCode || ''} disabled />
          </div>

          <div className="form-group-custom">
            <label>Nêu lý do:</label>
            <textarea
              className="modal-textarea"
              rows="3"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do cần bảo hành..."
              required
            />
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn-custom-outline">Yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  );
}