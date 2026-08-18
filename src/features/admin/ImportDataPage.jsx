import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  X,
  Save,
  Loader2
} from 'lucide-react';
import ManagerSidebar from '../../components/ManagerSidebar';
import HeaderInfo from '../../components/HeaderInfo';
import './ImportDataPage.css';

const IMPORT_TYPES = {
  assets: {
    label: 'Thiết bị',
    storageKey: 'importedAssetsData',
    fileName: 'mau_nhap_thiet_bi.xlsx',
    headers: ['Tên thiết bị', 'Mã TB', 'Nhà cung cấp', 'Vị trí TB', 'Thông tin thiết bị'],
    aliases: {
      assetName: ['assetname', 'ten_thiet_bi', 'ten thiet bi', 'tenthietbi', 'ten thiết bị', 'name'],
      assetCode: ['assetcode', 'ma_tb', 'ma thiet bi', 'mathietbi', 'mã thiết bị', 'code'],
      supplier: ['supplier', 'nha_cung_cap', 'nhacungcap', 'nhà cung cấp'],
      location: ['location', 'vi_tri', 'vi tri', 'vitri', 'vị trí', 'dia_diem', 'diadiem'],
      info: ['info', 'thong_tin', 'thongtin', 'thông tin', 'mo_ta', 'mota', 'description']
    },
    sampleRows: [
      ['Máy in HP LaserJet Pro M404dn', 'TB-VP01', 'Phong Vũ Computer', 'Tầng 2 - Phòng Kế toán', 'In 2 mặt tự động, tốc độ 38 trang/phút'],
      ['Laptop Dell Latitude 5420', 'TB-VP03', 'FPT Shop', 'Tầng 3 - Phòng Nhân sự', 'Core i5-1135G7, RAM 16GB, SSD 512GB'],
      ['Router Wi-Fi MikroTik RB4011iGS+RM', 'TB-VP06', 'Thiết bị Mạng MTC', 'Tầng 3 - Phòng Server', '10 cổng Gigabit Ethernet']
    ],
    mapper: (row, idx) => ({
      id: Date.now() + idx,
      selected: false,
      assetName: row.assetName || '',
      assetCode: row.assetCode || '',
      supplier: row.supplier || '',
      location: row.location || '',
      info: row.info || ''
    })
  },
  supplies: {
    label: 'Vật tư',
    storageKey: 'importedSuppliesData',
    fileName: 'mau_nhap_vat_tu.xlsx',
    headers: ['Tên vật tư', 'Mã vật tư', 'Nhà cung cấp', 'Số lượng nhập', 'Số lượng còn lại'],
    aliases: {
      supplyName: ['supplyname', 'ten_vat_tu', 'ten vat tu', 'ten vật tư', 'name'],
      supplyCode: ['supplycode', 'ma_vat_tu', 'ma vat tu', 'mã vật tư', 'code'],
      supplier: ['supplier', 'nha_cung_cap', 'nhacungcap', 'nhà cung cấp'],
      importQuantity: ['importquantity', 'so_luong_nhap', 'soluongnhap', 'số lượng nhập', 'quantityimport'],
      remainingQuantity: ['remainingquantity', 'so_luong_con_lai', 'soluongconlai', 'số lượng còn lại', 'quantityremaining']
    },
    sampleRows: [
      ['Hộp mực in HP 83A (CF283A)', 'VT-VP01', 'Công ty Máy tính & Thiết bị Lê Bảo Minh', 50, 12],
      ['Ổ cứng SSD Kingston 240GB 2.5 inch', 'VT-VP08', 'Công ty tin học Vĩnh Xuân', 30, 6],
      ['Dây cáp mạng AMP/CommScope Cat6 (Cuộn 305m)', 'VT-VP04', 'Thiết bị Mạng MTC', 10, 2]
    ],
    mapper: (row, idx) => ({
      id: Date.now() + idx,
      selected: false,
      supplyName: row.supplyName || '',
      supplyCode: row.supplyCode || '',
      supplier: row.supplier || '',
      importQuantity: Number(row.importQuantity) || 0,
      remainingQuantity: Number(row.remainingQuantity) || 0
    })
  },
  users: {
    label: 'Tài khoản',
    storageKey: 'importedUsersData',
    fileName: 'mau_nhap_tai_khoan.xlsx',
    headers: ['Tên tài khoản', 'Quyền', 'SĐT', 'Email', 'Trạng thái'],
    aliases: {
      username: ['username', 'ten_dang_nhap', 'tendangnhap', 'tên đăng nhập', 'name'],
      role: ['role', 'quyen', 'quyenhan', 'quyền', 'position'],
      phone: ['phone', 'sdt', 'so_dien_thoai', 'số điện thoại'],
      email: ['email', 'mail'],
      status: ['status', 'trang_thai', 'trangthai', 'trạng thái']
    },
    sampleRows: [
      ['admin_new', 'Quản trị viên', '0901112222', 'admin.new@company.com', 'Hoạt động'],
      ['tech_hien', 'Kỹ thuật viên', '0913334444', 'tech.hien@company.com', 'Hoạt động'],
      ['user_mai', 'Nhân viên', '0985556666', 'mai.nguyen@company.com', 'Hoạt động']
    ],
    mapper: (row, idx) => ({
      id: Date.now() + idx,
      selected: false,
      username: row.username || '',
      role: normalizeRoleValue(row.role),
      phone: row.phone || '',
      email: row.email || '',
      status: normalizeStatusValue(row.status)
    })
  }
};

