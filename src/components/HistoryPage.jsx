// src/components/HistoryPage.jsx
import { useState, useEffect } from "react";
import { ref, onValue, get } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "../CSS/HistoryPage.css";

export default function HistoryPage() {
  const { isAdmin, getAssignedLaboratoryIds } = useAuth();
  const [historyData, setHistoryData] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("Status");
  const [dateRange, setDateRange] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const statuses = ["Released", "Returned", "Pending", "Approved", "Rejected", "In Progress", "Completed", "Cancelled"];

  // Load laboratories data
  const loadLaboratories = async () => {
    try {
      const laboratoriesRef = ref(database, 'laboratories');
      const snapshot = await get(laboratoriesRef);
      
      if (snapshot.exists()) {
        const laboratoriesData = snapshot.val();
        const laboratoriesList = Object.keys(laboratoriesData).map(key => ({
          id: key,
          ...laboratoriesData[key]
        }));
        setLaboratories(laboratoriesList);
      }
    } catch (error) {
      console.error("Error loading laboratories:", error);
    }
  };

  // Load equipment data for laboratory filtering
  const loadEquipmentData = async () => {
    try {
      const categoriesRef = ref(database, 'equipment_categories');
      const snapshot = await get(categoriesRef);
      
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const allEquipment = [];
        
        // Load equipment from each category
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
    } catch (error) {
      console.error("Error loading equipment data:", error);
    }
  };

  // Load users data to get borrower names
  const loadUsers = async () => {
    try {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const usersList = Object.keys(usersData).map(key => ({
          id: key,
          ...usersData[key]
        }));
        setUsers(usersList);
      }
    } catch (error) {
      console.error("Error loading users data:", error);
    }
  };

  // Helper function to get borrower name from userId
  const getBorrowerName = (userId) => {
    if (!userId) return "Unknown";
    const user = users.find(u => u.id === userId || u.userId === userId);
    return user?.name || user?.fullName || user?.displayName || user?.email || "Unknown";
  };

  // Load history data from Firebase
  useEffect(() => {
    loadLaboratories();
    loadEquipmentData();
    loadUsers();
    const borrowRequestsRef = ref(database, 'borrow_requests');
    
    const unsubscribe = onValue(borrowRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyList = [];
        
        // Process borrow requests into history entries
        Object.keys(data).forEach(key => {
          const request = data[key];
          
          // Create entry for initial request
          historyList.push({
            id: `${key}_created`,
            action: "Item Released",
            equipmentName: request.itemName,
            borrower: request.adviserName,
            userId: request.userId,
            adviserName: request.adviserName,
            status: request.status || "Released",
            releasedDate: request.requestedAt || request.dateToBeUsed,
            returnDate: request.dateToReturn,
            condition: "Excellent condition, all parts intact",
            timestamp: request.requestedAt || request.dateToBeUsed,
            details: {
              requestId: key,
              originalRequest: request,
              action: "released",
              previousStatus: null,
              newStatus: request.status || "Released"
            }
          });

          // Create entry for status updates if updatedAt exists
          if (request.updatedAt && request.updatedAt !== request.requestedAt) {
            const isReturned = request.status === "completed" || request.status === "returned";
            const condition = isReturned && request.returnDetails 
              ? `${request.returnDetails.condition === "good" ? "Good" : request.returnDetails.condition === "damaged" ? "Damaged" : "Lost/Missing"} condition${request.returnDetails.delayReason === "late" ? " (Late return)" : request.returnDetails.delayReason === "early" ? " (Early return)" : ""}`
              : isReturned ? "Cleaned and recalibrated" : "Good condition";
            
            historyList.push({
              id: `${key}_updated`,
              action: isReturned ? "Item Returned" : "Status Updated",
              equipmentName: request.itemName,
              borrower: request.adviserName,
              userId: request.userId,
              adviserName: request.adviserName,
              status: isReturned ? "Returned" : request.status,
              releasedDate: request.requestedAt,
              returnDate: isReturned ? (request.returnedAt || request.updatedAt) : request.dateToReturn,
              condition: condition,
              timestamp: request.updatedAt,
              details: {
                requestId: key,
                originalRequest: request,
                action: "status_updated",
                newStatus: request.status,
                reviewedBy: request.reviewedBy,
                returnDetails: request.returnDetails || null
              }
            });
          }
        });

        // Sort by timestamp, newest first
        historyList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Filter history based on user role and assigned laboratories
        let filteredHistory = historyList;
        if (!isAdmin()) {
          const assignedLabIds = getAssignedLaboratoryIds();
          if (assignedLabIds && equipmentData.length > 0 && laboratories.length > 0) {
            // Filter history to only show entries from assigned laboratories
            filteredHistory = historyList.filter(historyEntry => {
              // Find the equipment that matches this history entry
              const matchingEquipment = equipmentData.find(equipment => 
                equipment.equipmentName === historyEntry.equipmentName || 
                equipment.itemName === historyEntry.equipmentName ||
                equipment.name === historyEntry.equipmentName ||
                equipment.title === historyEntry.equipmentName
              );
              
              if (matchingEquipment && matchingEquipment.labId) {
                // Find the laboratory that matches this equipment's labId
                const laboratory = laboratories.find(lab => lab.labId === matchingEquipment.labId);
                
                if (laboratory) {
                  // Check if this laboratory is assigned to the current user
                  return assignedLabIds.includes(laboratory.id);
                }
              }
              
              // If no matching equipment or laboratory found, don't show the history entry
              return false;
            });
          }
        }
        
        setHistoryData(filteredHistory);
      } else {
        setHistoryData([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort history data
  const filteredHistory = historyData.filter(entry => {
    const borrowerName = getBorrowerName(entry.userId);
    const matchesSearch = entry.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.borrower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         borrowerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.adviserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.action?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === "All Types" || entry.action.includes(filterType);
    const matchesStatus = filterStatus === "Status" || entry.status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'released': return 'status-released';
      case 'returned': return 'status-returned';
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      default: return 'status-pending';
    }
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
    setActiveTab("overview"); // Reset to first tab
  };

  const closeDetailsModal = () => {
    setSelectedEntry(null);
    setShowDetailsModal(false);
    setActiveTab("overview");
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Enhanced user type detection function
  const determineUserType = (entry) => {
    const borrowerName = entry.borrower?.toLowerCase() || '';
    const userEmail = entry.details?.originalRequest?.userEmail?.toLowerCase() || '';
    
    // Check for faculty indicators in name
    const facultyNamePatterns = [
      'prof', 'professor', 'dr', 'doctor', 'mr', 'ms', 'mrs', 'sir', 'teacher',
      'instructor', 'lecturer', 'dean', 'director', 'head', 'coordinator'
    ];
    
    const hasFacultyNamePattern = facultyNamePatterns.some(pattern => 
      borrowerName.includes(pattern)
    );
    
    // Check for faculty email patterns (common institutional patterns)
    const facultyEmailPatterns = [
      '@faculty.', '@staff.', '@prof.', '@instructor.', '@teacher.',
      '.edu', '.ac.' // Many academic institutions use these
    ];
    
    const hasFacultyEmailPattern = facultyEmailPatterns.some(pattern => 
      userEmail.includes(pattern)
    );
    
    // Check if email contains student indicators
    const studentEmailPatterns = ['@student.', '@stud.', 'student@', 'stud@'];
    const hasStudentEmailPattern = studentEmailPatterns.some(pattern => 
      userEmail.includes(pattern)
    );
    
    // Return true if faculty indicators found and no student indicators
    return (hasFacultyNamePattern || hasFacultyEmailPattern) && !hasStudentEmailPattern;
  };

  // Calculate real usage data from Firebase data
  const calculateUsageData = (equipmentName) => {
    // Filter history data for the specific equipment
    const equipmentHistory = historyData.filter(entry => 
      entry.equipmentName === equipmentName
    );

    // Count total borrowings (each "Item Released" action counts as one borrowing)
    const totalBorrowings = equipmentHistory.filter(entry => 
      entry.action === "Item Released"
    ).length;

    // Count borrowings by user type (students vs faculty)
    let studentBorrowings = 0;
    let facultyBorrowings = 0;

    equipmentHistory.forEach(entry => {
      if (entry.action === "Item Released") {
        // Enhanced user type detection
        const isFaculty = determineUserType(entry);
        
        if (isFaculty) {
          facultyBorrowings++;
        } else {
          studentBorrowings++;
        }
      }
    });

    return {
      total: totalBorrowings,
      students: studentBorrowings,
      faculty: facultyBorrowings
    };
  };

  // Calculate usage statistics for the selected equipment
  const calculateUsageStatistics = (equipmentName) => {
    const equipmentHistory = historyData.filter(entry => 
      entry.equipmentName === equipmentName
    );

    if (equipmentHistory.length === 0) {
      return {
        mostActivePeriod: "No data available",
        averageUsage: "0 times/month",
        utilizationRate: "0%"
      };
    }

    // Calculate most active period (month with most borrowings)
    const monthlyData = {};
    equipmentHistory.forEach(entry => {
      if (entry.action === "Item Released" && entry.timestamp) {
        const date = new Date(entry.timestamp);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });

    const mostActiveMonth = Object.entries(monthlyData).reduce((max, [month, count]) => 
      count > max.count ? { month, count } : max, 
      { month: "No data", count: 0 }
    );

    // Format the most active period
    const formatMonth = (monthKey) => {
      const [year, month] = monthKey.split('-');
      const monthNames = ["January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    // Calculate average usage per month
    const totalMonths = Object.keys(monthlyData).length;
    const totalBorrowings = Object.values(monthlyData).reduce((sum, count) => sum + count, 0);
    const averageUsage = totalMonths > 0 ? (totalBorrowings / totalMonths).toFixed(1) : "0";

    // Calculate utilization rate (simplified: percentage of months with activity)
    const monthsWithActivity = Object.keys(monthlyData).length;
    const totalPossibleMonths = Math.max(1, Math.ceil((new Date() - new Date(equipmentHistory[equipmentHistory.length - 1]?.timestamp || new Date())) / (1000 * 60 * 60 * 24 * 30)));
    const utilizationRate = Math.round((monthsWithActivity / totalPossibleMonths) * 100);

    return {
      mostActivePeriod: mostActiveMonth.month !== "No data" ? formatMonth(mostActiveMonth.month) : "No data available",
      averageUsage: `${averageUsage} times/month`,
      utilizationRate: `${utilizationRate}%`
    };
  };



  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-container">
          <div className="loading-icon">📊</div>
          <div className="loading-text">Loading history data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <h1 className="history-title">Equipment Borrowing History</h1>
        <div className="header-actions">
          <button className="action-button">
            📤 Export
          </button>
          <button className="action-button">
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        {/* Search */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="All Types">All Types</option>
          <option value="Released">Released</option>
          <option value="Returned">Returned</option>
          <option value="Updated">Updated</option>
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="Status">Status</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        {/* Date Range */}
        <input
          type="date"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="date-input"
        />

        {/* Filter Button */}
        <button className="filter-button">
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        {currentItems.length > 0 ? (
          <>
            <div className="table-wrapper">
              <table className="history-table">
                <thead className="table-header">
                  <tr>
                    <th>Action</th>
                    <th>Equipment Name</th>
                    <th>Borrower Name</th>
                    <th>Adviser Name</th>
                    <th>Status</th>
                    <th>Released Date</th>
                    <th>Return Date</th>
                    <th>Condition</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {currentItems.map((entry) => (
                    <tr key={entry.id}>
                      <td className="table-cell">{entry.action}</td>
                      <td className="table-cell equipment-name">{entry.equipmentName}</td>
                      <td className="table-cell">{getBorrowerName(entry.userId)}</td>
                      <td className="table-cell">{entry.adviserName || "Unknown"}</td>
                      <td className="table-cell">
                        <span className={`status-badge ${getStatusClass(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="table-cell date-cell">
                        <div>{formatDate(entry.releasedDate)}</div>
                        <div className="date-time">{formatTime(entry.releasedDate)}</div>
                      </td>
                      <td className="table-cell date-cell">
                        {entry.returnDate ? (
                          <>
                            <div>{formatDate(entry.returnDate)}</div>
                            <div className="date-time">{formatTime(entry.returnDate)}</div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="table-cell date-cell">{entry.condition}</td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="view-button"
                          title="View Details"
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredHistory.length)} of {filteredHistory.length} entries
              </div>
              
              <div className="pagination-controls">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  Previous
                </button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => paginate(index + 1)}
                    className={`pagination-button ${currentPage === index + 1 ? 'active' : ''}`}
                  >
                    {index + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3 className="empty-title">No History Found</h3>
            <p className="empty-message">
              {searchTerm || filterType !== "All Types" || filterStatus !== "Status"
                ? "No activities match your current filters."
                : "No borrowing activities have been recorded yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Details Modal with Tabs */}
      {showDetailsModal && selectedEntry && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Equipment Details - {selectedEntry.equipmentName}</h2>
              <button onClick={closeDetailsModal} className="modal-close">×</button>
            </div>
            
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button 
                className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📋 Overview
              </button>
              <button 
                className={`tab-button ${activeTab === 'usage' ? 'active' : ''}`}
                onClick={() => setActiveTab('usage')}
              >
                📊 Usage Report
              </button>
            </div>

            <div className="modal-body">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="tab-content">
                  <div className="modal-details">
                    <div className="detail-item">
                      <div className="detail-label">Action:</div>
                      <div className="detail-value">{selectedEntry.action}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Equipment:</div>
                      <div className="detail-value">{selectedEntry.equipmentName}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Borrower Name:</div>
                      <div className="detail-value highlight-text">{getBorrowerName(selectedEntry.userId)}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Adviser Name:</div>
                      <div className="detail-value highlight-text">{selectedEntry.adviserName || "Unknown"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Status:</div>
                      <div className="detail-value">
                        <span className={`status-badge ${getStatusClass(selectedEntry.status)}`}>
                          {selectedEntry.status}
                        </span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Condition:</div>
                      <div className="detail-value">{selectedEntry.condition}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">Released Date:</div>
                      <div className="detail-value">
                        {formatDate(selectedEntry.releasedDate)} at {formatTime(selectedEntry.releasedDate)}
                      </div>
                    </div>
                    {selectedEntry.returnDate && (
                      <div className="detail-item">
                        <div className="detail-label">Return Date:</div>
                        <div className="detail-value">
                          {formatDate(selectedEntry.returnDate)} at {formatTime(selectedEntry.returnDate)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Report Tab */}
              {activeTab === 'usage' && (
                <div className="tab-content">
                  <div className="usage-report">
                    <h3 className="report-title">📊 Equipment Usage Report</h3>
                    <div className="usage-table-container">
                      <table className="usage-table">
                        <thead>
                          <tr>
                            <th>Equipment Name</th>
                            <th>Total Borrowed</th>
                            <th>Borrowed by Students</th>
                            <th>Borrowed by Faculty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const usageData = calculateUsageData(selectedEntry.equipmentName);
                            return (
                              <tr>
                                <td>{selectedEntry.equipmentName}</td>
                                <td>{usageData.total} times</td>
                                <td>{usageData.students}</td>
                                <td>{usageData.faculty}</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="usage-summary">
                      {(() => {
                        const usageStats = calculateUsageStatistics(selectedEntry.equipmentName);
                        return (
                          <>
                            <div className="summary-card">
                              <div className="summary-title">Most Active Period</div>
                              <div className="summary-value">{usageStats.mostActivePeriod}</div>
                            </div>
                            <div className="summary-card">
                              <div className="summary-title">Average Usage</div>
                              <div className="summary-value">{usageStats.averageUsage}</div>
                            </div>
                            <div className="summary-card">
                              <div className="summary-title">Utilization Rate</div>
                              <div className="summary-value">{usageStats.utilizationRate}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )              }
            </div>

            <div className="modal-footer">
              <button onClick={closeDetailsModal} className="close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}