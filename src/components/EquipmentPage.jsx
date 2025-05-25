// src/components/EquipmentPage.js
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import CategoriesTab from "./equipment/CategoriesTab";
import EquipmentsTab from "./equipment/EquipmentsTab";
import "../CSS/Equipment.css";

export default function EquipmentPage() {
  const [categories, setCategories] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("categories");

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

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setActiveTab("equipments");
  };

  if (loading) {
    return (
      <div className="equipment-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon">🔄</div>
            <div className="loading-text">Loading laboratory equipment...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="equipment-page">
      {/* Navigation Tabs */}
      <div className="equipment-nav-tabs">
        <button
          onClick={() => setActiveTab("categories")}
          className={`equipment-nav-tab ${activeTab === "categories" ? "active" : ""}`}
        >
          Equipment Categories
          <span className="tab-count">({categories.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("equipments")}
          className={`equipment-nav-tab ${activeTab === "equipments" ? "active" : ""}`}
        >
          Individual Equipment
        </button>
      </div>

      {/* Tab Content */}
      <div className="equipment-tab-content">
        {activeTab === "categories" && (
          <CategoriesTab 
            categories={categories}
            onCategorySelect={handleCategorySelect}
            onCategoriesUpdate={fetchCategories}
          />
        )}

        {activeTab === "equipments" && (
          <EquipmentsTab 
            categories={categories}
            equipments={equipments}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onEquipmentsUpdate={() => fetchEquipments(selectedCategory)}
          />
        )}
      </div>
    </div>
  );
}