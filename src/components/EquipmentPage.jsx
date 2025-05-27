// src/components/EquipmentPage.jsx
import React, { useState, useEffect } from "react";
import { ref, push, onValue, remove, update } from "firebase/database";
import { database } from "../firebase";
import "../CSS/Equipment.css";

export default function EquipmentPage() {
  const [categories, setCategories] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [categoryFormData, setCategoryFormData] = useState({
    title: "",
    icon: "",
    colorHex: "",
    description: ""
  });

  const [equipmentFormData, setEquipmentFormData] = useState({
    name: "",
    model: "",
    serialNumber: "",
    status: "Available",
    condition: "Good",
    location: "",
    purchaseDate: "",
    warrantyExpiry: "",
    assignedTo: "",
    notes: "",
    categoryId: ""
  });

  // Fetch categories from Firebase
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch equipments when category is selected
  useEffect(() => {
    if (selectedCategory) {
      fetchEquipments(selectedCategory);
    } else {
      setEquipments([]);
    }
  }, [selectedCategory]);

  const fetchCategories = () => {
    try {
      setLoading(true);
      const categoriesRef = ref(database, 'equipment_categories');
      
      onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoryList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setCategories(categoryList);
        } else {
          setCategories([]);
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      setLoading(false);
    }
  };

  const fetchEquipments = (categoryId) => {
    try {
      const equipmentsRef = ref(database, `equipment_categories/${categoryId}/equipments`);
      
      onValue(equipmentsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const equipmentList = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          setEquipments(equipmentList);
        } else {
          setEquipments([]);
        }
      });
    } catch (error) {
      console.error("Error fetching equipments:", error);
    }
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validate hex color
    if (name === 'colorHex') {
      const cleanValue = value.replace('#', '').replace(/[^0-9a-fA-F]/g, '').substring(0, 6);
      setCategoryFormData(prev => ({
        ...prev,
        [name]: cleanValue
      }));
      return;
    }
    
    setCategoryFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEquipmentInputChange = (e) => {
    const { name, value } = e.target;
    setEquipmentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryFormData.title.trim()) {
      alert("Please enter a category title");
      return;
    }

    try {
      if (editingCategory) {
        const categoryRef = ref(database, `equipment_categories/${editingCategory.id}`);
        await update(categoryRef, {
          ...categoryFormData,
          updatedAt: new Date().toISOString()
        });
        alert("Category updated successfully!");
      } else {
        const categoriesRef = ref(database, 'equipment_categories');
        await push(categoriesRef, {
          ...categoryFormData,
          availableCount: 0,
          totalCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        alert("Category added successfully!");
      }
      
      resetCategoryForm();
    } catch (error) {
      console.error("Error saving category:", error);
      alert("Error saving category. Please try again.");
    }
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!equipmentFormData.name.trim() || !equipmentFormData.serialNumber.trim() || !selectedCategory) {
      alert("Please fill in required fields and select a category");
      return;
    }

    try {
      const equipmentData = {
        ...equipmentFormData,
        categoryId: selectedCategory
      };

      if (editingEquipment) {
        const equipmentRef = ref(database, `equipment_categories/${selectedCategory}/equipments/${editingEquipment.id}`);
        await update(equipmentRef, {
          ...equipmentData,
          updatedAt: new Date().toISOString()
        });
        alert("Equipment updated successfully!");
      } else {
        const equipmentsRef = ref(database, `equipment_categories/${selectedCategory}/equipments`);
        await push(equipmentsRef, {
          ...equipmentData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        await updateCategoryCounts(selectedCategory);
        alert("Equipment added successfully!");
      }
      
      resetEquipmentForm();
    } catch (error) {
      console.error("Error saving equipment:", error);
      alert("Error saving equipment. Please try again.");
    }
  };

  const updateCategoryCounts = async (categoryId) => {
    try {
      const equipmentsRef = ref(database, `equipment_categories/${categoryId}/equipments`);
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

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      title: category.title || "",
      icon: category.icon || "",
      colorHex: category.colorHex || "",
      description: category.description || ""
    });
    setShowAddCategoryForm(true);
  };

  const handleEditEquipment = (equipment) => {
    setEditingEquipment(equipment);
    setEquipmentFormData({
      name: equipment.name || "",
      model: equipment.model || "",
      serialNumber: equipment.serialNumber || "",
      status: equipment.status || "Available",
      condition: equipment.condition || "Good",
      location: equipment.location || "",
      purchaseDate: equipment.purchaseDate || "",
      warrantyExpiry: equipment.warrantyExpiry || "",
      assignedTo: equipment.assignedTo || "",
      notes: equipment.notes || "",
      categoryId: equipment.categoryId || ""
    });
    setShowAddEquipmentForm(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category? This will also delete all equipment in this category.")) {
      try {
        const categoryRef = ref(database, `equipment_categories/${categoryId}`);
        await remove(categoryRef);
        alert("Category deleted successfully!");
        if (selectedCategory === categoryId) {
          setSelectedCategory("");
          setEquipments([]);
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category. Please try again.");
      }
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        const equipmentRef = ref(database, `equipment_categories/${selectedCategory}/equipments/${equipmentId}`);
        await remove(equipmentRef);
        await updateCategoryCounts(selectedCategory);
        alert("Equipment deleted successfully!");
      } catch (error) {
        console.error("Error deleting equipment:", error);
        alert("Error deleting equipment. Please try again.");
      }
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      title: "",
      icon: "",
      colorHex: "",
      description: ""
    });
    setShowAddCategoryForm(false);
    setEditingCategory(null);
  };

  const resetEquipmentForm = () => {
    setEquipmentFormData({
      name: "",
      model: "",
      serialNumber: "",
      status: "Available",
      condition: "Good",
      location: "",
      purchaseDate: "",
      warrantyExpiry: "",
      assignedTo: "",
      notes: "",
      categoryId: ""
    });
    setShowAddEquipmentForm(false);
    setEditingEquipment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Available": return "#10b981";
      case "In Use": return "#f59e0b";
      case "Maintenance": return "#ef4444";
      case "Retired": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getWarrantyStatus = (warrantyExpiry) => {
    if (!warrantyExpiry) return null;
    
    const today = new Date();
    const warranty = new Date(warrantyExpiry);
    const diffDays = Math.ceil((warranty - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired', color: '#ef4444' };
    if (diffDays <= 30) return { status: 'warning', text: `${diffDays}d left`, color: '#f59e0b' };
    return { status: 'valid', text: 'Valid', color: '#10b981' };
  };

  // Filter equipments based on search term
  const filteredEquipments = equipments.filter(equipment =>
    equipment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equipment.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Export equipment data to CSV
  const exportEquipmentData = () => {
    if (equipments.length === 0) {
      alert("No equipment data to export");
      return;
    }

    const csvData = equipments.map(equipment => ({
      Name: equipment.name,
      Model: equipment.model,
      'Serial Number': equipment.serialNumber,
      Status: equipment.status,
      Condition: equipment.condition,
      Location: equipment.location,
      'Purchase Date': equipment.purchaseDate,
      'Warranty Expiry': equipment.warrantyExpiry,
      'Assigned To': equipment.assignedTo,
      Notes: equipment.notes
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `equipment_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading laboratory equipment...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-page">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Laboratory Equipment Management</h1>
        <p className="page-subtitle">Manage equipment categories and individual laboratory equipment.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveTab("categories")}
          className={`nav-tab ${activeTab === "categories" ? "active" : ""}`}
        >
          <span className="nav-tab-icon">📂</span>
          Equipment Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("equipments")}
          className={`nav-tab ${activeTab === "equipments" ? "active" : ""}`}
        >
          <span className="nav-tab-icon">⚙️</span>
          Individual Equipment
        </button>
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="tab-content">
          <div className="section-header">
            <h2 className="section-title">Equipment Categories</h2>
            <button
              onClick={() => setShowAddCategoryForm(true)}
              className="btn btn-primary"
            >
              <span className="btn-icon">+</span>
              Add Category
            </button>
          </div>

          {/* Categories Grid */}
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-header">
                  <div 
                    className="category-icon"
                    style={{ backgroundColor: `#${category.colorHex || "14b8a6"}20` }}
                  >
                    {category.icon || "📦"}
                  </div>
                  <div className="category-info">
                    <h3 className="category-title">{category.title}</h3>
                    <p className="category-description">
                      {category.description || "No description"}
                    </p>
                  </div>
                </div>

                <div className="category-stats">
                  <div className="stat-item">
                    <div className="stat-number">{category.totalCount || 0}</div>
                    <div className="stat-label">Total Equipment</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number available">{category.availableCount || 0}</div>
                    <div className="stat-label">Available</div>
                  </div>
                </div>

                <div className="category-actions">
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setActiveTab("equipments");
                    }}
                    className="btn btn-outline btn-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="btn btn-secondary btn-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="btn btn-danger btn-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🧪</div>
              <h3 className="empty-title">No categories found</h3>
              <p className="empty-message">Create your first equipment category to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === "equipments" && (
        <div className="tab-content">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="section-title">Individual Equipment</h2>
              <div className="category-selector">
                <label className="form-label">Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-select"
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
            <div className="section-header-right">
              {selectedCategory && equipments.length > 0 && (
                <button
                  onClick={exportEquipmentData}
                  className="btn btn-outline"
                >
                  <span className="btn-icon">📊</span>
                  Export CSV
                </button>
              )}
              <button
                onClick={() => {
                  if (!selectedCategory) {
                    alert("Please select a category first");
                    return;
                  }
                  setShowAddEquipmentForm(true);
                }}
                className={`btn ${selectedCategory ? "btn-success" : "btn-disabled"}`}
                disabled={!selectedCategory}
              >
                <span className="btn-icon">+</span>
                Add Equipment
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {selectedCategory && equipments.length > 0 && (
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search equipment by name, model, serial number, location, or assigned person..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
          )}

          {/* Equipment Content */}
          {!selectedCategory ? (
            <div className="empty-state">
              <div className="empty-icon">🔬</div>
              <h3 className="empty-title">Select a Category</h3>
              <p className="empty-message">Choose a category from the dropdown above to view and manage equipment.</p>
            </div>
          ) : filteredEquipments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3 className="empty-title">
                {searchTerm ? "No equipment found" : "No equipment in this category"}
              </h3>
              <p className="empty-message">
                {searchTerm 
                  ? "Try adjusting your search terms or clear the search to see all equipment."
                  : "Add your first equipment to this category."
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn btn-outline btn-sm"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="equipment-table-container">
              <div className="table-header">
                <h3 className="table-title">
                  Equipment List ({filteredEquipments.length}
                  {searchTerm && ` of ${equipments.length}`})
                </h3>
              </div>

              <div className="table-wrapper">
                <table className="equipment-table">
                  <thead>
                    <tr>
                      <th>Equipment</th>
                      <th>Serial Number</th>
                      <th>Status</th>
                      <th>Condition</th>
                      <th>Location</th>
                      <th>Assigned To</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((equipment) => {
                      const warrantyStatus = getWarrantyStatus(equipment.warrantyExpiry);
                      return (
                        <tr key={equipment.id} className="equipment-row">
                          <td className="equipment-cell">
                            <div className="equipment-info">
                              <div className="equipment-name">{equipment.name}</div>
                              <div className="equipment-model">{equipment.model || "—"}</div>
                              {warrantyStatus && (
                                <div 
                                  className={`warranty-status ${warrantyStatus.status}`}
                                  style={{ color: warrantyStatus.color }}
                                >
                                  Warranty: {warrantyStatus.text}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="serial-cell">
                            <span className="serial-number">{equipment.serialNumber}</span>
                          </td>
                          <td>
                            <span 
                              className="status-badge"
                              style={{
                                backgroundColor: getStatusColor(equipment.status) + "20",
                                color: getStatusColor(equipment.status),
                                borderColor: getStatusColor(equipment.status) + "30"
                              }}
                            >
                              {equipment.status}
                            </span>
                          </td>
                          <td>
                            <span className={`condition-badge ${equipment.condition?.toLowerCase()}`}>
                              {equipment.condition || "—"}
                            </span>
                          </td>
                          <td className="location-cell">{equipment.location || "—"}</td>
                          <td className="assigned-cell">{equipment.assignedTo || "—"}</td>
                          <td className="actions-cell">
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEditEquipment(equipment)}
                                className="btn btn-outline btn-xs"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteEquipment(equipment.id)}
                                className="btn btn-danger btn-xs"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      {showAddCategoryForm && (
        <div className="modal-overlay">
          <div className="modal category-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <button
                onClick={resetCategoryForm}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label required">Category Title</label>
                <input
                  type="text"
                  name="title"
                  value={categoryFormData.title}
                  onChange={handleCategoryInputChange}
                  placeholder="e.g., Laboratory Glassware"
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Icon (Emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    value={categoryFormData.icon}
                    onChange={handleCategoryInputChange}
                    placeholder="🧪"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color (Hex)</label>
                  <div className="color-input-wrapper">
                    <input
                      type="text"
                      name="colorHex"
                      value={categoryFormData.colorHex}
                      onChange={handleCategoryInputChange}
                      placeholder="14b8a6"
                      className="form-input color-input"
                    />
                    <div 
                      className="color-preview"
                      style={{ 
                        backgroundColor: categoryFormData.colorHex ? `#${categoryFormData.colorHex}` : "#14b8a6" 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  placeholder="Brief description of this equipment category"
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingCategory ? "Update Category" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {showAddEquipmentForm && (
        <div className="modal-overlay">
          <div className="modal equipment-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingEquipment ? "Edit Equipment" : "Add New Equipment"}
              </h2>
              <button
                onClick={resetEquipmentForm}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEquipmentSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Equipment Name</label>
                  <input
                    type="text"
                    name="name"
                    value={equipmentFormData.name}
                    onChange={handleEquipmentInputChange}
                    placeholder="e.g., Digital Scale"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={equipmentFormData.model}
                    onChange={handleEquipmentInputChange}
                    placeholder="e.g., XS205"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Serial Number</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={equipmentFormData.serialNumber}
                    onChange={handleEquipmentInputChange}
                    placeholder="e.g., SN123456789"
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={equipmentFormData.location}
                    onChange={handleEquipmentInputChange}
                    placeholder="e.g., Lab Room 101"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={equipmentFormData.status}
                    onChange={handleEquipmentInputChange}
                    className="form-select"
                  >
                    <option value="Available">Available</option>
                    <option value="In Use">In Use</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select
                    name="condition"
                    value={equipmentFormData.condition}
                    onChange={handleEquipmentInputChange}
                    className="form-select"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={equipmentFormData.purchaseDate}
                    onChange={handleEquipmentInputChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Warranty Expiry</label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={equipmentFormData.warrantyExpiry}
                    onChange={handleEquipmentInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned To</label>
                <input
                  type="text"
                  name="assignedTo"
                  value={equipmentFormData.assignedTo}
                  onChange={handleEquipmentInputChange}
                  placeholder="e.g., Dr. Smith"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={equipmentFormData.notes}
                  onChange={handleEquipmentInputChange}
                  placeholder="Additional notes about this equipment"
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={resetEquipmentForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                >
                  {editingEquipment ? "Update Equipment" : "Add Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}