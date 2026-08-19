import { useState, useEffect } from 'react';
import { getCurrentEmployeeId } from '../../../services/api.js';
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
    requestCategory: 'YEU_CAU_THIET_BI',
    planId: ''
  });

  useEffect(() => {
    const loadInitData = async () => {
      const notifyRes = await reportService.getUnreadNotificationCount();
      if (notifyRes.success) setUnreadCount(notifyRes.data.unreadCount);

    };
    loadInitData();
  }, []);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    
    const employeeId = Number(getCurrentEmployeeId()) || getCurrentEmployeeId();
    const deviceId = String(formData.deviceId || '').trim();
    const planId = Number(formData.planId);
    if (!employeeId || !deviceId || (activeTab !== 'bao-hong' && !planId)) {
      alert(activeTab === 'bao-hong'
        ? 'Vui lòng nhập mã thiết bị và nội dung báo hỏng.'
        : 'Vui lòng chọn đầy đủ thiết bị và kế hoạch liên quan.');
      return;
    }

    try {
      const repairDeviceId = activeTab === 'bao-hong'
        ? await reportService.resolveDeviceId(deviceId)
        : deviceId;
      const payload = activeTab === 'bao-hong'
        ? {
            created_by: employeeId,
            device_id: repairDeviceId,
            priority: String(formData.priority || 'LOW').toLowerCase(),
            description: formData.description,
          }
        : formData.requestCategory === 'DOI_LICH_BAO_TRI'
        ? {
            created_by: employeeId,
            plan_id: planId,
            reason: formData.description,
            suggestion: formData.description,
          }
        : {
            created_by: employeeId,
            plan_id: planId,
            request_type: formData.requestCategory === 'TRA_THIET_BI'
              ? 'dispose'
              : 'send_warranty',
            reason: formData.description,
          };
      const response = activeTab === 'bao-hong'
        ? await reportService.createRepair(payload)
        : formData.requestCategory === 'DOI_LICH_BAO_TRI'
        ? await reportService.createAdjustPlan(payload)
        : await reportService.createMaintenanceRequest(payload);
      if (response.success) {
      alert("Gửi yêu cầu thành công!");
      if (response.data) {
        setRequestList((previous) => [response.data, ...previous.filter((item) => String(item.id) !== String(response.data.id))]);
      }
      setFormData({ deviceId: '', description: '', priority: 'LOW', requestCategory: 'YEU_CAU_THIET_BI', planId: '', solution: '', repairAction: 'normal_repair' });
      
      } else {
        const detail = Array.isArray(response.errors) && response.errors.length > 0
          ? response.errors.map(error => `${error.field || 'request'}: ${error.message}`).join('\n')
          : response.message;
        alert(detail || 'Không thể gửi yêu cầu.');
      }
    } catch (error) {
      console.error('Lỗi khi gửi yêu cầu:', error);
      alert(
        error?.response?.data?.message
        || error?.data?.message
        || error?.message
        || 'Không thể gửi yêu cầu.'
      );
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