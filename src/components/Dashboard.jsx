// src/components/Dashboard.js
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import EquipmentPage from "./EquipmentPage";
import "../CSS/Dashboard.css";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="dashboard-content-centered">
            <div className="dashboard-welcome">
              <h1>Welcome to the Dashboard</h1>
              <p>You are successfully logged in!</p>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card blue">
                <h3>Total Equipment</h3>
                <p>45</p>
              </div>
              <div className="stat-card green">
                <h3>Active Users</h3>
                <p>23</p>
              </div>
              <div className="stat-card red">
                <h3>Maintenance Due</h3>
                <p>8</p>
              </div>
            </div>
          </div>
        );
      
      case "equipments":
        // Equipment page gets full width - no centering container
        return <EquipmentPage />;
      
      case "users":
        return (
          <div className="dashboard-content-centered">
            <div className="section-header">
              <h1>User Management</h1>
              <p>Manage user accounts and permissions.</p>
            </div>
            
            <div className="btn-group">
              <button className="btn btn-success">Add User</button>
              <button className="btn btn-warning">Manage Roles</button>
            </div>
            
            <div className="content-card">
              <h3>Active Users</h3>
              <ul className="user-list">
                <li className="user-item">
                  <span className="user-info">John Doe - Admin</span>
                  <span className="user-status status-active">Active</span>
                </li>
                <li className="user-item">
                  <span className="user-info">Jane Smith - User</span>
                  <span className="user-status status-active">Active</span>
                </li>
                <li className="user-item">
                  <span className="user-info">Mike Johnson - User</span>
                  <span className="user-status status-pending">Pending</span>
                </li>
              </ul>
            </div>
          </div>
        );
      
      case "profile":
        return (
          <div className="dashboard-content-centered">
            <div className="section-header">
              <h1>Profile Settings</h1>
              <p>Manage your account settings and preferences.</p>
            </div>
            
            <div className="profile-grid">
              <div className="profile-card">
                <h3>Profile Picture</h3>
                <div className="profile-picture">👤</div>
                <button className="btn btn-secondary">Change Photo</button>
              </div>
              
              <div className="profile-card">
                <h3>Account Information</h3>
                <div className="form-group">
                  <label className="form-label">Name:</label>
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email:</label>
                  <input 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="form-input" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role:</label>
                  <select className="form-select">
                    <option>Admin</option>
                    <option>User</option>
                    <option>Manager</option>
                  </select>
                </div>
                <button className="btn btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="dashboard-content-centered">
            <div className="empty-state">
              <h3>Section not found</h3>
              <p>The requested section could not be found.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <main className="dashboard-main">
        <div className="dashboard-inner">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}