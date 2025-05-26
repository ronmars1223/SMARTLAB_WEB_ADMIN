// src/components/RequestFormsPage.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove } from "firebase/database";
import { database } from "../firebase";
import "../CSS/RequestFormsPage.css";

export default function RequestFormsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Add these missing state variables
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const statuses = ["pending", "approved", "rejected", "in_progress"];
  const requestTypes = ["Alcohol", "Laboratory Equipment", "Chemicals", "Other"];

  // Load requests from Firebase
  useEffect(() => {
    const borrowRequestsRef = ref(database, 'borrow_requests');
    
    const unsubscribe = onValue(borrowRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by creation date, newest first
        requestsList.sort((a, b) => new Date(b.requestedAt || b.dateToBeUsed) - new Date(a.requestedAt || a.dateToBeUsed));
        setRequests(requestsList);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter and sort requests
  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.adviserName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.laboratory?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "All" || request.status === filterStatus;
      const matchesType = filterType === "All" || request.categoryName === filterType;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "requestedAt" || sortBy === "dateToBeUsed" || sortBy === "dateToReturn") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      const requestRef = ref(database, `borrow_requests/${requestId}`);
      await update(requestRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        reviewedBy: "Admin" // You can get actual admin name from auth
      });
      
      // Update local state
      setRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { ...request, status: newStatus, updatedAt: new Date().toISOString() }
          : request
      ));
    } catch (error) {
      console.error("Error updating request status:", error);
      alert("Failed to update request status. Please try again.");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to delete this borrow request?")) {
      try {
        const requestRef = ref(database, `borrow_requests/${requestId}`);
        await remove(requestRef);
      } catch (error) {
        console.error("Error deleting request:", error);
        alert("Failed to delete request. Please try again.");
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'in_progress': return 'status-progress';
      default: return 'status-pending';
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setSelectedRequest(null);
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



  if (loading) {
    return (
      <div className="request-forms-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon">📋</div>
            <div className="loading-text">Loading request forms...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="request-forms-page">
      {/* Page Header */}
      <div className="request-forms-header">
        <div className="header-content">
          <h1 className="page-title">Request Forms Management</h1>
          <p className="page-subtitle">Review and manage user requests for equipment and services</p>
        </div>
      </div>

   

      {/* Filters and Search */}
      <div className="request-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search requests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-section">
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Types</option>
            {requestTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Request Table */}
      <div className="requests-container">
        {filteredRequests.length > 0 ? (
          <div className="table-container">
            <table className="requests-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("itemName")} className="sortable">
                    Item Name {getSortIcon("itemName")}
                  </th>
                  <th onClick={() => handleSort("adviserName")} className="sortable">
                    Adviser {getSortIcon("adviserName")}
                  </th>
                  <th onClick={() => handleSort("categoryName")} className="sortable">
                    Category {getSortIcon("categoryName")}
                  </th>
                  <th onClick={() => handleSort("laboratory")} className="sortable">
                    Laboratory {getSortIcon("laboratory")}
                  </th>
                  <th onClick={() => handleSort("quantity")} className="sortable">
                    Quantity {getSortIcon("quantity")}
                  </th>
                  <th onClick={() => handleSort("status")} className="sortable">
                    Status {getSortIcon("status")}
                  </th>
                  <th onClick={() => handleSort("requestedAt")} className="sortable">
                    Date Requested {getSortIcon("requestedAt")}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="item-name-cell">
                      <div className="item-info">
                        <span className="item-name">{request.itemName || "Untitled"}</span>
                        <span className="item-number">{request.itemNo || ""}</span>
                      </div>
                    </td>
                    <td className="adviser-cell">
                      <div className="adviser-info">
                        <div className="adviser-avatar">
                          {request.adviserName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="adviser-name">{request.adviserName || "Unknown"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {request.categoryName || "General"}
                      </span>
                    </td>
                    <td className="laboratory-cell">{request.laboratory || "Not specified"}</td>
                    <td className="quantity-cell">
                      <span className="quantity-badge">{request.quantity || "1"}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status || "pending"}
                      </span>
                    </td>
                    <td className="date-cell">
                      {formatDate(request.requestedAt || request.dateToBeUsed)}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleViewDetails(request)}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              className="action-btn approve-btn"
                              onClick={() => handleStatusUpdate(request.id, "approved")}
                              title="Approve"
                            >
                              ✅
                            </button>
                            <button
                              className="action-btn reject-btn"
                              onClick={() => handleStatusUpdate(request.id, "rejected")}
                              title="Reject"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteRequest(request.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Request Forms Found</h3>
            <p>
              {searchTerm || filterStatus !== "All" || filterType !== "All" 
                ? "No requests match your current filters." 
                : "No request forms have been submitted yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Borrow Request Details</h2>
              <button className="modal-close" onClick={closeDetailsModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-section">
                  <h3>Request Information</h3>
                  <div className="detail-item">
                    <label>Item Name:</label>
                    <span>{selectedRequest.itemName || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Item Number:</label>
                    <span>{selectedRequest.itemNo || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category:</label>
                    <span>{selectedRequest.categoryName || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Quantity:</label>
                    <span>{selectedRequest.quantity || "1"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Laboratory:</label>
                    <span>{selectedRequest.laboratory || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Requester Information</h3>
                  <div className="detail-item">
                    <label>Adviser Name:</label>
                    <span>{selectedRequest.adviserName || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>User Email:</label>
                    <span>{selectedRequest.userEmail || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>User ID:</label>
                    <span>{selectedRequest.userId || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Adviser ID:</label>
                    <span>{selectedRequest.adviserId || "N/A"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Schedule Information</h3>
                  <div className="detail-item">
                    <label>Date to be Used:</label>
                    <span>{selectedRequest.dateToBeUsed ? formatDate(selectedRequest.dateToBeUsed) : "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Date to Return:</label>
                    <span>{selectedRequest.dateToReturn ? formatDate(selectedRequest.dateToReturn) : "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Requested At:</label>
                    <span>{selectedRequest.requestedAt ? formatDate(selectedRequest.requestedAt) : "N/A"}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Status Information</h3>
                  <div className="detail-item">
                    <label>Current Status:</label>
                    <span className={`status-badge ${getStatusBadgeClass(selectedRequest.status)}`}>
                      {selectedRequest.status || "pending"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Request ID:</label>
                    <span>{selectedRequest.requestId || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Category ID:</label>
                    <span>{selectedRequest.categoryId || "N/A"}</span>
                  </div>
                  <div className="detail-item">
                    <label>Item ID:</label>
                    <span>{selectedRequest.itemId || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                {selectedRequest.status === "pending" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, "approved");
                        closeDetailsModal();
                      }}
                    >
                      ✅ Approve Request
                    </button>
                    <button
                      className="btn btn-warning"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, "in_progress");
                        closeDetailsModal();
                      }}
                    >
                      🔄 Mark In Progress
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, "rejected");
                        closeDetailsModal();
                      }}
                    >
                      ❌ Reject Request
                    </button>
                  </>
                )}
                
                {selectedRequest.status === "in_progress" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, "approved");
                        closeDetailsModal();
                      }}
                    >
                      ✅ Mark as Completed
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => {
                        handleStatusUpdate(selectedRequest.id, "rejected");
                        closeDetailsModal();
                      }}
                    >
                      ❌ Reject Request
                    </button>
                  </>
                )}

                {(selectedRequest.status === "approved" || selectedRequest.status === "rejected") && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, "pending");
                      closeDetailsModal();
                    }}
                  >
                    🔄 Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}