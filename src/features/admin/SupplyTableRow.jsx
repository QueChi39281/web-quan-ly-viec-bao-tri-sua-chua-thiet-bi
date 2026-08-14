import React, { memo } from 'react';

const SupplyTableRow = memo(({
  item,
  index,
  startIndex,
  editingRowId,
  onSelectRow,
  onRowChange
}) => {
  const isEditing = editingRowId === item.id;

  return (
    <tr className={isEditing ? 'editing-row' : ''}>
      <td className="col-checkbox">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={() => onSelectRow(item.id)}
        />
      </td>
      <td className="text-center">{startIndex + index + 1}</td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.supplyName}
            onChange={(e) => onRowChange(item.id, 'supplyName', e.target.value)}
            placeholder="Nhập tên vật tư..."
          />
        ) : (
          item.supplyName
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="text"
            className="table-input text-center"
            value={item.supplyCode}
            onChange={(e) => onRowChange(item.id, 'supplyCode', e.target.value)}
          />
        ) : (
          item.supplyCode
        )}
      </td>
      <td>
        {isEditing ? (
          <input
            type="text"
            className="table-input"
            value={item.supplier}
            onChange={(e) => onRowChange(item.id, 'supplier', e.target.value)}
            placeholder="Nhập nhà cung cấp..."
          />
        ) : (
          item.supplier
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="number"
            className="table-input text-center"
            value={item.importQuantity}
            onChange={(e) => onRowChange(item.id, 'importQuantity', Number(e.target.value))}
          />
        ) : (
          item.importQuantity
        )}
      </td>
      <td className="text-center">
        {isEditing ? (
          <input
            type="number"
            className="table-input text-center"
            value={item.remainingQuantity}
            onChange={(e) => onRowChange(item.id, 'remainingQuantity', Number(e.target.value))}
          />
        ) : (
          item.remainingQuantity
        )}
      </td>
    </tr>
  );
});

export default SupplyTableRow;