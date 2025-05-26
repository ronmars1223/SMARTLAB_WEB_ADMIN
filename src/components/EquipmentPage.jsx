// src/components/HistoryPage.jsx
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import "../CSS/HistoryPage.css";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const activityTypes = ["Request Update", "Equipment Change", "User Action", "System Event"];
  const statuses = ["pending", "approved", "rejected", "in_progress", "completed", "cancelled"];

  // Load history data from Firebase
  useEffect(() => {
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
            type: "Request Update",
            action: "Request Created",
            itemName: request.itemName,
            adviserName: request.adviserName,
            status: request.status || "pending",
            timestamp: request.requestedAt || request.dateToBeUsed,
            details: {
              requestId: key,
              originalRequest: request,
              action: "created",
              previousStatus: null,
              newStatus: request.status || "pending"
            }
          });

          // Create entry for status updates if updatedAt exists
          if (request.updatedAt && request.updatedAt !== request.requestedAt) {
            historyList.push({
              id: `${key}_updated`,
              type: "Request Update", 
              action: `Status Changed to ${request.status}`,
              itemName: request.itemName,
              adviserName: request.adviserName,
              status: request.status,
              timestamp: request.updatedAt,
              reviewedBy: request.reviewedBy || "System",
              details: {
                requestId: key,
                originalRequest: request,
                action: "status_updated",
                newStatus: request.status,
                reviewedBy: request.reviewedBy
              }
            });
          }
        });

        // Sort by timestamp, newest first
        historyList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setHistoryData(historyList);
      } else {
        setHistoryData([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort history data
  const filteredHistory = historyData
    .filter(entry => {
      const matchesSearch = entry.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.adviserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           entry.reviewedBy?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === "All" || entry.type === filterType;
      const matchesStatus = filterStatus === "All" || entry.status === filterStatus;
      
      let matchesDate = true;
     
      
      return matchesSearch && matchesType && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue = a[sortBy] || a.timestamp;
      let bValue = b[sortBy] || b.timestamp;
      
      if (sortBy === "timestamp") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'in_progress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getActionIcon = (action) => {
    if (action.includes("Created")) return "✨";
    if (action.includes("approved")) return "✅";
    if (action.includes("rejected")) return "❌";
    if (action.includes("in_progress")) return "🔄";
    if (action.includes("completed")) return "🎉";
    if (action.includes("cancelled")) return "🚫";
    return "📝";
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedEntry(null);
    setShowDetailsModal(false);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return "↕️";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  const getHistoryStats = () => {
    const stats = {
      total: historyData.length,
      today: historyData.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const today = new Date();
        return entryDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: historyData.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return entryDate >= weekAgo;
      }).length,
      requests: historyData.filter(entry => entry.type === "Request Update").length
    };
    return stats;
  };

  // eslint-disable-next-line no-unused-vars
  const stats = getHistoryStats();

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon">📊</div>
            <div className="loading-text">Loading history data...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      {/* Statistics Overview */}
    

      {/* Filters and Search */}
      <div className="history-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Time</option>
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="history-container">
        {filteredHistory.length > 0 ? (
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("action")} className="sortable">
                    Action {getSortIcon("action")}
                  </th>
                  <th onClick={() => handleSort("type")} className="sortable">
                    Type {getSortIcon("type")}
                  </th>
                  <th onClick={() => handleSort("itemName")} className="sortable">
                    Item Name {getSortIcon("itemName")}
                  </th>
                  <th onClick={() => handleSort("adviserName")} className="sortable">
                    Adviser {getSortIcon("adviserName")}
                  </th>
                  <th onClick={() => handleSort("status")} className="sortable">
                    Status {getSortIcon("status")}
                  </th>
                  <th>Reviewed By</th>
                  <th onClick={() => handleSort("timestamp")} className="sortable">
                    Timestamp {getSortIcon("timestamp")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="action-cell">
                      <div className="action-info">
                        <span className="action-icon">{getActionIcon(entry.action)}</span>
                        <span className="action-text">{entry.action}</span>
                      </div>
                    </td>
                    <td>
                      <span className="type-badge">{entry.type}</span>
                    </td>
                    <td className="item-cell">
                      <span className="item-name">{entry.itemName || "N/A"}</span>
                    </td>
                    <td className="adviser-cell">
                      <div className="adviser-info">
                        <div className="adviser-avatar">
                          {entry.adviserName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="adviser-name">{entry.adviserName || "Unknown"}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="reviewer-cell">
                      {entry.reviewedBy || "-"}
                    </td>
                    <td className="date-cell">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td>
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewDetails(entry)}
                        title="View Details"
                      >
                        👁️ View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No History Found</h3>
            <p>
              {searchTerm || filterType !== "All" || filterStatus !== "All" || dateRange !== "All"
                ? "No activities match your current filters."
                : "No system activities have been recorded yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Activity Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Activity Information</h3>
                  <div className="detail-item">
                    <label>Action:</label>
                    <span>{selectedEntry.action}</span>
                  </div>
                  <div className="detail-item">
                    <label>Type:</label>
                    <span>{selectedEntry.type}</span>
                  </div>
                  <div className="detail-item">
                    <label>Timestamp:</label>
                    <span>{formatDate(selectedEntry.timestamp)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedEntry.status)}`}>
                      {selectedEntry.status}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Related Information</h3>
                  <div className="detail-item">
                    <label>Item Name:</label>
                    <span>{selectedEntry.itemName || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Adviser:</label>
                    <span>{selectedEntry.adviserName || "N/A"}</span>
                  </div>
                  {selectedEntry.reviewedBy && (
                    <div className="detail-item">
                      <label>Reviewed By:</label>
                      <span>{selectedEntry.reviewedBy}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <label>Request ID:</label>
                    <span>{selectedEntry.details?.requestId || "N/A"}</span>
                  </div>
                </div>

                {selectedEntry.details?.originalRequest && (
                  <div className="detail-section">
                    <h3>Original Request Data</h3>
                    <div className="detail-item">
                      <label>Category:</label>
                      <span>{selectedEntry.details.originalRequest.categoryName || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Laboratory:</label>
                      <span>{selectedEntry.details.originalRequest.laboratory || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Quantity:</label>
                      <span>{selectedEntry.details.originalRequest.quantity || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Date to be Used:</label>
                      <span>{selectedEntry.details.originalRequest.dateToBeUsed ? formatDate(selectedEntry.details.originalRequest.dateToBeUsed) : "N/A"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}