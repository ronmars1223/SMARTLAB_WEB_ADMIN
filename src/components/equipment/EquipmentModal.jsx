// src/components/equipment/EquipmentModal.js
import React, { useState, useEffect } from "react";

export default function EquipmentModal({ equipment, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    description: ""
  });

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name || "",
        quantity: equipment.quantity || "",
        description: equipment.description || ""
      });
    }
  }, [equipment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter the equipment name.");
      return;
    }

    onSubmit(formData);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: "#fff",
        padding: "30px",
        borderRadius: "12px",
        width: "90%",
        maxWidth: "500px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px"
        }}>
          <h2 style={{ margin: 0 }}>
            {equipment ? "Edit Equipment" : "Add Equipment"}
          </h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: "24px",
            cursor: "pointer", color: "#6b7280"
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Equipment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              style={{
                width: "100%", padding: "10px",
                border: "1px solid #d1d5db", borderRadius: "6px"
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              style={{
                width: "100%", padding: "10px",
                border: "1px solid #d1d5db", borderRadius: "6px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              style={{
                width: "100%", padding: "10px",
                border: "1px solid #d1d5db", borderRadius: "6px"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db",
              borderRadius: "6px", cursor: "pointer"
            }}>
              Cancel
            </button>
            <button type="submit" style={{
              padding: "10px 20px", backgroundColor: "#10b981", color: "#fff",
              border: "none", borderRadius: "6px", cursor: "pointer"
            }}>
              {equipment ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
