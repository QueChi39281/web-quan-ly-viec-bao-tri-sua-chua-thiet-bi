import { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';

export function useDeviceReport() {
  const [activeTab, setActiveTab] = useState('bao-hong');
  const [unreadCount, setUnreadCount] = useState(0);
  const [requestList, setRequestList] = useState([]);
  
  // CẬP NHẬT: Thêm trường requestCategory để lưu loại đề xuất quản lý
  const [formData, setFormData] = useState({ 
    deviceId: '', 
    description: '', 
    priority: 'LOW',
    requestCategory: 'YEU_CAU_THIET_BI' // Giá trị mặc định cho Đề xuất
  });

  useEffect(() => {
    const loadInitData = async () => {
      const notifyRes = await reportService.getUnreadNotificationCount();
      if (notifyRes.success) setUnreadCount(notifyRes.data.unreadCount);

      const listRes = await reportService.getMaintenanceRequests();
      if (listRes.success) setRequestList(listRes.data.items);
    };
    loadInitData();
  }, []);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    // Tự động tối ưu hóa tiêu đề dựa trên Tab người dùng đang đứng
    const titlePayload = activeTab === 'bao-hong' 
      // ? `Báo hỏng thiết bị ${formData.deviceId}`
      ? `Báo hỏng thiết bị`
      : `Đề xuất: ${
          formData.requestCategory === 'YEU_CAU_THIET_BI' ? 'Yêu cầu thiết bị' :
          formData.requestCategory === 'TRA_THIET_BI' ? 'Yêu cầu trả thiết bị' : 'Yêu cầu dời lịch bảo trì'
        }`;

    const payload = {
      deviceId: formData.deviceId, 
      title: titlePayload,
      description: formData.description,
      requestType: activeTab === 'bao-hong' ? "CORRECTIVE" : "PROPOSAL", // Phân loại theo spec API của bạn
      priority: formData.priority,
      reportedByUserId: "current-user-uuid" 
    };

    const response = await reportService.createMaintenanceRequest(payload);
    if (response.success) {
      alert("Gửi yêu cầu thành công!");
      setFormData({ deviceId: '', description: '', priority: 'LOW', requestCategory: 'YEU_CAU_THIET_BI' });
      
      const listRes = await reportService.getMaintenanceRequests();
      if (listRes.success) setRequestList(listRes.data.items);
    } else {
      const detail = Array.isArray(response.errors) && response.errors.length > 0
        ? response.errors.map(error => `${error.field || 'request'}: ${error.message}`).join('\n')
        : response.message;
      alert(detail || 'Không thể gửi yêu cầu.');
    }
  };

  const handleConfirmCompletion = async (id) => {
    const response = await reportService.approveCompletion(id, "APPROVED");
    if (response.success) {
      alert(`Đã nghiệm thu & đóng phiếu yêu cầu ${id}`);
    }
  };

  return {
    activeTab,
    setActiveTab,
    unreadCount,
    requestList,
    formData,
    setFormData,
    handleSubmitReport,
    handleConfirmCompletion
  };
}