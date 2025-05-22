// src/components/equipment/CategoriesTab.js
import React, { useState } from "react";
import { ref, push, update, remove } from "firebase/database";
import { database } from "../../firebase";
import CategoryModal from "./CategoryModal";
import "./success_alert.css";
import "./delete_confirm.css";

// Delete Confirmation Modal Component
function DeleteConfirmModal({ category, onConfirm, onCancel }) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-container">
        <div className="delete-modal-icon">
          ⚠️
        </div>
        <h2 className="delete-modal-title">
          Delete Category
        </h2>
        <p className="delete-modal-message">
          Are you sure you want to delete the category "{category.title}"?
        </p>
        <p className="delete-modal-warning">
          Warning: This will permanently delete the category and ALL equipment items 
          associated with this category. This action cannot be undone.
        </p>
        <div className="delete-modal-actions">
          <button
            onClick={onCancel}
            className="delete-modal-cancel"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="delete-modal-confirm"
          >
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Modal Component (from previous implementation)
function SuccessModal({ message, onClose }) {
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-container">
        <div className="success-modal-icon">
          ✅
        </div>
        <h2 className="success-modal-title">
          Success
        </h2>
        <p className="success-modal-message">
          {message}
        </p>
        <button
          onClick={onClose}
          className="success-modal-button"
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function CategoriesTab({ categories, onCategorySelect, onCategoriesUpdate }) {
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddCategoryForm(true);
  };

  const confirmDeleteCategory = (category) => {
    setCategoryToDelete(category);
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const categoryRef = ref(database, `equipment_categories/${categoryToDelete.id}`);
      await remove(categoryRef);
      
      setSuccessMessage("Category deleted successfully!");
      setCategoryToDelete(null);
      onCategoriesUpdate();
    } catch (error) {
      console.error("Error deleting category:", error);
      setSuccessMessage("Error deleting category. Please try again.");
      setCategoryToDelete(null);
    }
  };

  const handleCategorySubmit = async (categoryData) => {
    try {
      if (editingCategory) {
        // Update existing category
        const categoryRef = ref(database, `equipment_categories/${editingCategory.id}`);
        await update(categoryRef, {
          ...categoryData,
          updatedAt: new Date().toISOString()
        });
        setSuccessMessage("Category updated successfully!");
      } else {
        // Add new category
        const categoriesRef = ref(database, 'equipment_categories');
        await push(categoriesRef, {
          ...categoryData,
          availableCount: 0,
          totalCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setSuccessMessage("Category added successfully!");
      }
      
      setShowAddCategoryForm(false);
      setEditingCategory(null);
      onCategoriesUpdate();
    } catch (error) {
      console.error("Error saving category:", error);
      setSuccessMessage("Error saving category. Please try again.");
    }
  };

  const closeModal = () => {
    setShowAddCategoryForm(false);
    setEditingCategory(null);
  };

  const closeSuccessModal = () => {
    setSuccessMessage(null);
  };

  const cancelDelete = () => {
    setCategoryToDelete(null);
  };

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <DeleteConfirmModal 
          category={categoryToDelete}
          onConfirm={handleDeleteCategory}
          onCancel={cancelDelete}
        />
      )}

      {/* Success Modal */}
      {successMessage && (
        <SuccessModal 
          message={successMessage} 
          onClose={closeSuccessModal} 
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Equipment Categories</h2>
        <button
          onClick={() => setShowAddCategoryForm(true)}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#2563eb"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#3b82f6"}
        >
          + Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            onEdit={() => handleEditCategory(category)}
            onDelete={() => confirmDeleteCategory(category)}
            onSelect={() => onCategorySelect(category.id)}
          />
        ))}
      </div>

      {categories.length === 0 && (
        <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧪</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#374151" }}>No categories found</h3>
          <p style={{ margin: 0 }}>Create your first equipment category to get started.</p>
        </div>
      )}

      {/* Category Modal */}
      {showAddCategoryForm && (
        <CategoryModal
          category={editingCategory}
          onSubmit={handleCategorySubmit}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

// Category Card Component
function CategoryCard({ category, onEdit, onDelete, onSelect }) {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "2px solid #e5e7eb",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#3b82f6";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5e7eb";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#3b82f620",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: "12px",
            fontSize: "20px"
          }}
        >
          📦
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "18px", fontWeight: "600" }}>
            {category.title}
          </h3>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937" }}>
            {category.totalCount || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Total Equipment</div>
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: "#10b981" }}>
            {category.availableCount || 0}
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>Available</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          style={{
            flex: 1,
            padding: "8px 16px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#e5e7eb"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#f3f4f6"}
        >
          View Equipment
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#e5e7eb"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#f3f4f6"}
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: "8px 12px",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#fecaca"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#fee2e2"}
        >
          Delete
        </button>
      </div>
    </div>
  );
}