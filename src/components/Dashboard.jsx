// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { ref, push, onValue, remove, update, get } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";
import EquipmentPage from "./EquipmentPage";
import UserManagement from "./UserManagement";
import RequestFormsPage from "./RequestFormsPage";
import HistoryPage from "./HistoryPage";
import AnnouncementModal from "./AnnouncementModal";
import Analytics from "./Analytics";
import LaboratoryManagement from "./LaboratoryManagement";
import NotificationModal from "./NotificationModal";
import { checkForOverdueEquipment } from "../utils/notificationUtils";
import "../CSS/Dashboard.css";

export default function Dashboard() {
  const { user, userRole, isAdmin, isLaboratoryManager, getAssignedLaboratoryIds } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAllActivitiesModal, setShowAllActivitiesModal] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
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
  const [recentActivity, setRecentActivity] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [laboratories, setLaboratories] = useState([]);

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

  // Load unread notification count for Laboratory Managers
  useEffect(() => {
    if (!isLaboratoryManager()) return;

    const notificationsRef = ref(database, 'notifications');
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Get assigned laboratory IDs for this user
        const assignedLabIds = getAssignedLaboratoryIds();
        
        // Count unread notifications for this user
        const unreadCount = notificationsList.filter(notification => {
          if (notification.isRead) return false;
          
          // Check if notification is directly for this user
          if (notification.recipientUserId === user.uid) return true;
          
          // Check if notification is for one of their assigned laboratories
          if (notification.labId && assignedLabIds.includes(notification.labId)) return true;
          
          return false;
        }).length;
        
        setUnreadNotificationCount(unreadCount);
      } else {
        setUnreadNotificationCount(0);
      }
    });

    return () => unsubscribe();
  }, [isLaboratoryManager, user, getAssignedLaboratoryIds]);

  // Load data for overdue equipment checking
  useEffect(() => {
    const loadDataForOverdueCheck = async () => {
      try {
        // Load borrow requests
        const borrowRequestsRef = ref(database, 'borrow_requests');
        const borrowSnapshot = await get(borrowRequestsRef);
        
        if (borrowSnapshot.exists()) {
          const requestsData = borrowSnapshot.val();
          const requestsList = Object.keys(requestsData).map(key => ({
            id: key,
            ...requestsData[key]
          }));
          setAllRequests(requestsList);
        }

        // Load equipment data
        const categoriesRef = ref(database, 'equipment_categories');
        const categoriesSnapshot = await get(categoriesRef);
        
        if (categoriesSnapshot.exists()) {
          const categoriesData = categoriesSnapshot.val();
          const allEquipment = [];
          
          for (const categoryId in categoriesData) {
            const equipmentsRef = ref(database, `equipment_categories/${categoryId}/equipments`);
            const equipmentsSnapshot = await get(equipmentsRef);
            
            if (equipmentsSnapshot.exists()) {
              const equipmentData = equipmentsSnapshot.val();
              Object.keys(equipmentData).forEach(equipmentId => {
                allEquipment.push({
                  id: equipmentId,
                  categoryId: categoryId,
                  categoryName: categoriesData[categoryId].title,
                  ...equipmentData[equipmentId]
                });
              });
            }
          }
          
          setEquipmentData(allEquipment);
        }

        // Load laboratories
        const laboratoriesRef = ref(database, 'laboratories');
        const laboratoriesSnapshot = await get(laboratoriesRef);
        
        if (laboratoriesSnapshot.exists()) {
          const laboratoriesData = laboratoriesSnapshot.val();
          const laboratoriesList = Object.keys(laboratoriesData).map(key => ({
            id: key,
            ...laboratoriesData[key]
          }));
          setLaboratories(laboratoriesList);
        }
      } catch (error) {
        console.error("Error loading data for overdue check:", error);
      }
    };

    loadDataForOverdueCheck();
  }, []);

  // Periodic overdue equipment check (runs every hour)
  useEffect(() => {
    if (allRequests.length === 0 || equipmentData.length === 0 || laboratories.length === 0) return;

    const checkOverdue = async () => {
      await checkForOverdueEquipment(allRequests, equipmentData, laboratories);
    };

    // Run immediately
    checkOverdue();

    // Set up interval to check every hour
    const interval = setInterval(checkOverdue, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [allRequests, equipmentData, laboratories]);

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

        // Calculate real adviser vs student borrowing statistics
        let adviserBorrowings = 0;
        let studentBorrowings = 0;
        
        requests.forEach(req => {
          if (req.status === 'in_progress' || req.status === 'approved') {
            // Enhanced user type detection similar to HistoryPage
            const borrowerName = req.adviserName?.toLowerCase() || '';
            const userEmail = req.userEmail?.toLowerCase() || '';
            
            // Check for faculty indicators
            const facultyNamePatterns = [
              'prof', 'professor', 'dr', 'doctor', 'mr', 'ms', 'mrs', 'sir', 'teacher',
              'instructor', 'lecturer', 'dean', 'director', 'head', 'coordinator'
            ];
            
            const facultyEmailPatterns = [
              '@faculty.', '@staff.', '@prof.', '@instructor.', '@teacher.',
              '.edu', '.ac.'
            ];
            
            const studentEmailPatterns = ['@student.', '@stud.', 'student@', 'stud@'];
            
            const hasFacultyNamePattern = facultyNamePatterns.some(pattern => 
              borrowerName.includes(pattern)
            );
            
            const hasFacultyEmailPattern = facultyEmailPatterns.some(pattern => 
              userEmail.includes(pattern)
            );
            
            const hasStudentEmailPattern = studentEmailPatterns.some(pattern => 
              userEmail.includes(pattern)
            );
            
            const isFaculty = (hasFacultyNamePattern || hasFacultyEmailPattern) && !hasStudentEmailPattern;
            
            if (isFaculty) {
              adviserBorrowings++;
            } else {
              studentBorrowings++;
            }
          }
        });

        setDashboardStats(prev => ({
          ...prev,
          pendingRequests: pendingCount,
          borrowedItems: borrowedCount,
          overdueItems: overdueCount,
          borrowedByAdviser: adviserBorrowings,
          borrowedByStudents: studentBorrowings
        }));
      }
    });

    // Load equipment data
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

    // Load users data (estimate from borrow requests)
    const unsubscribeUsers = onValue(borrowRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requests = Object.values(data);
        // Get unique users from borrow requests
        const uniqueUsers = new Set();
        requests.forEach(req => {
          if (req.userEmail) uniqueUsers.add(req.userEmail);
          if (req.adviserName) uniqueUsers.add(req.adviserName);
        });

        setDashboardStats(prev => ({
          ...prev,
          totalUsers: uniqueUsers.size
        }));
      }
    });

    return () => {
      unsubscribeBorrowRequests();
      unsubscribeEquipment();
      unsubscribeUsers();
    };
  }, []);

  // Load recent activity data
  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        // Get recent borrow requests
        const borrowRequestsRef = ref(database, 'borrow_requests');
        const equipmentRef = ref(database, 'equipment');
        const announcementsRef = ref(database, 'announcements');
        const categoriesRef = ref(database, 'equipment_categories');

        // Import get function for one-time reads
        const { get } = await import('firebase/database');
        
        const [borrowSnapshot, equipmentSnapshot, announcementsSnapshot, categoriesSnapshot] = await Promise.all([
          get(borrowRequestsRef),
          get(equipmentRef),
          get(announcementsRef),
          get(categoriesRef)
        ]);

        const activities = [];
        const assignedLabIds = isLaboratoryManager() ? getAssignedLaboratoryIds() : [];

        // Process announcements (visible to everyone)
        const announcementsData = announcementsSnapshot.val();
        if (announcementsData) {
          Object.keys(announcementsData).forEach(key => {
            const announcement = announcementsData[key];
            activities.push({
              id: `announcement_${key}`,
              type: 'announcement',
              title: 'New announcement published',
              time: announcement.createdAt,
              icon: 'primary',
              details: {
                title: announcement.title,
                author: announcement.author
              },
              labId: announcement.labId // Include labId for filtering
            });
          });
        }

        // Process borrow requests with role-based filtering
        const borrowData = borrowSnapshot.val();
        const categoriesData = categoriesSnapshot.val();
        
        if (borrowData) {
          Object.keys(borrowData).forEach(key => {
            const request = borrowData[key];
            
            // Check if this request should be visible to the current user
            let shouldShow = false;
            
            if (isAdmin()) {
              // Admin sees all requests
              shouldShow = true;
            } else if (isLaboratoryManager() && assignedLabIds) {
              // Lab Manager only sees requests from their assigned laboratories
              if (categoriesData) {
                // Find the equipment category for this request
                const category = Object.values(categoriesData).find(cat => cat.title === request.categoryName);
                if (category && category.labId) {
                  // Check if this lab is assigned to the current manager
                  const lab = laboratories.find(lab => lab.labId === category.labId);
                  if (lab && assignedLabIds.includes(lab.id)) {
                    shouldShow = true;
                  }
                }
              }
            }
            
            if (shouldShow) {
              activities.push({
                id: `request_${key}`,
                type: 'request',
                title: request.status === 'approved' ? 'Borrow request approved' : 
                       request.status === 'pending' ? 'New borrow request submitted' :
                       request.status === 'rejected' ? 'Borrow request rejected' :
                       request.status === 'released' ? 'Equipment released' :
                       'Borrow request status updated',
                time: request.requestedAt || request.updatedAt,
                icon: request.status === 'approved' ? 'info' : 
                      request.status === 'released' ? 'success' :
                      request.status === 'rejected' ? 'warning' : 'success',
                details: {
                  item: request.itemName,
                  borrower: request.adviserName,
                  status: request.status,
                  laboratory: request.laboratory
                },
                labId: request.labId
              });
            }
          });
        }

        // Process equipment additions (only for admin)
        if (isAdmin()) {
          const equipmentData = equipmentSnapshot.val();
          if (equipmentData) {
            const equipmentCount = Object.keys(equipmentData).length;
            activities.push({
              id: 'equipment_management',
              type: 'equipment',
              title: 'Equipment inventory updated',
              time: new Date().toISOString(),
              icon: 'success',
              details: {
                totalEquipment: equipmentCount
              }
            });
          }
        }

        // Sort by time and take most recent
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // Store all activities for "See All" modal
        setAllActivities(activities);
        
        // Show only first 4 for recent activity
        setRecentActivity(activities.slice(0, 4));

      } catch (error) {
        console.error("Error loading recent activity:", error);
      }
    };

    loadRecentActivity();
  }, [isAdmin, isLaboratoryManager, getAssignedLaboratoryIds, laboratories]);

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

  // Helper function to format time differences
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const renderContent = () => {
    console.log("Rendering content for section:", activeSection); // Debug log
    
    switch (activeSection) {
      case "dashboard":
        return (
          <div className="dashboard-content-centered">
            <div className="dashboard-welcome">
              <div className="welcome-content">
                <h1>Welcome to SmartLab Dashboard</h1>
                <p>Monitor and manage your laboratory equipment efficiently</p>
              </div>
              {isLaboratoryManager() && (
                <div className="notification-bell-container">
                  <button 
                    className="notification-bell"
                    onClick={() => setShowNotificationModal(true)}
                    title="View Notifications"
                  >
                    🔔
                    {unreadNotificationCount > 0 && (
                      <span className="notification-badge">{unreadNotificationCount}</span>
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* Main Statistics Grid */}
            <div className="main-stats-grid">
              <div className="stat-card-large primary">
                <div className="stat-number">{dashboardStats.borrowedByAdviser}</div>
                <div className="stat-label">Items Borrowed by Instructor</div>
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
                <div className="activity-header-with-button">
                  <div>
                    <h3>Recent Activity</h3>
                    <p>Latest system activities</p>
                  </div>
                  {allActivities.length > 0 && (
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => setShowAllActivitiesModal(true)}
                      title="View all activities"
                    >
                      See All ({allActivities.length})
                    </button>
                  )}
                </div>
                <div className="activity-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="activity-item">
                        <div className={`activity-icon ${activity.icon}`}>
                          {activity.icon === 'success' ? '✅' : 
                           activity.icon === 'info' ? '📋' :
                           activity.icon === 'warning' ? '⚠️' :
                           activity.icon === 'primary' ? '📢' : '📋'}
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{activity.title}</div>
                          {activity.details && activity.details.item && (
                            <div className="activity-details">
                              {activity.type === 'request' && (
                                <span className="activity-item-name">{activity.details.item}</span>
                              )}
                              {activity.details.borrower && (
                                <span className="activity-borrower">by {activity.details.borrower}</span>
                              )}
                              {activity.details.laboratory && (
                                <span className="activity-lab">Lab: {activity.details.laboratory}</span>
                              )}
                            </div>
                          )}
                          <div className="activity-time">{formatTimeAgo(activity.time)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="activity-item">
                      <div className="activity-icon info">📋</div>
                      <div className="activity-content">
                        <div className="activity-title">No recent activity</div>
                        <div className="activity-time">System is ready</div>
                      </div>
                    </div>
                  )}
                </div>
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
      
      case "laboratories":
        return <LaboratoryManagement />;
      
      case "request-forms":
        return <RequestFormsPage />;
      
      case "history":
        return <HistoryPage />;
      
      case "users":
        if (!isAdmin()) {
          return (
            <div className="dashboard-content-centered">
              <div className="access-denied">
                <h1>Access Denied</h1>
                <p>You don't have permission to access this section. Admin privileges required.</p>
              </div>
            </div>
          );
        }
        return <UserManagement onRedirectToUsers={() => setActiveSection("users")} />;
      
      case "analytics":
        return <Analytics />;
      
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
      
      {showNotificationModal && (
        <NotificationModal
          isOpen={showNotificationModal}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
      
      {showAllActivitiesModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '800px', maxHeight: '80vh', overflow: 'auto'}}>
            <div className="modal-header">
              <h2>All Activities</h2>
              <button onClick={() => setShowAllActivitiesModal(false)} className="modal-close-btn">×</button>
            </div>
            <div className="modal-body">
              <div className="activity-list">
                {allActivities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.icon}`}>
                      {activity.icon === 'success' ? '✅' : 
                       activity.icon === 'info' ? '📋' :
                       activity.icon === 'warning' ? '⚠️' :
                       activity.icon === 'primary' ? '📢' : '📋'}
                    </div>
                    <div className="activity-content">
                      <div className="activity-title">{activity.title}</div>
                      {activity.details && (
                        <div className="activity-details">
                          {activity.details.item && (
                            <span className="activity-item-name">{activity.details.item}</span>
                          )}
                          {activity.details.borrower && (
                            <span className="activity-borrower">by {activity.details.borrower}</span>
                          )}
                          {activity.details.laboratory && (
                            <span className="activity-lab">Lab: {activity.details.laboratory}</span>
                          )}
                          {activity.details.author && (
                            <span className="activity-author">by {activity.details.author}</span>
                          )}
                        </div>
                      )}
                      <div className="activity-time">{formatDate(activity.time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}