import React, { useState } from 'react';
import './ModalStyles.css';

export default function PartReturnModal({ isOpen, onClose, onSubmit, availableParts = [] }) {
  const [items, setItems] = useState([{ partName: '', quantity: 1 }]);

  if (!isOpen) return null;

  const handleAddItem = () => setItems([...items, { partName: '', quantity: 1 }]);
  
  const handleRemoveItem = (index) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };
  
  const handleChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(items);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="custom-modal-box">
        <button type="button" className="close-x-btn" onClick={onClose}>X</button>
        <h2 className="modal-title-bold">Yêu cầu trả linh kiện</h2>

        <form onSubmit={handleSubmit}>
          {items.map((item, idx) => (
            <div key={idx} className="form-inline-row">
              <div className="input-grow">
                <input
                  type="text"
                  list={`return-parts-${idx}`}
                  placeholder="Chọn linh kiện..."
                  value={item.partName}
                  onChange={(e) => handleChange(idx, 'partName', e.target.value)}
                  className="modal-input"
                  required
                />
                <datalist id={`return-parts-${idx}`}>
                  {availableParts.map((p, i) => (
                    <option key={i} value={typeof p === 'string' ? p : p.name} />
                  ))}
                </datalist>
              </div>

              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                className="modal-input-qty"
                required
              />

              <button type="button" className="btn-icon-danger" onClick={() => handleRemoveItem(idx)}>X</button>
              {idx === items.length - 1 && (
                <button type="button" className="btn-icon-add" onClick={handleAddItem}>+</button>
              )}
            </div>
          ))}

          <div className="text-center mt-4">
            <button type="submit" className="btn-custom-outline">Yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  );
}