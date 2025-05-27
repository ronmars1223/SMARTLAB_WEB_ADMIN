// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { ref, push, onValue, remove, update } from "firebase/database";
import { database } from "../firebase";
import Sidebar from "./Sidebar";
import EquipmentPage from "./EquipmentPage";
import UserManagement from "./UserManagement";
import RequestFormsPage from "./RequestFormsPage";
import HistoryPage from "./HistoryPage";
import AnnouncementModal from "./AnnouncementModal";
import "../CSS/Dashboard.css";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalEquipment: 0,
    totalUsers: 0,
    pendingRequests: 0,
    borrowedItems: 0,
    itemsInStock: 0,
    needMaintenance: 0,
    overdueItems: 0,
    borrowedByAdviser: 0,
    borrowedByStudents: 0
  });
  const [borrowingData, setBorrowingData] = useState([]);

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

  // Load dashboard analytics data
  useEffect(() => {
    // Load borrow requests for statistics
    const borrowRequestsRef = ref(database, 'borrow_requests');
    const equipmentRef = ref(database, 'equipment');

    const unsubscribeBorrowRequests = onValue(borrowRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.values(data);
        
        // Calculate statistics
        const pendingCount = requests.filter(req => req.status === 'pending').length;
        const borrowedCount = requests.filter(req => req.status === 'in_progress' || req.status === 'approved').length;
        
        // Simulate additional stats (you can replace with real data)
        const overdueCount = requests.filter(req => {
          if (req.dateToReturn && req.status === 'approved') {
            return new Date(req.dateToReturn) < new Date();
          }
          return false;
        }).length;

        // Create borrowing chart data
        const categoryData = {};
        requests.forEach(req => {
          const category = req.categoryName || 'Other';
          categoryData[category] = (categoryData[category] || 0) + 1;
        });

        const chartData = Object.entries(categoryData).map(([name, value]) => ({
          name,
          value
        }));

        setBorrowingData(chartData);

        setDashboardStats(prev => ({
          ...prev,
          pendingRequests: pendingCount,
          borrowedItems: borrowedCount,
          overdueItems: overdueCount,
          borrowedByAdviser: Math.floor(borrowedCount * 0.3), // Simulate adviser borrows
          borrowedByStudents: Math.floor(borrowedCount * 0.7) // Simulate student borrows
        }));
      }
    });

    // You can add more listeners for equipment and users data
    const unsubscribeEquipment = onValue(equipmentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const equipment = Object.values(data);
        const totalEquipment = equipment.length;
        const inStock = equipment.filter(item => item.status === 'available').length;
        const needMaintenance = equipment.filter(item => item.status === 'maintenance').length;

        setDashboardStats(prev => ({
          ...prev,
          totalEquipment,
          itemsInStock: inStock,
          needMaintenance
        }));
      }
    });

    return () => {
      unsubscribeBorrowRequests();
      unsubscribeEquipment();
    };
  }, []);

  const handleSectionChange = (section) => {
    console.log("Section changed to:", section); // Debug log
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
    console.log("Rendering content for section:", activeSection); // Debug log
    
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="dashboard-content-centered">
            <div className="dashboard-welcome">
              <h1>Welcome to SmartLab Dashboard</h1>
              <p>Monitor and manage your laboratory equipment efficiently</p>
            </div>
            
            {/* Main Statistics Grid */}
            <div className="main-stats-grid">
              <div className="stat-card-large primary">
                <div className="stat-number">{dashboardStats.borrowedByAdviser}</div>
                <div className="stat-label">Items Borrowed by Adviser</div>
                <div className="stat-icon">👨‍🏫</div>
              </div>
              <div className="stat-card-large success">
                <div className="stat-number">{dashboardStats.borrowedByStudents}</div>
                <div className="stat-label">Items Borrowed by Students</div>
                <div className="stat-icon">👨‍🎓</div>
              </div>
              <div className="stat-card-large info">
                <div className="stat-number">{dashboardStats.borrowedItems}</div>
                <div className="stat-label">Total Items Borrowed</div>
                <div className="stat-icon">📦</div>
              </div>
            </div>

            {/* Secondary Statistics Grid */}
            <div className="secondary-stats-grid">
              <div className="stat-card-small">
                <div className="stat-number">{dashboardStats.itemsInStock.toLocaleString()}</div>
                <div className="stat-label">Total Items in Stock</div>
              </div>
              <div className="stat-card-small warning">
                <div className="stat-number">{dashboardStats.needMaintenance}</div>
                <div className="stat-label">Need Maintenance</div>
              </div>
              <div className="stat-card-small danger">
                <div className="stat-number">{dashboardStats.overdueItems}</div>
                <div className="stat-label">Overdue Items</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
              {/* Top Borrowed Items Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Top 5 Borrowed Items</h3>
                  <p>Most frequently borrowed equipment categories</p>
                </div>
                <div className="chart-container">
                  <div className="bar-chart">
                    {borrowingData.slice(0, 5).map((item, index) => (
                      <div key={item.name} className="bar-item">
                        <div className="bar-label">{item.name}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{
                              width: `${(item.value / Math.max(...borrowingData.map(d => d.value))) * 100}%`,
                              backgroundColor: `hsl(${200 + index * 30}, 70%, 50%)`
                            }}
                          ></div>
                          <span className="bar-value">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity Summary */}
              <div className="activity-card">
                <div className="activity-header">
                  <h3>Recent Activity</h3>
                  <p>Latest system activities</p>
                </div>
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon success">✅</div>
                    <div className="activity-content">
                      <div className="activity-title">New equipment added</div>
                      <div className="activity-time">2 hours ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon info">📋</div>
                    <div className="activity-content">
                      <div className="activity-title">Borrow request approved</div>
                      <div className="activity-time">4 hours ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon warning">⚠️</div>
                    <div className="activity-content">
                      <div className="activity-title">Maintenance due reminder</div>
                      <div className="activity-time">1 day ago</div>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon primary">👤</div>
                    <div className="activity-content">
                      <div className="activity-title">New user registered</div>
                      <div className="activity-time">2 days ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn primary"
                  onClick={() => setActiveSection('equipments')}
                >
                  <span className="btn-icon">⚙️</span>
                  Manage Equipment
                </button>
                <button 
                  className="action-btn success"
                  onClick={() => setActiveSection('request-forms')}
                >
                  <span className="btn-icon">📋</span>
                  View Requests
                </button>
                <button 
                  className="action-btn info"
                  onClick={() => setActiveSection('history')}
                >
                  <span className="btn-icon">📊</span>
                  View History
                </button>
                <button 
                  className="action-btn warning"
                  onClick={() => setActiveSection('users')}
                >
                  <span className="btn-icon">👥</span>
                  Manage Users
                </button>
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
        console.log("Rendering EquipmentPage component"); // Debug log
        return <EquipmentPage />;
      
      case "request-forms":
        return <RequestFormsPage />;
      
      case "history":
        return <HistoryPage />;
      
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