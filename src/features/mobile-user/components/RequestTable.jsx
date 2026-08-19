import React from 'react';

export default function RequestTable({ list, onConfirm }) {
  return (
    <div className="table-container">
      <h4 className="table-title">DANH SÁCH CÁC THIẾT BỊ BÁO LỖI</h4>
      <div className="table-wrapper">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="table-header-row">
              <th className="p-2.5 border-r border-blue-500 text-center w-12">STT</th>
              <th className="p-2.5 border-r border-blue-500">Mã thiết bị</th>
              <th className="p-2.5 border-r border-blue-500">Tình trạng</th>
              <th className="p-2.5 text-center w-24">Xác nhận</th>
            </tr>
          </thead>
          <tbody className="text-xs text-gray-700 divide-y divide-gray-200">
            {list.map((item, index) => (
              <tr key={item.id} className="hover:bg-blue-50/40 bg-cyan-50/20 transition-colors">
                <td className="table-cell text-center text-gray-400">{index + 1}</td>
                <td className="table-cell font-mono font-bold text-blue-600">{item.device?.code || item.deviceId || item.device_id || '-'}</td>
                <td className="table-cell">
                  <span className={item.status === 'COMPLETED' ? 'status-badge-completed' : 'status-badge-pending'}>
                    {item.status === 'COMPLETED' ? 'Đã sửa xong' : 'Chờ duyệt'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  {item.status === 'COMPLETED' ? (
                    <button onClick={() => onConfirm(item.id)} className="btn-confirm">
                      Xác nhận
                    </button>
                  ) : (
                    <span className="text-gray-400 text-[10px] italic">Đang xử lý</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}