// src/components/equipment/EquipmentModal.js
import React, { useState, useEffect } from "react";
import "./Equipment_page.css";

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
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>{equipment ? "Edit Equipment" : "Add Equipment"}</h2>
          <button onClick={onClose} className="modal-close-btn">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Equipment Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              {equipment ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}