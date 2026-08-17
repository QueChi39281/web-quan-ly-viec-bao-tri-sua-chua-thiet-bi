import React, { useState, useRef, useEffect } from 'react';

export default function StaffSelectorPopover({ 
  selectedStaffs = [], 
  availableStaffs = [], 
  onToggleStaff, 
  startDate, 
  endDate 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const popoverRef = useRef(null);

  const filteredStaffs = availableStaffs
    .filter(st => st.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 20); // Tối đa 20 nhân viên gợi ý

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="staff-popover-wrapper" ref={popoverRef} style={{ position: 'relative' }}>
      <div 
        className="staff-tags-preview" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '4px 8px', borderRadius: '4px', minHeight: '36px' }}
      >
        {selectedStaffs.length === 0 ? (
          <span style={{ color: '#999' }}>-- Chọn nhân viên --</span>
        ) : (
          selectedStaffs.map(s => (
            <span key={s.id || s.staffId} className="staff-chip" style={{ background: '#e0e0e0', marginRight: '4px', padding: '2px 6px', borderRadius: '4px' }}>
              {s.name}
            </span>
          ))
        )}
      </div>

      {isOpen && (
        <div className="staff-popover-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '280px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: '4px',
          zIndex: 9999, // Đảm bảo đè lên các hàng bên dưới
          padding: '8px'
        }}>
          <input
            type="text"
            placeholder="Tìm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '6px', marginBottom: '8px', boxSizing: 'border-box' }}
          />
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {filteredStaffs.map(st => {
              const isChecked = selectedStaffs.some(s => (s.id || s.staffId) === (st.id || st.staffId));
              return (
                <div 
                  key={st.id || st.staffId} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px' }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleStaff(st)}
                    />
                    <span>{st.name}</span>
                  </label>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: st.status === 'Sẵn sàng' ? '#e6f4ea' : '#fce8e6',
                    color: st.status === 'Sẵn sàng' ? '#137333' : '#c5221f'
                  }}>
                    {st.status} ({startDate || 'N/A'} - {endDate || 'N/A'})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}