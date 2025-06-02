// src/components/HistoryPage.jsx
import { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";
import "../CSS/HistoryPage.css";

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("Status");
  const [dateRange, setDateRange] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const statuses = ["Released", "Returned", "Pending", "Approved", "Rejected", "In Progress", "Completed", "Cancelled"];

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
            action: "Item Released",
            equipmentName: request.itemName,
            borrower: request.adviserName,
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
            historyList.push({
              id: `${key}_updated`,
              action: request.status === "completed" ? "Item Returned" : "Status Updated",
              equipmentName: request.itemName,
              borrower: request.adviserName,
              status: request.status === "completed" ? "Returned" : request.status,
              releasedDate: request.requestedAt,
              returnDate: request.status === "completed" ? request.updatedAt : request.dateToReturn,
              condition: request.status === "completed" ? "Cleaned and recalibrated" : "Good condition",
              timestamp: request.updatedAt,
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
  const filteredHistory = historyData.filter(entry => {
    const matchesSearch = entry.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.borrower?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  };

  const closeDetailsModal = () => {
    setSelectedEntry(null);
    setShowDetailsModal(false);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
                    <th>Borrower</th>
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
                      <td className="table-cell">{entry.borrower}</td>
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

      {/* Details Modal */}
      {showDetailsModal && selectedEntry && (
        <div className="modal-overlay" onClick={closeDetailsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Activity Details</h2>
              <button onClick={closeDetailsModal} className="modal-close">×</button>
            </div>
            
            <div className="modal-body">
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
                  <div className="detail-label">Borrower:</div>
                  <div className="detail-value">{selectedEntry.borrower}</div>
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
                  <div className="detail-label">Date:</div>
                  <div className="detail-value">
                    {formatDate(selectedEntry.timestamp)} at {formatTime(selectedEntry.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}