const normalizeHeader = (value) => {
  const raw = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  return raw.replace(/[^a-z0-9]/g, '');
};

const normalizeRoleValue = (value) => {
  const text = String(value ?? '').trim().toLowerCase();

  if (!text) return 'Nhân viên';
  if (['admin', 'quan tri vien', 'quản trị viên'].includes(text)) return 'Quản trị viên';
  if (['manager', 'quan ly', 'quản lý'].includes(text)) return 'Quản lý';
  if (['technician', 'tech', 'ky thuat vien', 'kỹ thuật viên', 'maintenance staff', 'maintenance_staff'].includes(text)) return 'Kỹ thuật viên';
  return 'Nhân viên';
};

const normalizeStatusValue = (value) => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return 'Hoạt động';
  if (['locked', 'khoa', 'đã khóa', 'da khoa', 'blocked'].includes(text)) return 'Đã khóa';
  return 'Hoạt động';
};

const readStoredData = (storageKey, fallback = []) => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const findMappedValue = (row, aliasList) => {
  for (const alias of aliasList) {
    const key = Object.keys(row).find((headerName) => normalizeHeader(headerName) === normalizeHeader(alias));
    if (key !== undefined && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }

  return '';
};

const getTemplateWorkbook = (type) => {
  const schema = IMPORT_TYPES[type];
  const rows = [schema.headers, ...schema.sampleRows];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Sheet1');
  return { workbook, fileName: schema.fileName };
};

export default function ImportDataPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedType, setSelectedType] = useState('assets');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      alert('Vui lòng chọn file Excel đúng định dạng (.xlsx, .xls)!');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const handleDownloadTemplate = () => {
    const { workbook, fileName } = getTemplateWorkbook(selectedType);
    XLSX.writeFile(workbook, fileName);
  };

  const handleSave = async () => {
    if (!selectedFile) return;

    setIsUploading(true);

    try {
      const schema = IMPORT_TYPES[selectedType];
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      if (!worksheet) {
        throw new Error('File Excel không hợp lệ hoặc rỗng.');
      }

      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!rows.length) {
        throw new Error('File Excel không có dữ liệu để import.');
      }

      const requiredHeaders = Object.values(schema.aliases).flat();
      const actualHeaders = Object.keys(rows[0] || {});
      const missingHeaders = schema.headers.filter((header) => {
        const headerNorm = normalizeHeader(header);
        return !actualHeaders.some((actualHeader) => normalizeHeader(actualHeader) === headerNorm || requiredHeaders.some((alias) => normalizeHeader(alias) === headerNorm));
      });

      if (missingHeaders.length > 0) {
        throw new Error(`File không đúng mẫu. Thiếu cột: ${missingHeaders.join(', ')}`);
      }

      const importedRecords = rows
        .map((row, index) => {
          const payload = {};
          Object.entries(schema.aliases).forEach(([key, aliases]) => {
            payload[key] = findMappedValue(row, aliases);
          });

          const record = schema.mapper(payload, index + 1);
          return record && Object.values(record).some((value) => value !== '' && value !== null && value !== undefined && value !== false) ? record : null;
        })
        .filter(Boolean);

      if (!importedRecords.length) {
        throw new Error(`Không có dòng dữ liệu hợp lệ nào trong file ${selectedFile.name}.`);
      }

      const existingData = readStoredData(schema.storageKey, []);
      const mergedData = [...existingData, ...importedRecords];
      localStorage.setItem(schema.storageKey, JSON.stringify(mergedData));

      alert(`Import dữ liệu ${schema.label.toLowerCase()} thành công: ${importedRecords.length} bản ghi.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error(error);
      alert(error.message || 'Có lỗi xảy ra khi import file Excel.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>

      <div className="page-body-wrapper">
        <ManagerSidebar />

        <main className="main-content-container">
          <div className="import-page-card">
            <div className="import-header">
              <div className="header-title-group">
                <FileSpreadsheet className="title-icon-lucide" size={24} />
                <h2>Nhập file dữ liệu Excel</h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="filter-control"
                  style={{ minWidth: '180px' }}
                >
                  <option value="assets">Thiết bị</option>
                  <option value="supplies">Vật tư</option>
                  <option value="users">Tài khoản</option>
                </select>

                <button
                  type="button"
                  className="btn-download-template"
                  onClick={handleDownloadTemplate}
                >
                  <Download size={16} />
                  <span>Tải file mẫu</span>
                </button>
              </div>
            </div>

            <div className="import-content-body">
              <div
                className={`upload-drag-area ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !selectedFile && fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden-file-input"
                />

                {!selectedFile ? (
                  <div className="upload-placeholder">
                    <div className="cloud-icon-wrapper">
                      <UploadCloud size={48} strokeWidth={1.5} />
                    </div>
                    <p className="primary-text">Kéo & thả file Excel vào đây, hoặc <span>chọn từ máy tính</span></p>
                    <p className="sub-text">Hỗ trợ các định dạng: .XLSX, .XLS</p>
                  </div>
                ) : (
                  <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
                    <div className="file-icon">
                      <FileSpreadsheet size={32} className="excel-file-icon" />
                    </div>
                    <div className="file-details">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-file"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Xóa file này"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="import-footer">
              <button
                type="button"
                className="btn-save-import"
                onClick={handleSave}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 size={18} className="spinner-icon" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Lưu dữ liệu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}