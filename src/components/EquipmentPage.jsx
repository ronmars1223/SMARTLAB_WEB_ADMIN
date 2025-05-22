// src/components/EquipmentPage.js
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import CategoriesTab from "./equipment/CategoriesTab";
import EquipmentsTab from "./equipment/EquipmentsTab";

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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "24px", marginBottom: "16px" }}>🔄</div>
          <div>Loading laboratory equipment...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 10px 0" }}>Laboratory Equipment Management</h1>
        <p style={{ margin: 0, color: "#6b7280" }}>
          Manage equipment categories and individual laboratory equipment.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", marginBottom: "30px", borderBottom: "2px solid #e5e7eb" }}>
        <button
          onClick={() => setActiveTab("categories")}
          style={{
            padding: "12px 24px",
            backgroundColor: activeTab === "categories" ? "#3b82f6" : "transparent",
            color: activeTab === "categories" ? "#fff" : "#6b7280",
            border: "none",
            borderBottom: activeTab === "categories" ? "2px solid #3b82f6" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s"
          }}
        >
          Equipment Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("equipments")}
          style={{
            padding: "12px 24px",
            backgroundColor: activeTab === "equipments" ? "#3b82f6" : "transparent",
            color: activeTab === "equipments" ? "#fff" : "#6b7280",
            border: "none",
            borderBottom: activeTab === "equipments" ? "2px solid #3b82f6" : "2px solid transparent",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s"
          }}
        >
          Individual Equipment
        </button>
      </div>

      {/* Tab Content */}
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
  );
}