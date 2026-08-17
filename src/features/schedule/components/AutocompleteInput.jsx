import React, { useState, useRef, useEffect } from 'react';

export default function AutocompleteInput({
  value = '',
  onChange,
  options = [],
  placeholder = 'Nhập để tìm kiếm...',
  className = 'filter-control',
  maxSuggestions = 20,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Lọc danh sách theo từ khóa và giới hạn tối đa maxSuggestions (mặc định 20)
  const filteredOptions = options
    .filter((opt) => {
      const optionText = typeof opt === 'string' ? opt : opt?.label || '';
      return optionText.toLowerCase().includes((value || '').toLowerCase());
    })
    .slice(0, maxSuggestions);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    const selectedValue = typeof option === 'string' ? option : option.value || option.label;
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className={className}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        autoComplete="off"
      />

      {isOpen && filteredOptions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
          }}
        >
          {filteredOptions.map((item, index) => {
            const label = typeof item === 'string' ? item : item.label;
            return (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#1f2937',
                  borderBottom: index !== filteredOptions.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                {label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}