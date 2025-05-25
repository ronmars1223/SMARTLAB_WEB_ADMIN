// src/components/equipment/EquipmentTable.js
import React from "react";
import "./Equipment_page.css";

export default function EquipmentTable({ equipments, onEdit, onDelete }) {
  return (
    <div className="equipment-table-container">
      <div className="table-header">
        <h3>Equipment List ({equipments.length})</h3>
      </div>

      <div className="table-wrapper">
        <table className="equipment-table">
          <thead>
            <tr>
              <th>Equipment Name</th>
              <th>Quantity</th>
              <th>Description</th>
              <th className="center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map((equipment) => (
              <tr key={equipment.id}>
                <td>{equipment.name || "—"}</td>
                <td>{equipment.quantity || "—"}</td>
                <td>{equipment.description || "—"}</td>
                <td className="center">
                  <div className="table-actions">
                    <button
                      onClick={() => onEdit(equipment)}
                      className="btn-edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(equipment.id)}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}