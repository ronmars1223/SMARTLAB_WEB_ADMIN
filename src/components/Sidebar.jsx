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
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
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
      id: "request-forms",
      label: "Request Forms",
      icon: "📋"
    },
    {
      id: "history",
      label: "History",
      icon: "📊"
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
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="sidebar-nav" role="navigation">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`menu-item ${activeSection === item.id ? 'active' : ''} tooltip`}
            onClick={() => onSectionChange(item.id)}
            data-tooltip={item.label}
            title={isCollapsed ? item.label : ''}
            aria-label={item.label}
          >
            <span className="menu-item-icon" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <span className="menu-item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={handleLogout}
        className="logout-button"
        title="Sign out of admin panel"
        aria-label="Logout"
      >
        <span className="logout-button-text">Logout</span>
        <span className="logout-button-icon" role="img" aria-hidden="true">
          ↪
        </span>
      </button>
    </div>
  );
}