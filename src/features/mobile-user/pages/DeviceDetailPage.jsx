import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import HeaderInfo from '../components/HeaderInfo';
import TechMenuBar from '../components/TechMenuBar';
import PartRequestModal from '../components/PartRequestModal';
import PartReturnModal from '../components/PartReturnModal';
import WarrantyRequestModal from '../components/WarrantyRequestModal';
import DamageReportModal from '../components/DamageReportModal';
import { aiApi, deviceApi, getCurrentEmployeeId, inventoryApi, maintenanceApi } from '../../../services/api';
import './DeviceDetailPage.css';

// Thêm Icon AI (Nếu chưa cài lucide-react, bạn có thể thay bằng SVG bên dưới)
import { Bot, Send } from 'lucide-react'; 

const DEVICE_STATES = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  BROKEN: 'broken',
  UNDER_MAINTENANCE: 'under_maintenance',
  AWAITING_PARTS: 'awaiting_parts',
  UNDER_WARRANTY: 'under_warranty',
  TESTING: 'testing',
  AWAITING_DISPOSED: 'awaiting_disposed',
  DISPOSED: 'disposed'
};

export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const planId = location.state?.planId;

  const [activeNavMenu, setActiveNavMenu] = useState('');

  const goToSchedule = () => navigate('/technician/schedule');
  const goToHome = () => navigate('/technician-dashboard');
  const goToUnassignedTasks = () => navigate('/technician/tasks/unassigned');
  const goToAssignedTasks = () => navigate('/technician/tasks/assigned');

  // State cho Chat AI
  const [aiInput, setAiInput] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Xin chào! Tớ là Trợ lý AI Kỹ thuật (*v*)' },
    { sender: 'ai', text: 'Hãy chọn yêu cầu hoặc mô tả sự cố bạn đang gặp phải nhé!' }
  ]);

  const [deviceData, setDeviceData] = useState({
    deviceCode: deviceId || '',
    deviceName: '',
    location: '',
    manufacturer: '',
    warrantyPeriod: '',
    userErrorDescription: '',
    urgency: '',
    status: '',
    deviceState: '',
    hasReportForm: false,
    partStatus: ''
  });

  const [requestedParts, setRequestedParts] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);

  // Modals state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);

  useEffect(() => {
    if (!deviceId) return;

    const loadDevice = async () => {
      try {
        const response = await deviceApi.getDeviceById(deviceId);
        const device = response?.data || response || {};
        setDeviceData(prev => ({
          ...prev,
          deviceCode: device.code || device.device_code || device.deviceCode || device.serial_number || deviceId,
          deviceName: device.name || device.device_name || device.deviceName || device.model || '',
          location: device.location || device.current_location || device.assigned_location || '',
          manufacturer: device.manufacturer || device.manufacturer_name || '',
          warrantyPeriod: device.warranty_end_date || device.warrantyEndDate || '',
          status: device.state || device.status || '',
          deviceState: device.state || device.status || '',
          userErrorDescription: device.description || '',
        }));
      } catch (error) {
        console.error('Không thể tải chi tiết thiết bị:', error);
      }
    };

    loadDevice();
  }, [deviceId]);

  useEffect(() => {
    let cancelled = false;

    const loadConversation = async () => {
      try {
        const conversations = await aiApi.getConversations();
        const latestConversation = Array.isArray(conversations) ? conversations[0] : null;
        if (!latestConversation?.id || cancelled) return;

        const messages = await aiApi.getMessages(latestConversation.id);
        if (cancelled) return;

        setConversationId(latestConversation.id);
        if (Array.isArray(messages) && messages.length > 0) {
          setChatMessages(messages.map((message) => ({
            sender: message.role === 'user' ? 'user' : 'ai',
            text: message.content || ''
          })));
        }
      } catch (error) {
        if (!cancelled) console.error('Không thể tải hội thoại AI:', error);
      }
    };

    loadConversation();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const loadAvailableParts = async () => {
      try {
        const response = await inventoryApi.getItems({ limit: 100 });
        const items = Array.isArray(response) ? response : response?.data || [];
        setAvailableParts(items.map((inventory) => {
          const item = inventory?.item || inventory;
          const id = inventory?.id || item?.id || inventory?.inventory_id;
          const name = item?.name || item?.item_name || item?.supplyName || '';
          return id && name ? { id, name } : null;
        }).filter(Boolean));
      } catch (error) {
        console.error('Không thể tải danh sách linh kiện:', error);
        setAvailableParts([]);
      }
    };

    loadAvailableParts();
  }, []);

  const handleToggleState = () => {
    const isMaintenance = deviceData.deviceState === DEVICE_STATES.UNDER_MAINTENANCE;
    const nextState = isMaintenance ? DEVICE_STATES.BROKEN : DEVICE_STATES.UNDER_MAINTENANCE;
    
    setDeviceData(prev => ({
      ...prev,
      deviceState: nextState,
      status: nextState === DEVICE_STATES.UNDER_MAINTENANCE ? 'Bảo trì' : 'Đang sửa'
    }));
  };

  const handleOpenPartRequest = () => {
    if (!deviceData.hasReportForm) {
      alert("Vui lòng Lập biên bản xác định hư hỏng trước khi yêu cầu linh kiện!");
      return;
    }
    setIsPartModalOpen(true);
  };

  const handleCreateReport = () => {
    setIsDamageModalOpen(true);
  };

  const handleSaveDamageReport = async (formData) => {
    if (!planId) {
      alert('Không xác định được kế hoạch bảo trì của thiết bị này.');
      return;
    }

    try {
      await maintenanceApi.createDamageReport({
        created_by: Number(getCurrentEmployeeId()) || getCurrentEmployeeId(),
        plan_id: Number(planId),
        device_id: Number(deviceId),
        description: formData.damageLevel,
        solution: formData.solution,
        repair_action: 'normal_repair'
      });
      setDeviceData(prev => ({ ...prev, hasReportForm: true }));
      setIsDamageModalOpen(false);
      alert('Đã gửi báo cáo hư hỏng đến quản lý.');
    } catch (error) {
      console.error('Không thể gửi báo cáo hư hỏng:', error);
      alert(error?.message || 'Không thể gửi báo cáo hư hỏng.');
    }
  };

  const handleConfirmParts = () => {
    alert("Đã kiểm tra và xác nhận nhận đúng/đủ linh kiện!");
    setDeviceData(prev => ({ ...prev, partStatus: 'Đã phê duyệt' }));
  };

  const handleAcceptanceRequest = async () => {
    if (!planId) {
      alert('Không xác định được kế hoạch bảo trì của thiết bị này.');
      return;
    }

    try {
      await maintenanceApi.createAcceptanceReport({
        created_by: Number(getCurrentEmployeeId()) || 1,
        plan_id: Number(planId),
        description: deviceData.userErrorDescription || `Đề nghị nghiệm thu thiết bị ${deviceData.deviceCode}`,
        review: ''
      });
      alert('Đã gửi yêu cầu nghiệm thu đến quản lý.');
    } catch (error) {
      console.error('Không thể gửi yêu cầu nghiệm thu:', error);
      alert(error?.message || 'Không thể gửi yêu cầu nghiệm thu.');
    }
  };

  const handleWarrantyRequest = async ({ reason }) => {
    if (!planId) {
      alert('Không xác định được kế hoạch bảo trì của thiết bị này.');
      return;
    }

    try {
      await maintenanceApi.createMaintenanceRequest({
        created_by: Number(getCurrentEmployeeId()) || getCurrentEmployeeId(),
        plan_id: Number(planId),
        request_type: 'send_warranty',
        reason,
      });
      alert('Đã gửi yêu cầu bảo hành tới quản lý thành công!');
    } catch (error) {
      console.error('Không thể gửi yêu cầu bảo hành:', error);
      alert(error?.message || 'Không thể gửi yêu cầu bảo hành.');
    }
  };

  const handleItemRequest = async (items, requestType) => {
    if (!planId) {
      alert('Không xác định được kế hoạch bảo trì của thiết bị này.');
      return;
    }

    const details = items.map((item) => {
      const match = availableParts.find((part) =>
        String(part.inventoryId || part.id) === String(item.inventoryId || item.id || item.partName)
        || part.name === item.partName
      );
      return {
        inventory_id: Number(match?.inventoryId || match?.id || item.inventoryId || item.id),
        quantity: Number(item.quantity) || 1,
      };
    }).filter((item) => Number.isInteger(item.inventory_id) && item.inventory_id > 0);

    if (!details.length) {
      alert('Không xác định được linh kiện trong kho.');
      return;
    }

    try {
      await inventoryApi.createItemRequest({
        plan_id: Number(planId),
        request_type: requestType,
        reason: requestType === 'issue' ? 'Yêu cầu linh kiện thay thế' : 'Trả linh kiện sau sửa chữa',
        details,
      });

      if (requestType === 'issue') {
        setRequestedParts((previous) => [
          ...previous,
          ...items.map((item, index) => ({
            id: Date.now() + index,
            inventoryId: details[index].inventory_id,
            name: item.partName,
            quantity: item.quantity,
          })),
        ]);
        setDeviceData((prev) => ({ ...prev, partStatus: 'Chờ xét duyệt' }));
      }
      alert(requestType === 'issue' ? 'Đã gửi yêu cầu linh kiện.' : 'Đã gửi yêu cầu trả linh kiện.');
    } catch (error) {
      console.error('Không thể gửi yêu cầu linh kiện:', error);
      alert(error?.message || 'Không thể gửi yêu cầu linh kiện.');
    }
  };

  // Hàm gửi tin nhắn Chat AI
  const handleSendAiMessage = async (e) => {
    e.preventDefault();
    const userQuery = aiInput.trim();
    if (!userQuery || aiLoading) return;

    setChatMessages((previous) => [...previous, { sender: 'user', text: userQuery }]);
    setAiInput('');
    setAiError('');
    setAiLoading(true);

    try {
      let activeConversationId = conversationId;
      if (!activeConversationId) {
        const created = await aiApi.createConversation({
          title: `Hỗ trợ thiết bị ${deviceData.deviceCode || deviceId}`
        });
        activeConversationId = created?.id || created?.data?.id;
        if (!activeConversationId) throw new Error('Không tạo được hội thoại AI.');
        setConversationId(activeConversationId);
      }

      const response = await aiApi.sendMessage(activeConversationId, { content: userQuery });
      const assistantMessage = response?.data?.assistantMessage || response?.assistantMessage;
      if (assistantMessage?.content) {
        setChatMessages((previous) => [...previous, { sender: 'ai', text: assistantMessage.content }]);
      }
    } catch (error) {
      console.error('Không thể gửi tin nhắn AI:', error);
      setAiError(error?.message || 'Không thể kết nối trợ lý AI.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      {/* 1. Header */}
      <HeaderInfo />

      {/* 2. Menu */}
      <TechMenuBar 
        activeNavMenu={activeNavMenu}
        setActiveNavMenu={setActiveNavMenu}
        goToHome={goToHome}
        goToSchedule={goToSchedule}
        goToUnassignedTasks={goToUnassignedTasks}
        goToAssignedTasks={goToAssignedTasks}
      />

      {/* 3. Tiêu đề Trang */}
      <h2 className="tech-page-title">CÔNG VIỆC ĐÃ NHẬN/CHI TIẾT THIẾT BỊ</h2>

      {/* 4 & 5. Nút Sửa/Bảo trì & Status */}
      <div className="state-bar-flex">
        <button type="button" className="btn-toggle-state" onClick={handleToggleState}>
          Sửa/Bảo trì
        </button>

        <div className="badge-group">
          <span className="badge-urgency">Độ khẩn cấp: <strong>{deviceData.urgency}</strong></span>
          <span className="badge-status">Tình trạng: <strong>{deviceData.status}</strong></span>
        </div>
      </div>

      <div className="device-code-row">
        <strong>Mã thiết bị:</strong> <span>{deviceData.deviceCode}</span>
      </div>

      {/* 6. KHUNG CHAT AI CHUYÊN NGHIỆP (Đã thay hình tròn & khung) */}
      <div className="ai-chat-card">
        {/* Header Chat với Icon AI */}
        <div className="ai-chat-header">
          <div className="ai-avatar-icon">
            <Bot size={20} color="#ffffff" />
          </div>
          <div className="ai-title-info">
            <span className="ai-name">Trợ lý AI Kỹ thuật</span>
            <span className="ai-status">● Sẵn sàng hỗ trợ</span>
          </div>
        </div>

        {/* Nội dung tin nhắn Chat */}
        <div className="ai-chat-messages">
          {chatMessages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}
            >
              {msg.text}
            </div>
          ))}
          {aiLoading && <div className="chat-bubble ai-bubble">AI đang phân tích...</div>}
        </div>

        {aiError && <div className="ai-error-message">{aiError}</div>}

        {/* Khung Nhập Khung Chat AI */}
        <form className="ai-chat-input-row" onSubmit={handleSendAiMessage}>
          <input
            type="text"
            className="ai-chat-input"
            placeholder="Hỏi AI hoặc mô tả lỗi thiết bị..."
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
          />
          <button type="submit" className="btn-ai-send" title="Gửi">
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* 7. Thông tin thiết bị */}
      <div className="device-info-section">
        <p><strong>Tên thiết bị:</strong> {deviceData.deviceName}</p>
        <p><strong>Vị trí thiết bị:</strong> {deviceData.location}</p>
        <p><strong>Nhà sản xuất:</strong> {deviceData.manufacturer}</p>
        <p>
          <strong>Thời hạn bảo hành:</strong> {deviceData.warrantyPeriod}
          <button type="button" className="btn-inline-blue ml-2" onClick={() => setIsWarrantyModalOpen(true)}>
            Yêu cầu BH
          </button>
        </p>
        <p><strong>Mô tả lỗi từ người dùng:</strong> {deviceData.userErrorDescription}</p>

        <div className="report-btn-row">
          <span>Lập biên bản xác định hư hỏng:</span>
          <button type="button" className="btn-inline-blue" onClick={handleCreateReport}>
            {deviceData.hasReportForm ? 'Xem/Sửa biên bản' : 'Lập biên bản'}
          </button>
        </div>
      </div>

      {/* Linh kiện thay thế Block */}
      <div className="frame-11-container">
        <div className="part-header-row">
          <span className="font-bold">Linh kiện thay thế:</span>
          
          <button type="button" className="btn-inline-blue" onClick={handleOpenPartRequest}>
            Yêu cầu linh kiện
          </button>

          {deviceData.partStatus && (
            <span className="badge-part-status">
              Tình trạng: <strong>{deviceData.partStatus}</strong>
            </span>
          )}
        </div>

        <table className="parts-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>STT</th>
              <th>Tên linh kiện</th>
              <th style={{ width: '70px' }}>Số lượng</th>
            </tr>
          </thead>
          <tbody>
            {requestedParts.length === 0 ? (
              <tr>
                <td colSpan="3">Chưa có linh kiện yêu cầu</td>
              </tr>
            ) : (
              requestedParts.map((item, index) => (
                <tr key={item.id || index}>
                  <td>{index + 1}</td>
                  <td className="text-left">{item.name || item.partName}</td>
                  <td>{item.quantity}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="part-actions-row mt-2">
          <button type="button" className="btn-inline-blue" onClick={() => setIsReturnModalOpen(true)}>
            Trả linh kiện
          </button>

          <button type="button" className="btn-inline-blue" onClick={handleConfirmParts}>
            Xác nhận
          </button>
        </div>
      </div>

      <div className="bottom-action-buttons">
        <button type="button" className="btn-outline-action" onClick={handleCreateReport}>
          Báo cáo hư hỏng
        </button>
        <button type="button" className="btn-outline-action" onClick={handleAcceptanceRequest}>
          Yêu cầu nghiệm thu
        </button>
      </div>

      {/* CÁC MODALS */}
      <PartRequestModal
        isOpen={isPartModalOpen}
        onClose={() => setIsPartModalOpen(false)}
        onSubmit={(newItems) => handleItemRequest(newItems, 'issue')}
        availableParts={availableParts}
      />

      <PartReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={(returnedItems) => handleItemRequest(returnedItems, 'return')}
        availableParts={requestedParts}
      />

      <WarrantyRequestModal
        isOpen={isWarrantyModalOpen}
        onClose={() => setIsWarrantyModalOpen(false)}
        onSubmit={handleWarrantyRequest}
        deviceCode={deviceData.deviceCode}
      />

      <DamageReportModal
        isOpen={isDamageModalOpen}
        onClose={() => setIsDamageModalOpen(false)}
        onSave={handleSaveDamageReport}
        initialDeviceCode={deviceData.deviceCode}
      />
    </div>
  );
}