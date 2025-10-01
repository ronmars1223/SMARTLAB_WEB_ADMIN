// src/components/RequestFormsPage.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue, update, remove, get } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "../CSS/RequestFormsPage.css";

export default function RequestFormsPage() {
  const { isAdmin, getAssignedLaboratoryIds } = useAuth();
  const [allRequests, setAllRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [equipmentData, setEquipmentData] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  
  // Add these missing state variables
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnFormData, setReturnFormData] = useState({
    condition: "good",
    delayReason: "",
    notes: ""
  });

  const statuses = ["pending", "approved", "rejected", "in_progress", "returned"];
  const requestTypes = ["Alcohol", "Laboratory Equipment", "Chemicals", "Other"];

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

  // Load requests from Firebase
  useEffect(() => {
    loadLaboratories();
    loadEquipmentData();
    
    const borrowRequestsRef = ref(database, 'borrow_requests');
    
    const unsubscribe = onValue(borrowRequestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const requestsList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        setAllRequests(requestsList);
      } else {
        setAllRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter requests based on user role and assigned laboratories
  useEffect(() => {
    if (allRequests.length > 0) {
      let filteredRequests = allRequests;
      
      if (!isAdmin()) {
        const assignedLabIds = getAssignedLaboratoryIds();
        if (assignedLabIds && equipmentData.length > 0 && laboratories.length > 0) {
          console.log("Filtering requests for Lab Manager:", {
            totalRequests: allRequests.length,
            assignedLabIds: assignedLabIds,
            equipmentCount: equipmentData.length,
            laboratoriesCount: laboratories.length
          });
          
          // Filter requests to only show those from assigned laboratories
          filteredRequests = allRequests.filter(request => {
            // Find the equipment that matches this request
            const matchingEquipment = equipmentData.find(equipment => 
              equipment.equipmentName === request.itemName || 
              equipment.itemName === request.itemName ||
              equipment.name === request.itemName ||
              equipment.title === request.itemName
            );
            
            if (matchingEquipment && matchingEquipment.labId) {
              // Find the laboratory that matches this equipment's labId
              const laboratory = laboratories.find(lab => lab.labId === matchingEquipment.labId);
              
              if (laboratory) {
                // Check if this laboratory is assigned to the current user
                const isAssigned = assignedLabIds.includes(laboratory.id);
                console.log(`Request "${request.itemName}" from lab "${laboratory.labName}" (${laboratory.id}) - Assigned: ${isAssigned}`);
                return isAssigned;
              }
            }
            
            // If no matching equipment or laboratory found, don't show the request
            console.log(`Request "${request.itemName}" - No matching equipment/lab found`);
            return false;
          });
          
          console.log(`Filtered requests: ${filteredRequests.length} out of ${allRequests.length}`);
        } else {
          console.log("No assigned labs or missing data:", {
            assignedLabIds,
            equipmentCount: equipmentData.length,
            laboratoriesCount: laboratories.length
          });
          filteredRequests = []; // Show no requests if we can't determine lab assignment
        }
      }
      
      // Sort by creation date, newest first
      filteredRequests.sort((a, b) => new Date(b.requestedAt || b.dateToBeUsed) - new Date(a.requestedAt || a.dateToBeUsed));
      setRequests(filteredRequests);
    } else {
      setRequests([]);
    }
  }, [allRequests, equipmentData, laboratories, isAdmin, getAssignedLaboratoryIds]);

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

  const handleStatusUpdate = async (requestId, newStatus, returnDetails = null) => {
    try {
      const requestRef = ref(database, `borrow_requests/${requestId}`);
      const updateData = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        reviewedBy: "Admin" // You can get actual admin name from auth
      };

      // Add return details if provided
      if (returnDetails) {
        updateData.returnDetails = returnDetails;
        updateData.returnedAt = new Date().toISOString();
      }

      await update(requestRef, updateData);
      
      // Update local state for both allRequests and filtered requests
      setAllRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: newStatus, 
              updatedAt: new Date().toISOString(),
              ...(returnDetails && { returnDetails, returnedAt: new Date().toISOString() })
            }
          : request
      ));
      
      setRequests(prev => prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: newStatus, 
              updatedAt: new Date().toISOString(),
              ...(returnDetails && { returnDetails, returnedAt: new Date().toISOString() })
            }
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
      case 'returned': return 'status-returned';
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

  const openReturnModal = (request) => {
    setSelectedRequest(request);
    setReturnFormData({
      condition: "good",
      delayReason: "",
      notes: ""
    });
    setShowReturnModal(true);
  };

  const closeReturnModal = () => {
    setSelectedRequest(null);
    setShowReturnModal(false);
    setReturnFormData({
      condition: "good",
      delayReason: "",
      notes: ""
    });
  };

  const handleReturnSubmit = async () => {
    if (!selectedRequest) return;

    try {
      const returnDetails = {
        condition: returnFormData.condition,
        delayReason: returnFormData.delayReason,
        notes: returnFormData.notes,
        processedBy: "Admin" // You can get actual admin name from auth
      };

      await handleStatusUpdate(selectedRequest.id, "returned", returnDetails);
      closeReturnModal();
      closeDetailsModal();
      alert("Item marked as returned successfully!");
    } catch (error) {
      console.error("Error processing return:", error);
      alert("Failed to process return. Please try again.");
    }
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
                    Borrower Name {getSortIcon("adviserName")}
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
                    <td className="borrower-cell">
                      <div className="borrower-info">
                        <div className="borrower-avatar">
                          {request.adviserName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <span className="borrower-name">{request.adviserName || "Unknown"}</span>
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
                        {request.status === "in_progress" && (
                          <button
                            className="action-btn return-btn"
                            onClick={() => openReturnModal(request)}
                            title="Process Return"
                          >
                            📦
                          </button>
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
                      className="btn btn-primary"
                      onClick={() => openReturnModal(selectedRequest)}
                    >
                      📦 Process Return
                    </button>
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

      {/* Return Modal */}
      {showReturnModal && selectedRequest && (
        <div className="modal-overlay" onClick={closeReturnModal}>
          <div className="modal-content return-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Process Item Return</h2>
              <button className="modal-close" onClick={closeReturnModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="return-form">
                <div className="form-group">
                  <label>Item: {selectedRequest.itemName}</label>
                  <label>Borrower: {selectedRequest.adviserName}</label>
                </div>

                <div className="form-group">
                  <label htmlFor="condition">Item Condition:</label>
                  <select
                    id="condition"
                    value={returnFormData.condition}
                    onChange={(e) => setReturnFormData(prev => ({...prev, condition: e.target.value}))}
                    className="form-select"
                  >
                    <option value="good">Good Condition</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost/Missing</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="delayReason">Return Status:</label>
                  <select
                    id="delayReason"
                    value={returnFormData.delayReason}
                    onChange={(e) => setReturnFormData(prev => ({...prev, delayReason: e.target.value}))}
                    className="form-select"
                  >
                    <option value="">On Time</option>
                    <option value="late">Late Return</option>
                    <option value="early">Early Return</option>
                  </select>
                </div>

                {(returnFormData.delayReason === "late") && (
                  <div className="form-group">
                    <label htmlFor="delayNotes">Reason for Delay:</label>
                    <textarea
                      id="delayNotes"
                      value={returnFormData.notes}
                      onChange={(e) => setReturnFormData(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Please explain the reason for the delay..."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="returnNotes">Additional Notes:</label>
                  <textarea
                    id="returnNotes"
                    value={returnFormData.notes}
                    onChange={(e) => setReturnFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Any additional notes about the return..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeReturnModal}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleReturnSubmit}
              >
                ✅ Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}