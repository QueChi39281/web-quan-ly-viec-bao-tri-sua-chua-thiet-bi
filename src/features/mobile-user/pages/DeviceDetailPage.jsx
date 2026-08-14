import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import HeaderInfo from '../components/HeaderInfo';
import TechMenuBar from '../components/TechMenuBar';
import PartRequestModal from '../components/PartRequestModal';
import PartReturnModal from '../components/PartReturnModal';
import WarrantyRequestModal from '../components/WarrantyRequestModal';
import DamageReportModal from '../components/DamageReportModal';
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

  const [activeNavMenu, setActiveNavMenu] = useState('');

  const goToSchedule = () => navigate('/technician/schedule');
  const goToUnassignedTasks = () => navigate('/technician/tasks/unassigned');
  const goToAssignedTasks = () => navigate('/technician/tasks/assigned');

  // State cho Chat AI
  const [aiInput, setAiInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Xin chào! Tớ là Trợ lý AI Kỹ thuật (*v*)' },
    { sender: 'ai', text: 'Hãy chọn yêu cầu hoặc mô tả sự cố bạn đang gặp phải nhé!' }
  ]);

  const [deviceData, setDeviceData] = useState({
    deviceCode: deviceId || 'TB-9982',
    deviceName: 'Máy nén khí Piston',
    location: 'Xưởng A - Khu 2',
    manufacturer: 'Hitachi Japan',
    warrantyPeriod: '12/2026',
    userErrorDescription: 'Máy phát ra tiếng ồn lớn, áp suất tụt nhanh.',
    urgency: 'Bình thường', 
    status: 'Đang sửa',     
    deviceState: DEVICE_STATES.UNDER_MAINTENANCE,
    hasReportForm: false,   
    partStatus: 'Chờ xét duyệt'
  });

  const [requestedParts, setRequestedParts] = useState([
    { id: 1, name: 'Lọc gió Piston', quantity: 2 },
    { id: 2, name: 'Dầu máy nén', quantity: 1 }
  ]);

  // Modals state
  const [isPartModalOpen, setIsPartModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isWarrantyModalOpen, setIsWarrantyModalOpen] = useState(false);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);

  useEffect(() => {
    if (deviceId) {
      console.log("Đang lấy chi tiết thiết bị cho ID:", deviceId);
    }
  }, [deviceId]);

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

  const handleSaveDamageReport = (formData) => {
    console.log("Đã lưu biên bản hư hỏng:", formData);
    setDeviceData(prev => ({ ...prev, hasReportForm: true }));
    setIsDamageModalOpen(false);
    alert("Đã lưu biên bản xác định hư hỏng thành công!");
  };

  const handleConfirmParts = () => {
    alert("Đã kiểm tra và xác nhận nhận đúng/đủ linh kiện!");
    setDeviceData(prev => ({ ...prev, partStatus: 'Đã phê duyệt' }));
  };

  const handleAcceptanceRequest = () => {
    alert("Đã gửi yêu cầu nghiệm thu (YCNT) cho quản lý!");
  };

  // Hàm gửi tin nhắn Chat AI
  const handleSendAiMessage = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    // Thêm tin nhắn của Kỹ thuật viên
    const newMessages = [...chatMessages, { sender: 'user', text: aiInput }];
    setChatMessages(newMessages);
    const userQuery = aiInput;
    setAiInput('');

    // Phản hồi giả lập từ AI
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: `AI đang phân tích sự cố: "${userQuery}". Khuyên bạn nên kiểm tra van một chiều và thay lọc gió!` }
      ]);
    }, 600);
  };

  return (
    <div className="mobile-container">
      {/* 1. Header */}
      <HeaderInfo />

      {/* 2. Menu */}
      <TechMenuBar 
        activeNavMenu={activeNavMenu}
        setActiveNavMenu={setActiveNavMenu}
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
        </div>

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
        onSubmit={(newItems) => {
          const formatted = newItems.map((p, idx) => ({ id: Date.now() + idx, name: p.partName, quantity: p.quantity }));
          setRequestedParts([...requestedParts, ...formatted]);
          setDeviceData(prev => ({ ...prev, partStatus: 'Chờ xét duyệt' }));
        }}
        availableParts={['Lọc gió Piston', 'Cầu chì 10A', 'Dầu máy nén', 'Băng tải 3M']}
      />

      <PartReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onSubmit={(returnedItems) => console.log("Trả linh kiện:", returnedItems)}
        availableParts={requestedParts}
      />

      <WarrantyRequestModal
        isOpen={isWarrantyModalOpen}
        onClose={() => setIsWarrantyModalOpen(false)}
        onSubmit={(data) => console.log("Yêu cầu bảo hành:", data)}
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