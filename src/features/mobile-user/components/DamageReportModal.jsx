import React, { useState, useEffect } from 'react';
import './DamageReportModal.css';

export default function DamageReportModal({ isOpen, onClose, onSave, initialDeviceCode }) {
  const [formData, setFormData] = useState({
    deviceId: initialDeviceCode || '',
    damageLevel: '',
    solution: ''
  });

  // Tự động điền mã thiết bị khi mở Modal
  useEffect(() => {
    if (initialDeviceCode) {
      setFormData(prev => ({ ...prev, deviceId: initialDeviceCode }));
    }
  }, [initialDeviceCode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="damage-modal-card" onClick={(e) => e.stopPropagation()}>
        
        <button 
          type="button" 
          className="btn-close-modal" 
          onClick={onClose} 
          title="Đóng"
        >
          ✕
        </button>

        <h3 className="modal-title">BIÊN BẢN XÁC ĐỊNH HƯ HỎNG</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mã thiết bị:</label>
            <input
              type="text"
              className="input-blue-border"
              placeholder="Nhập mã thiết bị..."
              value={formData.deviceId}
              onChange={(e) => setFormData({ ...formData, deviceId: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mức độ hư hỏng:</label>
            <textarea
              rows="6"
              className="input-blue-border"
              placeholder="Nhập mức độ hư hỏng..."
              value={formData.damageLevel}
              onChange={(e) => setFormData({ ...formData, damageLevel: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Biện pháp giải quyết:</label>
            <textarea
              rows="5"
              className="input-blue-border"
              placeholder="Nhập biện pháp giải quyết..."
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              required
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save">
              Lưu
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}