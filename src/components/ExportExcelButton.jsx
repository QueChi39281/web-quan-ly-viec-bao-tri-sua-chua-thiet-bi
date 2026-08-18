//src/components/ExportExcelButton.jsx
import React from 'react';
import * as XLSX from 'xlsx';
import './ExportExcelButton.css';

export default function ExportExcelButton({ 
  data = [], 
  fileName = 'Danh_sach_yeu_cau',
  tableTitle = 'DANH SÁCH YÊU CẦU NGHIỆM THU',
  columns = []
}) {

  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('Không có dữ liệu để xuất Excel!');
      return;
    }

    // 1. Định nghĩa Headers từ danh sách cột
    const headers = ['STT', ...columns.map(col => col.header)];

    // 2. Chuyển đổi dữ liệu thành các hàng dạng Mảng (Array of Arrays)
    const rows = data.map((item, index) => {
      const rowData = [index + 1]; // Cột STT

      columns.forEach(col => {
        let value = item[col.key];
        if (col.formatter) {
          value = col.formatter(value, item);
        }
        rowData.push(value ?? '-');
      });

      return rowData;
    });

    // 3. Tạo dữ liệu tổng thể:
    // Dòng 1: [Tiêu đề lớn]
    // Dòng 2: [Header xanh: STT, Mã TB, Tên TB...]
    // Dòng 3 trở đi: [Dữ liệu]
    const sheetData = [
      [tableTitle.toUpperCase()], // Row 1 (Index 0 in JS array)
      headers,                     // Row 2 (Index 1)
      ...rows                      // Row 3+ (Index 2+)
    ];

    // 4. Khởi tạo WorkSheet từ mảng dữ liệu
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    const totalCols = headers.length - 1;

    // 5. Gộp ô cho Tiêu đề lớn (Gộp từ ô A1 đến ô cuối của Dòng 1)
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols } }
    ];

    // Style đường viền mỏng
    const borderStyle = {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    };

    // 6. Format Dòng 1: Title (Chữ Xanh, To, Căn Giữa)
    const titleCellAddr = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (worksheet[titleCellAddr]) {
      worksheet[titleCellAddr].s = {
        font: { name: 'Arial', sz: 16, bold: true, color: { rgb: '1D4ED8' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // 7. Format Dòng 2: Header Bảng (Nền Xanh Dương, Chữ Trắng In Đậm)
    for (let colIdx = 0; colIdx <= totalCols; colIdx++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 1, c: colIdx });
      if (worksheet[cellAddr]) {
        worksheet[cellAddr].s = {
          fill: { fgColor: { rgb: '1D4ED8' } },
          font: { name: 'Arial', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderStyle
        };
      }
    }

    // 8. Format Dòng 3 trở đi: Dữ liệu (Căn lề, kẻ viền & màu xen kẽ)
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let rIdx = 2; rIdx <= range.e.r; rIdx++) {
      const isZebra = rIdx % 2 === 1;
      
      for (let cIdx = 0; cIdx <= totalCols; cIdx++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rIdx, c: cIdx });
        if (!worksheet[cellAddr]) continue;

        // Lấy align từ config cột (cấu hình cột ở index cIdx - 1 do cIdx = 0 là STT)
        let align = 'left';
        if (cIdx === 0) {
          align = 'center'; // STT căn giữa
        } else if (columns[cIdx - 1]?.align) {
          align = columns[cIdx - 1].align;
        }

        worksheet[cellAddr].s = {
          font: { name: 'Arial', sz: 10, color: { rgb: '1E293B' } },
          fill: isZebra ? { fgColor: { rgb: 'F8FAFC' } } : { fgColor: { rgb: 'FFFFFF' } },
          alignment: { horizontal: align, vertical: 'center', wrapText: true },
          border: borderStyle
        };
      }
    }

    // 9. Độ rộng cột tự động + Chiều cao dòng
    const colWidths = headers.map((header, colIdx) => {
      let maxLen = header.toString().length;
      
      for (let rIdx = 2; rIdx <= range.e.r; rIdx++) {
        const cellAddr = XLSX.utils.encode_cell({ r: rIdx, c: colIdx });
        const val = worksheet[cellAddr]?.v;
        if (val) {
          maxLen = Math.max(maxLen, val.toString().length);
        }
      }
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });

    worksheet['!cols'] = colWidths;
    
    // Chiều cao dòng: Dòng 1 (40pt), Dòng 2 Header (28pt), Các dòng còn lại (24pt)
    const rowHeights = [{ hpt: 40 }, { hpt: 28 }];
    for (let r = 2; r <= range.e.r; r++) {
      rowHeights.push({ hpt: 24 });
    }
    worksheet['!rows'] = rowHeights;

    // 10. Xuất File Excel
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nghiem_Thu');

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `${fileName}_${timestamp}.xlsx`);
  };

  return (
    <button 
      type="button" 
      className="btn-export-excel" 
      onClick={handleExport}
      title="Xuất Excel đẹp có Tiêu đề & Kẻ viền"
    >
      <span className="excel-icon">📊</span> Xuất Excel
    </button>
  );
}