// src/components/equipment/EquipmentsTab.js
import React, { useState } from "react";
import { ref, push, update, remove } from "firebase/database";
import { database } from "../../firebase";
import EquipmentModal from "./EquipmentModal";
import EquipmentTable from "./EquipmentTable";

export default function EquipmentsTab({ 
  categories, 
  equipments, 
  selectedCategory, 
  onCategoryChange, 
  onEquipmentsUpdate 
}) {
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);

  const updateCategoryCounts = async (categoryId) => {
    try {
      const equipmentsRef = ref(database, `equipment_categories/${categoryId}/equipments`);
      const { onValue } = await import("firebase/database");
      
      onValue(equipmentsRef, async (snapshot) => {
        const data = snapshot.val();
        const totalCount = data ? Object.keys(data).length : 0;
        const availableCount = data ? Object.values(data).filter(eq => eq.status === 'Available').length : 0;
        
        const categoryRef = ref(database, `equipment_categories/${categoryId}`);
        await update(categoryRef, {
          totalCount,
          availableCount
        });
      }, { onlyOnce: true });
    } catch (error) {
      console.error("Error updating category counts:", error);
    }
  };

  const handleEquipmentSubmit = async (equipmentData) => {
    if (!selectedCategory) {
      alert("Please select a category first");
      return;
    }

    try {
      const dataWithCategory = {
        ...equipmentData,
        categoryId: selectedCategory
      };

      if (editingEquipment) {
        // Update existing equipment
        const equipmentRef = ref(database, `equipment_categories/${selectedCategory}/equipments/${editingEquipment.id}`);
        await update(equipmentRef, {
          ...dataWithCategory,
          updatedAt: new Date().toISOString()
        });
        alert("Equipment updated successfully!");
      } else {
        // Add new equipment
        const equipmentsRef = ref(database, `equipment_categories/${selectedCategory}/equipments`);
        await push(equipmentsRef, {
          ...dataWithCategory,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        alert("Equipment added successfully!");
      }
      
      await updateCategoryCounts(selectedCategory);
      setShowAddEquipmentForm(false);
      setEditingEquipment(null);
      onEquipmentsUpdate();
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Error saving equipment. Please try again.");
    }
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setShowAddEquipmentForm(true);
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        const equipmentRef = ref(database, `equipment_categories/${selectedCategory}/equipments/${equipmentId}`);
        await remove(equipmentRef);
        await updateCategoryCounts(selectedCategory);
        alert("Equipment deleted successfully!");
        onEquipmentsUpdate();
      } catch (error) {
        console.error("Error deleting equipment:", error);
        alert("Error deleting equipment. Please try again.");
      }
    }
  };

  const closeModal = () => {
    setShowAddEquipmentForm(false);
    setEditingEquipment(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2>Individual Equipment</h2>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
            <label style={{ fontSize: "14px", fontWeight: "500" }}>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "14px",
                minWidth: "200px"
              }}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            if (!selectedCategory) {
              alert("Please select a category first");
              return;
            }
            setShowAddEquipmentForm(true);
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: selectedCategory ? "#10b981" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: selectedCategory ? "pointer" : "not-allowed",
            fontSize: "14px",
            fontWeight: "500",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => {
            if (selectedCategory) {
              e.target.style.backgroundColor = "#059669";
            }
          }}
          onMouseLeave={(e) => {
            if (selectedCategory) {
              e.target.style.backgroundColor = "#10b981";
            }
          }}
        >
          + Add Equipment
        </button>
      </div>

      {/* Equipment Content */}
      {!selectedCategory ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔬</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>Select a Category</h3>
          <p style={{ margin: 0 }}>Choose a category from the dropdown above to view and manage equipment.</p>
        </div>
      ) : equipments.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>No equipment found</h3>
          <p style={{ margin: 0 }}>Add your first equipment to this category.</p>
        </div>
      ) : (
        <EquipmentTable 
          equipments={equipments}
          onEdit={handleEditEquipment}
          onDelete={handleDeleteEquipment}
        />
      )}

      {/* Equipment Modal */}
      {showAddEquipmentForm && (
        <EquipmentModal
          equipment={editingEquipment}
          onSubmit={handleEquipmentSubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}