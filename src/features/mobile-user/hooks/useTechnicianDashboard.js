import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceApi, getCurrentEmployeeId, maintenanceApi, notificationApi } from '../../../services/api';

// Map API device/plan data into the technician task shape.
const formatPlanToTask = (plan, overrideStatus = null) => ({
  id: plan.id || plan._id,
  deviceId: String(plan.device_id || ''),
  deviceName: plan.device_name || plan.device?.name || `Thiết bị #${plan.device_id || ''}`,
  category: plan.plan_type || '',
  specifications: plan.description || '',
  department: plan.department_name || '',
  assignedTo: plan.plan_assignments || [],
  status: overrideStatus || (plan.actual_end_at ? 'Hoàn thành' : plan.actual_start_at ? 'Đang sửa chữa' : 'Chưa phân công'),
  priority: String(plan.priority || 'NORMAL').toUpperCase(),
  createdAt: plan.created_at || plan.planned_start_at || new Date().toISOString(),
  location: plan.location || '',
  notes: plan.description || '',
  price: Number(plan.estimated_cost || 0),
  serialNumber: plan.device?.serial_number || ''
});

// Initialize empty task lists (will be populated by API)
const INITIAL_TODAY_TASKS = [];
const INITIAL_UNASSIGNED_TASKS = [];
const INITIAL_ASSIGNED_TASKS = [];

export const useTechnicianDashboard = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeNavMenu, setActiveNavMenu] = useState('home'); // 'home' | 'schedule' | 'unassigned' | 'assigned'

  // Dữ liệu Công việc (Khởi tạo từ API)
  const [todayTasks, setTodayTasks] = useState(INITIAL_TODAY_TASKS);
  const [unassignedTasks, setUnassignedTasks] = useState(INITIAL_UNASSIGNED_TASKS);
  const [assignedTasks, setAssignedTasks] = useState(INITIAL_ASSIGNED_TASKS);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const employeeId = getCurrentEmployeeId();
      const [assignedResponse, unassignedResponse, devicesResponse, unreadResponse] = await Promise.all([
        employeeId ? maintenanceApi.getPlanAssignments(employeeId) : Promise.resolve([]),
        maintenanceApi.getPlansByStatus('not_started'),
        deviceApi.getDevices({ limit: 100 }),
        notificationApi.getUnreadCount()
      ]);
      const assigned = Array.isArray(assignedResponse) ? assignedResponse : assignedResponse?.data || [];
      const unassigned = Array.isArray(unassignedResponse) ? unassignedResponse : unassignedResponse?.data || [];
      const devices = Array.isArray(devicesResponse) ? devicesResponse : devicesResponse?.data || [];
      const devicesById = new Map(devices.map(device => [String(device.id || device._id), device]));
      const enrichPlan = (plan) => ({
        ...plan,
        device: devicesById.get(String(plan.device_id)),
        device_name: devicesById.get(String(plan.device_id))?.name || devicesById.get(String(plan.device_id))?.model || ''
      });
      const assignedPlans = assigned.map(enrichPlan);
      const assignedIds = new Set(assignedPlans.map(plan => String(plan.id || plan._id)));
      const unassignedPlans = unassigned
        .filter(plan => !assignedIds.has(String(plan.id || plan._id)))
        .map(enrichPlan);
      const today = new Date().toISOString().slice(0, 10);
      const todayPlans = assignedPlans.filter(plan => String(plan.planned_start_at || '').startsWith(today));

      setUnassignedTasks(unassignedPlans.map(plan => formatPlanToTask(plan, 'Chưa phân công')));
      setAssignedTasks(assignedPlans.map(plan => formatPlanToTask(plan, 'Đang sửa chữa')));
      setTodayTasks((todayPlans.length ? todayPlans : assignedPlans).slice(0, 3).map(plan => formatPlanToTask(plan)));
      setUnreadCount(Number(unreadResponse) || 0);
    } catch (error) {
      console.error('Failed to fetch technician dashboard data:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Bộ lọc & Sắp xếp cho bảng
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Tự động đưa về trang 1 khi thay đổi từ khóa, bộ lọc hoặc menu điều hướng
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, priorityFilter, sortBy, activeNavMenu]);

  // Xử lý chuyển View
  const goToHome = () => { setActiveNavMenu('home'); setCurrentPage(1); };
  const goToSchedule = () => { setActiveNavMenu('schedule'); };
  const goToUnassignedTasks = () => { setActiveNavMenu('unassigned'); setCurrentPage(1); };
  const goToAssignedTasks = () => { setActiveNavMenu('assigned'); setCurrentPage(1); };
  const goToDeviceDetail = (id, planId) => {
    if (id) navigate(`/technician/device-detail/${id}`, { state: { planId } });
  };

  // Hàm dùng chung cho Lọc & Sắp xếp
  const filterAndSortTasks = (taskList) => {
    return taskList
      .filter((item) => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
          String(item.deviceId || '').toLowerCase().includes(term) ||
          String(item.location || '').toLowerCase().includes(term) ||
          String(item.deviceName || '').toLowerCase().includes(term) ||
          String(item.department || '').toLowerCase().includes(term) ||
          String(item.category || '').toLowerCase().includes(term);

        const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;
        return matchesSearch && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
      });
  };

  // Danh sách đã lọc cho Công việc chưa nhận
  const filteredUnassignedTasks = useMemo(() => {
    return filterAndSortTasks(unassignedTasks);
  }, [unassignedTasks, searchTerm, priorityFilter, sortBy]);

  // Danh sách đã lọc cho Công việc đã nhận
  const filteredAssignedTasks = useMemo(() => {
    return filterAndSortTasks(assignedTasks);
  }, [assignedTasks, searchTerm, priorityFilter, sortBy]);

  // Xác định danh sách hiện tại theo activeNavMenu để tính phân trang
  const currentActiveList = useMemo(() => {
    if (activeNavMenu === 'assigned') return filteredAssignedTasks;
    return filteredUnassignedTasks;
  }, [activeNavMenu, filteredUnassignedTasks, filteredAssignedTasks]);

  // Tính toán tổng số trang
  const totalPages = Math.ceil(currentActiveList.length / itemsPerPage) || 1;

  // Phân trang danh sách chưa nhận
  const paginatedUnassignedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUnassignedTasks.slice(start, start + itemsPerPage);
  }, [filteredUnassignedTasks, currentPage]);

  // Phân trang danh sách đã nhận
  const paginatedAssignedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAssignedTasks.slice(start, start + itemsPerPage);
  }, [filteredAssignedTasks, currentPage]);

  // Xử lý Nhận công việc
  const handleAcceptTask = async (task) => {
    try {
      await maintenanceApi.startPlan(task.id);
      await loadDashboardData();
      alert(`Đã nhận thành công thiết bị: ${task.deviceName} (${task.deviceId})`);
      goToAssignedTasks();
    } catch (error) {
      console.error('Không thể nhận kế hoạch bảo trì:', error);
      alert(error?.message || 'Không thể nhận công việc');
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    unreadCount,
    todayTasks,
    unassignedTasks,
    assignedTasks,
    loading,
    currentPage,
    totalPages,
    activeNavMenu,
    searchTerm,
    priorityFilter,
    sortBy,
    paginatedUnassignedTasks,
    paginatedAssignedTasks,
    setActiveNavMenu,
    setSearchTerm,
    setPriorityFilter,
    setSortBy,
    handlePageChange,
    goToHome,
    goToSchedule,
    goToUnassignedTasks,
    goToAssignedTasks,
    goToDeviceDetail,
    handleAcceptTask,
  };
};