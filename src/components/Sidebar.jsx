// src/components/Sidebar.js
import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../CSS/Sidebar.css";

export default function Sidebar({ activeSection, onSectionChange }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "🏠"
    },
    {
      id: "equipments",
      label: "Equipments",
      icon: "⚙️"
    },
    {
      id: "users",
      label: "Users",
      icon: "👥"
    },
    {
      id: "profile",
      label: "Profile",
      icon: "👤"
    }
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          Admin Panel
        </h2>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="toggle-button"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeSection === item.id ? 'active' : ''} tooltip`}
            onClick={() => onSectionChange(item.id)}
            data-tooltip={item.label}
          >
            <span className="menu-item-icon">{item.icon}</span>
            <span className="menu-item-label">{item.label}</span>
          </div>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="logout-button"
      >
        <span className="logout-button-text">Logout</span>
        <span className="logout-button-icon">↪</span>
      </button>
    </div>
  );
}