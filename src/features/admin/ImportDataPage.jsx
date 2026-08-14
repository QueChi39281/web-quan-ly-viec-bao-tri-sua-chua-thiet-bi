import React, { useState, useRef } from 'react';
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

export default function ImportDataPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSetFile = (file) => {
    if (!file) return;
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

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
    alert('Đang tải xuống file Excel dữ liệu mẫu...');
  };

  const handleSave = () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      alert(`Nhập dữ liệu thành công từ file: ${selectedFile.name}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 1200);
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
              <button
                type="button"
                className="btn-download-template"
                onClick={handleDownloadTemplate}
              >
                <Download size={16} />
                <span>Tải file dữ liệu mẫu</span>
              </button>
            </div>

            <div className="import-content-body">
              {/* Khu vực Drag & Drop */}
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
                    <p className="sub-text">Hỗ trợ các định dạng: .XLSX, .XLS (Tối đa 20MB)</p>
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

            {/* Footer */}
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