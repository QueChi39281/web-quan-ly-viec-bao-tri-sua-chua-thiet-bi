import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderInfo from '../../components/HeaderInfo';
import ManagerSidebar from '../../components/ManagerSidebar';
import RejectModal from './components/RejectModal';
import TechnicianRequestsTable from './components/TechnicianRequestsTable';
import Pagination from './components/Pagination';
import ExportExcelButton from '../../components/ExportExcelButton';
import { maintenanceApi } from '../../services/api';
import { REQUEST_TYPES } from '../../constants/technicianRequests';
import './TechnicianRequestsPage.css';

const PAGE_SIZE = 30;

export default function TechnicianRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await maintenanceApi.getRequests({ requestType: 'TECHNICIAN' });
        setRequests(Array.isArray(response) ? response : response?.data || []);
      } catch (error) {
        console.error('Failed to fetch technician requests:', error);
        setRequests([]);
      }
    };
    fetchRequests();
  }, []);

  // Cấu hình các cột cho file Excel xuất ra
  const excelColumns = useMemo(() => [
    { header: 'Mã yêu cầu', key: 'id', align: 'center' },
    { header: 'Tên nhân viên', key: 'employeeName', align: 'left' },
    { 
      header: 'Loại yêu cầu', 
      key: 'type', 
      align: 'left',
      formatter: (val) => REQUEST_TYPES?.[val]?.label || val || '-' 
    },
    { 
      header: 'Mã thiết bị', 
      key: 'deviceCode', 
      align: 'center',
      formatter: (val, row) => {
        const rawCode = row?.deviceCodes || row?.deviceCode || val;
        return Array.isArray(rawCode) ? rawCode.join(', ') : (rawCode || '-');
      }
    },
    { header: 'Nội dung chi tiết', key: 'content', align: 'left' },
    { 
      header: 'Chi phí dự kiến (VNĐ)', 
      key: 'estimatedCost', 
      align: 'right',
      formatter: (val) => typeof val === 'number' ? val.toLocaleString('vi-VN') : (val || '-') 
    },
    { 
      header: 'Ngày tạo', 
      key: 'createdAt', 
      align: 'center',
      formatter: (val) => val ? new Date(val).toLocaleDateString('vi-VN') : '-' 
    },
    { 
      header: 'Trạng thái', 
      key: 'status', 
      align: 'center',
      formatter: (val) => {
        if (val === 'ACCEPTED') return 'Đã chấp nhận';
        if (val === 'REJECTED') return 'Từ chối';
        return 'Chờ duyệt';
      }
    }
  ], []);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedRequests = useMemo(() => {
    let result = Array.isArray(requests) ? [...requests] : [];

    if (selectedTypeFilter !== 'ALL') {
      result = result.filter(item => item.type === selectedTypeFilter);
    }

    result.sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';

      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal).getTime() || 0;
        bVal = new Date(bVal).getTime() || 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [requests, selectedTypeFilter, sortConfig]);

  const totalPages = Math.ceil(processedRequests.length / PAGE_SIZE) || 1;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return processedRequests.slice(start, start + PAGE_SIZE);
  }, [processedRequests, currentPage]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const handleAccept = (ticket) => {
    if (window.confirm(`Xác nhận CHẤP NHẬN yêu cầu từ ${ticket.employeeName}?`)) {
      setRequests(prev => prev.map(item => item.id === ticket.id ? { ...item, status: 'ACCEPTED' } : item));
      
      const formattedDeviceCode = Array.isArray(ticket.deviceCodes) 
        ? ticket.deviceCodes[0] || ''
        : (ticket.deviceCode || ticket.deviceCodes || '');

      const isScrap = ticket.content?.toLowerCase().includes('thanh lý');

      // 1. Trường hợp báo hỏng thanh lý -> Đổi trạng thái thiết bị trực tiếp
      if (ticket.type === 'REPORT_REPAIR' && isScrap) {
        alert(`Đã duyệt yêu cầu thanh lý cho thiết bị ${formattedDeviceCode}`);
        return;
      }

      // 2. Điều hướng sang Trang Lập kế hoạch bảo trì/sửa chữa
      navigate('/maintenance-plan', {
        state: {
          fromApproval: true,
          requestData: {
            deviceCode: formattedDeviceCode,
            deviceStatus: ticket.deviceStatus || 'Đang sử dụng',
            type: ticket.type,
            content: ticket.content || null,
            estimatedCost: ticket.estimatedCost || 0,
            employeeName: ticket.employeeName || null,
            requestId: ticket.id || null
          }
        }
      });
    }
  };

  const handleOpenReject = (ticket) => {
    setSelectedTicket(ticket);
    setIsRejectOpen(true);
  };

  const handleConfirmReject = (ticket, reason) => {
    setRequests(prev => prev.map(item => item.id === ticket.id ? { ...item, status: 'REJECTED', rejectReason: reason } : item));
    setIsRejectOpen(false);
    setSelectedTicket(null);
  };

  const safeTypes = REQUEST_TYPES ? Object.entries(REQUEST_TYPES) : [];

  return (
    <div className="page-root-layout">
      <header className="page-header-wrapper">
        <HeaderInfo />
      </header>

      <div className="page-body-wrapper">
        <aside className="sidebar-container">
          <ManagerSidebar />
        </aside>

        <main className="main-content-container">
          <h2 className="plan-page-title">
            Danh sách yêu cầu từ nhân viên sửa chữa
          </h2>

          <div className="filter-bar-container">
            <div className="filter-group">
              <label>LOẠI YÊU CẦU</label>
              <select 
                className="filter-control"
                value={selectedTypeFilter}
                onChange={(e) => { setSelectedTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">-- Tất cả loại yêu cầu --</option>
                {safeTypes.map(([key, val]) => (
                  <option key={key} value={key}>{val?.label || key}</option>
                ))}
              </select>
            </div>

            <ExportExcelButton 
              data={processedRequests}
              fileName="Danh_sach_yeu_cau_nhan_vien"
              tableTitle="DANH SÁCH YÊU CẦU TỪ NHÂN VIÊN SỬA CHỮA"
              columns={excelColumns}
            />
          </div>

          <div className="frame-33-table-wrapper">
            <TechnicianRequestsTable 
              requests={paginatedRequests}
              expandedId={expandedId}
              toggleExpand={toggleExpand}
              handleAccept={handleAccept}
              handleOpenReject={handleOpenReject}
              sortConfig={sortConfig}
              onSort={handleSort}
              startIndex={(currentPage - 1) * PAGE_SIZE}
            />
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={processedRequests.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />

          {isRejectOpen && (
            <RejectModal 
              isOpen={isRejectOpen}
              onClose={() => setIsRejectOpen(false)}
              onSubmit={handleConfirmReject}
              ticketData={selectedTicket}
            />
          )}
        </main>
      </div>
    </div>
  );
}