import React, { useEffect, useState } from 'react';
import { maintenanceApi } from '../../services/api';

export default function SchedulePage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    maintenanceApi.getPlans({ limit: 100 }).then(setPlans).catch((error) => {
      console.error('Không thể tải lịch bảo trì:', error);
      setPlans([]);
    });
  }, []);

  return (
    <div>
      <h2>Lịch bảo trì</h2>
      {plans.length === 0 ? (
        <p>Chưa có lịch bảo trì.</p>
      ) : (
        <ul>
          {plans.map((plan) => (
            <li key={plan.id}>
              Thiết bị #{plan.device_id} - {plan.plan_type === 'repair' ? 'Sửa chữa' : 'Bảo trì'} - {plan.planned_start_at || 'Chưa có thời gian'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}