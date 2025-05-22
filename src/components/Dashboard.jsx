// src/components/Dashboard.js
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import EquipmentPage from "./EquipmentPage"; // Import your equipment component

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <div>
            <h1>Welcome to the Dashboard</h1>
            <p>You are successfully logged in!</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "30px" }}>
              <div style={{ padding: "20px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>Total Equipment</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>45</p>
              </div>
              <div style={{ padding: "20px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#059669" }}>Active Users</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>23</p>
              </div>
              <div style={{ padding: "20px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 10px 0", color: "#dc2626" }}>Maintenance Due</h3>
                <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#1f2937" }}>8</p>
              </div>
            </div>
          </div>
        );
      
      case "equipments":
        // Use your actual EquipmentPage component
        return <EquipmentPage />;
      
      case "users":
        return (
          <div>
            <h1>User Management</h1>
            <p>Manage user accounts and permissions.</p>
            <div style={{ marginTop: "20px" }}>
              <button style={{ padding: "10px 20px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", marginRight: "10px" }}>
                Add User
              </button>
              <button style={{ padding: "10px 20px", backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Manage Roles
              </button>
            </div>
            <div style={{ marginTop: "30px", padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h3>Active Users</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ padding: "10px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
                  <span>John Doe - Admin</span>
                  <span style={{ color: "#10b981" }}>Active</span>
                </li>
                <li style={{ padding: "10px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
                  <span>Jane Smith - User</span>
                  <span style={{ color: "#10b981" }}>Active</span>
                </li>
                <li style={{ padding: "10px 0", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" }}>
                  <span>Mike Johnson - User</span>
                  <span style={{ color: "#f59e0b" }}>Pending</span>
                </li>
              </ul>
            </div>
          </div>
        );
      
      case "profile":
        return (
          <div>
            <h1>Profile Settings</h1>
            <p>Manage your account settings and preferences.</p>
            <div style={{ marginTop: "30px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
              <div style={{ padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h3>Profile Picture</h3>
                <div style={{ width: "100px", height: "100px", backgroundColor: "#d1d5db", borderRadius: "50%", margin: "20px 0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>
                  👤
                </div>
                <button style={{ padding: "8px 16px", backgroundColor: "#6b7280", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                  Change Photo
                </button>
              </div>
              <div style={{ padding: "20px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
                <h3>Account Information</h3>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Name:</label>
                  <input type="text" placeholder="Your Name" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Email:</label>
                  <input type="email" placeholder="your.email@example.com" style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px" }} />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "5px", fontWeight: "500" }}>Role:</label>
                  <select style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "4px" }}>
                    <option>Admin</option>
                    <option>User</option>
                    <option>Manager</option>
                  </select>
                </div>
                <button style={{ padding: "10px 20px", backgroundColor: "#3b82f6", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Section not found</div>;
    }
  };

  const mainContentStyle = {
    marginLeft: "250px",  // or whatever the width of your sidebar is
    minHeight: "100vh",
    backgroundColor: "#fff",
    transition: "margin-left 0.3s ease"
  };


  return (
    <div style={{ display: "flex" }}>
      <Sidebar 
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
     <main style={mainContentStyle}>
      <div className="dashboard-inner">
        {renderContent()}
      </div>
    </main>
    </div>
  );
}