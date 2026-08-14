import React from 'react';
import { useDeviceReport } from '../hooks/useDeviceReport';
import HeaderInfo from '../components/HeaderInfo';
import NotificationBox from '../components/NotificationBox';
import RequestTable from '../components/RequestTable';
import DeviceReportForm from '../components/DeviceReportForm';
import ManagementRequestForm from '../components/ManagementRequestForm';
import './DeviceReportPage.css';

export default function DeviceReportPage() {
  const {
    activeTab,
    setActiveTab,
    unreadCount,
    requestList,
    formData,
    setFormData,
    handleSubmitReport,
    handleQRScanMock,
    handleConfirmCompletion
  } = useDeviceReport();

  return (
    <div className="mobile-container">
      {/* 1. Header component */}
      <HeaderInfo />

      {/* 2. Notification component */}
      <NotificationBox unreadCount={unreadCount} />

      {/* 3. Tab Navigation */}
      <div className="tab-navigation">
        <button
          type="button"
          onClick={() => setActiveTab('bao-hong')}
          className={activeTab === 'bao-hong' ? 'tab-button-active' : 'tab-button-inactive'}
        >
          BÁO HỎNG THIẾT BỊ
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gui-quan-ly')}
          className={activeTab === 'gui-quan-ly' ? 'tab-button-active' : 'tab-button-inactive'}
        >
          GỬI YÊU CẦU ĐẾN QUẢN LÝ
        </button>
      </div>

      {/* 4. Render Form dựa vào Tab đang chọn */}
      {activeTab === 'bao-hong' ? (
        <DeviceReportForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitReport}
          onScanQR={handleQRScanMock}
        />
      ) : (
        <ManagementRequestForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmitReport}
          onScanQR={handleQRScanMock}
        />
      )}

      {/* 5. Request Table Component */}
      <RequestTable list={requestList} onConfirm={handleConfirmCompletion} />
    </div>
  );
}