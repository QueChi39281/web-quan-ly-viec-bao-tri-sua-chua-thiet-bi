import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import HeaderInfo from '../../components/HeaderInfo';
import ManagerSidebar from '../../components/ManagerSidebar';
import { maintenanceApi, reportApi } from '../../services/api';
import './DashboardPage.css';

const defaultDashboard = {
  totalDevices: 0,
  pendingMaintenance: 0,
  completed: 0,
  issues: 0,
  charts: {
    sparePartsCostData: [],
    fixTimeData: [],
    failureFrequencyData: [],
    vendorFailureData: [],
  },
  tasks: [],
};

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(defaultDashboard);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, requestsRes] = await Promise.all([
          reportApi.getDashboardSummary(),
          maintenanceApi.getPlans({ limit: 100 }),
        ]);

        const summary = summaryRes?.data || summaryRes || {};
        const requests = Array.isArray(requestsRes?.data) ? requestsRes.data : (Array.isArray(requestsRes) ? requestsRes : []);

        setDashboard({
          totalDevices: Number(summary.totalDevices ?? summary.total_devices ?? 0),
          pendingMaintenance: Number(summary.pendingMaintenance ?? summary.pending_maintenance ?? 0),
          completed: Number(summary.completed ?? 0),
          issues: Number(summary.issues ?? 0),
          charts: {
            sparePartsCostData: summary.sparePartsCostData || [],
            fixTimeData: summary.fixTimeData || [],
            failureFrequencyData: summary.failureFrequencyData || [],
            vendorFailureData: summary.vendorFailureData || [],
          },
          tasks: requests.length ? requests.map((item, idx) => ({
            id: item.id ?? idx + 1,
            name: item.deviceName || item.device_name || item.title || `Yêu cầu #${idx + 1}`,
            deadline: item.scheduledDate || item.deadline || 'Chưa có thời hạn',
            isUrgent: String(item.priority || '').toUpperCase() === 'HIGH',
            tagText: item.priority || 'Định kỳ',
          })) : defaultDashboard.tasks,
        });
      } catch (error) {
        console.error('Không thể tải dashboard từ API, dùng dữ liệu dự phòng:', error);
        setDashboard(defaultDashboard);
      }
    };

    fetchDashboardData();
  }, []);

  const sortedMaintenanceTasks = useMemo(
    () => [...dashboard.tasks].sort((a, b) => Number(b.isUrgent) - Number(a.isUrgent)),
    [dashboard.tasks]
  );

  return (
    <div className="page-root-layout">
      <div className="page-header-wrapper">
        <HeaderInfo />
      </div>

      <div className="page-body-wrapper">
        <ManagerSidebar />

        <main className="main-content-container">
          <h2 className="dashboard-title">BẢNG ĐIỀU KHIỂN TỔNG QUAN</h2>

          <div className="kpi-grid-container">
            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-blue">⚙️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Tổng thiết bị</span>
                <span className="kpi-value">{dashboard.totalDevices}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-amber">🛠️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Chờ bảo trì</span>
                <span className="kpi-value">{dashboard.pendingMaintenance}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-green">✅</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Đã hoàn thành</span>
                <span className="kpi-value">{dashboard.completed}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon-wrapper kpi-red">⚠️</div>
              <div className="kpi-info-group">
                <span className="kpi-label">Sự cố hỏng hóc</span>
                <span className="kpi-value">{dashboard.issues}</span>
              </div>
            </div>
          </div>

          <div className="dashboard-main-split">
            <div className="chart-grid">
              <ChartCard title="Thống kê chi phí linh kiện:">
                <StackedBarChart data={dashboard.charts.sparePartsCostData} unit="Tr VNĐ" />
              </ChartCard>

              <ChartCard title="Thống kê thời gian trung bình sửa sự cố:">
                <StackedBarChart data={dashboard.charts.fixTimeData} unit="giờ" />
              </ChartCard>

              <ChartCard title="Thống kê tần suất hư hỏng của thiết bị:">
                <StackedBarChart data={dashboard.charts.failureFrequencyData} unit="lần" />
              </ChartCard>

              <ChartCard title="Thống kê tần suất hư hỏng theo NCC:">
                <StackedBarChart data={dashboard.charts.vendorFailureData} unit="ca" />
              </ChartCard>
            </div>

            <div className="summary-card-wrapper">
              <div className="card-header-title">
                Lịch bảo trì sắp tới ({sortedMaintenanceTasks.length})
              </div>

              <div className="recent-tasks-list">
                {sortedMaintenanceTasks.map((task) => (
                  <div key={task.id} className={`task-item-row ${task.isUrgent ? 'urgent' : ''}`}>
                    <div className="task-item-left">
                      <span className="task-device-name">{task.name}</span>
                      <span className="task-date-info">Hạn: {task.deadline}</span>
                    </div>
                    <span className={`task-status-tag ${task.isUrgent ? 'tag-urgent' : ''}`}>
                      {task.tagText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-wrapper">{children}</div>
    </div>
  );
}

function StackedBarChart({ data, unit = '' }) {
  const customTooltipFormatter = (value, name) => [
    `${value?.toLocaleString('vi-VN') || 0} ${unit}`.trim(),
    name
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: -5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="region" tick={{ fontSize: 10 }} interval={0} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip formatter={customTooltipFormatter} />
        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '2px' }} iconSize={10} />
        <Bar dataKey="Q1" stackId="a" fill="#3b82f6" name="Q1" />
        <Bar dataKey="Q2" stackId="a" fill="#10b981" name="Q2" />
        <Bar dataKey="Q3" stackId="a" fill="#f59e0b" name="Q3" />
        <Bar dataKey="Q4" stackId="a" fill="#ef4444" name="Q4" />
      </BarChart>
    </ResponsiveContainer>
  );
}