// src/components/equipment/EquipmentTable.js
import React from "react";

export default function EquipmentTable({ equipments, onEdit, onDelete }) {
  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
    }}>
      <div style={{ padding: "20px", borderBottom: "1px solid #e5e7eb" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
          Equipment List ({equipments.length})
        </h3>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th style={headerStyle}>Equipment Name</th>
              <th style={headerStyle}>Quantity</th>
              <th style={headerStyle}>Description</th>
              <th style={{ ...headerStyle, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map((equipment) => (
              <tr key={equipment.id} style={rowHoverStyle}>
                <td style={cellStyle}>{equipment.name || "—"}</td>
                <td style={cellStyle}>{equipment.quantity || "—"}</td>
                <td style={cellStyle}>{equipment.description || "—"}</td>
                <td style={{ ...cellStyle, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                    <button
                      onClick={() => onEdit(equipment)}
                      style={editButtonStyle}
                      onMouseEnter={(e) => hoverButton(e, true)}
                      onMouseLeave={(e) => hoverButton(e, false)}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(equipment.id)}
                      style={deleteButtonStyle}
                      onMouseEnter={(e) => hoverDelete(e, true)}
                      onMouseLeave={(e) => hoverDelete(e, false)}
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

// Shared styles
const headerStyle = {
  padding: "12px 16px",
  textAlign: "left",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "12px",
  fontWeight: "600",
  color: "#374151",
  textTransform: "uppercase",
  backgroundColor: "#f9fafb"
};

const cellStyle = {
  padding: "16px",
  fontSize: "14px",
  verticalAlign: "top",
  color: "#374151"
};

const rowHoverStyle = {
  borderBottom: "1px solid #f3f4f6",
  transition: "background-color 0.2s"
};

const editButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#f3f4f6",
  color: "#374151",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500"
};

const deleteButtonStyle = {
  padding: "6px 12px",
  backgroundColor: "#fee2e2",
  color: "#dc2626",
  border: "1px solid #fecaca",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: "500"
};

// Hover behavior
const hoverButton = (e, hover) => {
  e.target.style.backgroundColor = hover ? "#e5e7eb" : "#f3f4f6";
  e.target.style.borderColor = hover ? "#9ca3af" : "#d1d5db";
};

const hoverDelete = (e, hover) => {
  e.target.style.backgroundColor = hover ? "#fecaca" : "#fee2e2";
  e.target.style.borderColor = hover ? "#f87171" : "#fecaca";
};
