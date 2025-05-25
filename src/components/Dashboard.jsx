// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { ref, push, onValue, remove, update } from "firebase/database";
import { database } from "../firebase";
import Sidebar from "./Sidebar";
import EquipmentPage from "./EquipmentPage";
import UserManagement from "./UserManagement";
import AnnouncementModal from "./AnnouncementModal";
import "../CSS/Dashboard.css";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Load announcements from Firebase
  useEffect(() => {
    const announcementsRef = ref(database, 'announcements');
    
    const unsubscribe = onValue(announcementsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const announcementsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by creation date, newest first
        announcementsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setAnnouncements(announcementsList);
      } else {
        setAnnouncements([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement(null);
    setShowAnnouncementModal(true);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  const handleSaveAnnouncement = async (announcementData) => {
    try {
      if (editingAnnouncement) {
        // Update existing announcement
        const announcementRef = ref(database, `announcements/${editingAnnouncement.id}`);
        await update(announcementRef, {
          ...announcementData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add new announcement
        const announcementsRef = ref(database, 'announcements');
        await push(announcementsRef, {
          ...announcementData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setShowAnnouncementModal(false);
      setEditingAnnouncement(null);
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to save announcement. Please try again.");
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm("Are you sure you want to delete this announcement?")) {
      try {
        const announcementRef = ref(database, `announcements/${announcementId}`);
        await remove(announcementRef);
      } catch (error) {
        console.error("Error deleting announcement:", error);
        alert("Failed to delete announcement. Please try again.");
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
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

            {/* Announcements Section */}
            <div className="announcements-section">
              <div className="section-header-with-button">
                <div className="section-header">
                  <h2>Important Announcements</h2>
                  <p>Stay updated with the latest information and updates</p>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddAnnouncement}
                >
                  <span className="btn-icon">📢</span>
                  Add Announcement
                </button>
              </div>

              <div className="announcements-grid">
                {announcements.length > 0 ? (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className={`announcement-card ${getPriorityColor(announcement.priority)}`}>
                      <div className="announcement-header">
                        <div className="announcement-title-section">
                          <h3 className="announcement-title">{announcement.title}</h3>
                          <span className={`priority-badge ${announcement.priority}`}>
                            {announcement.priority?.toUpperCase() || 'MEDIUM'}
                          </span>
                        </div>
                        <div className="announcement-actions">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEditAnnouncement(announcement)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div className="announcement-content">
                        <p>{announcement.content}</p>
                      </div>
                      
                      <div className="announcement-footer">
                        <div className="announcement-meta">
                          <span className="announcement-author">By: {announcement.author}</span>
                          <span className="announcement-date">
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                        {announcement.category && (
                          <span className="announcement-category">
                            {announcement.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-announcements">
                    <div className="empty-icon">📢</div>
                    <h3>No Announcements Yet</h3>
                    <p>Click "Add Announcement" to create your first announcement.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case "equipments":
        return <EquipmentPage />;
      
      case "users":
        return <UserManagement />;
      
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
      
      {showAnnouncementModal && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onSave={handleSaveAnnouncement}
          onClose={() => {
            setShowAnnouncementModal(false);
            setEditingAnnouncement(null);
          }}
        />
      )}
    </div>
  );
}