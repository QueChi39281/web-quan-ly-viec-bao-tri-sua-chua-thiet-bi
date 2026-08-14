import React from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, pageSize }) {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Hiển thị <strong>{startItem} - {endItem}</strong> / Tổng số <strong>{totalItems}</strong> bản ghi
      </div>

      <div className="pagination-controls">
        {/* Nút về trang đầu (First) */}
        <button 
          className="btn-page btn-nav" 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(1)}
          title="Trang đầu"
        >
          &laquo;&laquo;
        </button>

        {/* Nút lùi 1 trang (Prev) */}
        <button 
          className="btn-page btn-nav" 
          disabled={currentPage === 1} 
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
        >
          &lsaquo;
        </button>

        {/* Các nút số trang */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`btn-page btn-num ${page === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}

        {/* Nút tiến 1 trang (Next) */}
        <button 
          className="btn-page btn-nav" 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
        >
          &rsaquo;
        </button>

        {/* Nút đến trang cuối (Last) */}
        <button 
          className="btn-page btn-nav" 
          disabled={currentPage === totalPages || totalPages === 0} 
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
        >
          &raquo;&raquo;
        </button>
      </div>
    </div>
  );
}