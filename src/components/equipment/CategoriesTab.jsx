// src/components/equipment/CategoriesTab.js
import React, { useState } from "react";
import { ref, push, update, remove } from "firebase/database";
import { database } from "../../firebase";
import CategoryModal from "./CategoryModal";
import "./CategoriesTab.css";

// Delete Confirmation Modal Component
function DeleteConfirmModal({ category, onConfirm, onCancel }) {
  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-container">
        <div className="delete-modal-icon">⚠️</div>
        <h2 className="delete-modal-title">Delete Category</h2>
        <p className="delete-modal-message">
          Are you sure you want to delete the category "{category.title}"?
        </p>
        <p className="delete-modal-warning">
          Warning: This will permanently delete the category and ALL equipment items 
          associated with this category. This action cannot be undone.
        </p>
        <div className="delete-modal-actions">
          <button onClick={onCancel} className="delete-modal-cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="delete-modal-confirm">
            Delete Category
          </button>
        </div>
      </div>
    </div>
  );
}

// Success Modal Component
function SuccessModal({ message, onClose }) {
  return (
    <div className="success-modal-overlay">
      <div className="success-modal-container">
        <div className="success-modal-icon">✅</div>
        <h2 className="success-modal-title">Success</h2>
        <p className="success-modal-message">{message}</p>
        <button onClick={onClose} className="success-modal-button">
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
    <div className="categories-container">
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

      {/* Header */}
      <div className="categories-header">
        <h2 className="categories-title">Equipment Categories</h2>
        <button
          onClick={() => setShowAddCategoryForm(true)}
          className="add-category-btn"
        >
          <span className="add-category-btn-icon">+</span>
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      {categories.length > 0 ? (
        <div className="categories-grid">
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
      ) : (
        <div className="categories-empty-state">
          <div className="empty-state-icon">🧪</div>
          <h3 className="empty-state-title">No categories found</h3>
          <p className="empty-state-message">
            Create your first equipment category to get started.
          </p>
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
    <div className="category-card">
      <div className="category-card-header">
        <div className="category-icon">📦</div>
        <div>
          <h3 className="category-card-title">{category.title}</h3>
        </div>
      </div>

      <div className="category-stats">
        <div className="stat-item">
          <div className="stat-value">{category.totalCount || 0}</div>
          <div className="stat-label">Total Equipment</div>
        </div>
        <div className="stat-item">
          <div className="stat-value available">{category.availableCount || 0}</div>
          <div className="stat-label">Available</div>
        </div>
      </div>

      <div className="category-actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="category-btn category-btn-primary"
        >
          View Equipment
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="category-btn category-btn-secondary"
        >
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="category-btn category-btn-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}