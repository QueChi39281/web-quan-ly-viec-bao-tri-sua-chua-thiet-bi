import React, { useEffect, useState } from 'react';
import { maintenanceApi } from '../../services/api';

export default function TicketListPage() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    maintenanceApi.getPlans({ limit: 100 }).then(setPlans).catch((error) => {
      console.error('Không thể tải danh sách ticket:', error);
      setPlans([]);
    });
  }, []);

  return (
    <div>
      <h2>Danh sách Yêu cầu / Ticket</h2>
      {plans.length === 0 ? (
        <p>Chưa có yêu cầu.</p>
      ) : (
        <ul>
          {plans.map((plan) => (
            <li key={plan.id}>
              #{plan.id} - Thiết bị #{plan.device_id} - {plan.description || 'Không có mô tả'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}