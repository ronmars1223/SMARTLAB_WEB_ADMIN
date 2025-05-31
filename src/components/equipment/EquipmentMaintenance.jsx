// src/components/EquipmentMaintenance.jsx
import React, { useState, useEffect } from "react";
import { ref, push, onValue, remove, update } from "firebase/database";
import { database } from "../../firebase";

export default function EquipmentMaintenance({ categories, equipments, selectedCategory }) {
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [scheduledMaintenance, setScheduledMaintenance] = useState([]);
  const [showAddMaintenanceForm, setShowAddMaintenanceForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState("records");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [maintenanceFormData, setMaintenanceFormData] = useState({
    equipmentId: "",
    type: "Preventive",
    description: "",
    performedBy: "",
    datePerformed: "",
    timeSpent: "",
    cost: "",
    partsReplaced: "",
    notes: "",
    status: "Completed",
    nextMaintenanceDate: "",
    priority: "Medium"
  });

  const [scheduleFormData, setScheduleFormData] = useState({
    equipmentId: "",
    type: "Preventive",
    description: "",
    scheduledDate: "",
    assignedTo: "",
    priority: "Medium",
    estimatedTime: "",
    estimatedCost: "",
    notes: "",
    frequency: "Monthly",
    status: "Scheduled"
  });

  // Fetch maintenance records when category changes
  useEffect(() => {
    const fetchMaintenanceRecords = () => {
      if (!selectedCategory) return;
      
      try {
        const maintenanceRef = ref(database, `equipment_categories/${selectedCategory}/maintenance_records`);
        
        onValue(maintenanceRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const recordsList = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).sort((a, b) => new Date(b.datePerformed || b.createdAt) - new Date(a.datePerformed || a.createdAt));
            setMaintenanceRecords(recordsList);
          } else {
            setMaintenanceRecords([]);
          }
        });
      } catch (error) {
        console.error("Error fetching maintenance records:", error);
      }
    };

    const fetchScheduledMaintenance = () => {
      if (!selectedCategory) return;
      
      try {
        const scheduleRef = ref(database, `equipment_categories/${selectedCategory}/scheduled_maintenance`);
        
        onValue(scheduleRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const scheduleList = Object.keys(data).map(key => ({
              id: key,
              ...data[key]
            })).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
            setScheduledMaintenance(scheduleList);
          } else {
            setScheduledMaintenance([]);
          }
        });
      } catch (error) {
        console.error("Error fetching scheduled maintenance:", error);
      }
    };

    if (selectedCategory) {
      fetchMaintenanceRecords();
      fetchScheduledMaintenance();
    } else {
      setMaintenanceRecords([]);
      setScheduledMaintenance([]);
    }
  }, [selectedCategory]);

  const handleMaintenanceInputChange = (e) => {
    const { name, value } = e.target;
    setMaintenanceFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault();
    
    if (!maintenanceFormData.equipmentId || !maintenanceFormData.description.trim()) {
      alert("Please select equipment and enter description");
      return;
    }

    try {
      const maintenanceData = {
        ...maintenanceFormData,
        categoryId: selectedCategory
      };

      if (editingMaintenance) {
        const maintenanceRef = ref(database, `equipment_categories/${selectedCategory}/maintenance_records/${editingMaintenance.id}`);
        await update(maintenanceRef, {
          ...maintenanceData,
          updatedAt: new Date().toISOString()
        });
        alert("Maintenance record updated successfully!");
      } else {
        const maintenanceRef = ref(database, `equipment_categories/${selectedCategory}/maintenance_records`);
        await push(maintenanceRef, {
          ...maintenanceData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        // Update equipment's last maintenance date
        if (maintenanceFormData.datePerformed && maintenanceFormData.status === "Completed") {
          const equipmentRef = ref(database, `equipment_categories/${selectedCategory}/equipments/${maintenanceFormData.equipmentId}`);
          await update(equipmentRef, {
            lastMaintenanceDate: maintenanceFormData.datePerformed,
            nextMaintenanceDate: maintenanceFormData.nextMaintenanceDate || null
          });
        }
        
        alert("Maintenance record added successfully!");
      }
      
      resetMaintenanceForm();
    } catch (error) {
      console.error("Error saving maintenance record:", error);
      alert("Error saving maintenance record. Please try again.");
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    
    if (!scheduleFormData.equipmentId || !scheduleFormData.description.trim() || !scheduleFormData.scheduledDate) {
      alert("Please fill in required fields");
      return;
    }

    try {
      const scheduleData = {
        ...scheduleFormData,
        categoryId: selectedCategory
      };

      const scheduleRef = ref(database, `equipment_categories/${selectedCategory}/scheduled_maintenance`);
      await push(scheduleRef, {
        ...scheduleData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      alert("Maintenance scheduled successfully!");
      resetScheduleForm();
    } catch (error) {
      console.error("Error scheduling maintenance:", error);
      alert("Error scheduling maintenance. Please try again.");
    }
  };

  const handleEditMaintenance = (record) => {
    setEditingMaintenance(record);
    setMaintenanceFormData({
      equipmentId: record.equipmentId || "",
      type: record.type || "Preventive",
      description: record.description || "",
      performedBy: record.performedBy || "",
      datePerformed: record.datePerformed || "",
      timeSpent: record.timeSpent || "",
      cost: record.cost || "",
      partsReplaced: record.partsReplaced || "",
      notes: record.notes || "",
      status: record.status || "Completed",
      nextMaintenanceDate: record.nextMaintenanceDate || "",
      priority: record.priority || "Medium"
    });
    setShowAddMaintenanceForm(true);
  };

  const handleDeleteMaintenance = async (recordId) => {
    if (window.confirm("Are you sure you want to delete this maintenance record?")) {
      try {
        const maintenanceRef = ref(database, `equipment_categories/${selectedCategory}/maintenance_records/${recordId}`);
        await remove(maintenanceRef);
        alert("Maintenance record deleted successfully!");
      } catch (error) {
        console.error("Error deleting maintenance record:", error);
        alert("Error deleting maintenance record. Please try again.");
      }
    }
  };

  const handleDeleteScheduled = async (scheduleId) => {
    if (window.confirm("Are you sure you want to delete this scheduled maintenance?")) {
      try {
        const scheduleRef = ref(database, `equipment_categories/${selectedCategory}/scheduled_maintenance/${scheduleId}`);
        await remove(scheduleRef);
        alert("Scheduled maintenance deleted successfully!");
      } catch (error) {
        console.error("Error deleting scheduled maintenance:", error);
        alert("Error deleting scheduled maintenance. Please try again.");
      }
    }
  };

  const completeScheduledMaintenance = (scheduledItem) => {
    setMaintenanceFormData({
      equipmentId: scheduledItem.equipmentId,
      type: scheduledItem.type,
      description: scheduledItem.description,
      performedBy: "",
      datePerformed: new Date().toISOString().split('T')[0],
      timeSpent: scheduledItem.estimatedTime || "",
      cost: scheduledItem.estimatedCost || "",
      partsReplaced: "",
      notes: `Completed from scheduled maintenance: ${scheduledItem.notes || ''}`,
      status: "Completed",
      nextMaintenanceDate: "",
      priority: scheduledItem.priority
    });
    setShowAddMaintenanceForm(true);
  };

  const resetMaintenanceForm = () => {
    setMaintenanceFormData({
      equipmentId: "",
      type: "Preventive",
      description: "",
      performedBy: "",
      datePerformed: "",
      timeSpent: "",
      cost: "",
      partsReplaced: "",
      notes: "",
      status: "Completed",
      nextMaintenanceDate: "",
      priority: "Medium"
    });
    setShowAddMaintenanceForm(false);
    setEditingMaintenance(null);
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      equipmentId: "",
      type: "Preventive",
      description: "",
      scheduledDate: "",
      assignedTo: "",
      priority: "Medium",
      estimatedTime: "",
      estimatedCost: "",
      notes: "",
      frequency: "Monthly",
      status: "Scheduled"
    });
    setShowScheduleForm(false);
  };

  const getEquipmentName = (equipmentId) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment ? `${equipment.name} (${equipment.serialNumber})` : "Unknown Equipment";
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "#ef4444";
      case "Medium": return "#f59e0b";
      case "Low": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getMaintenanceTypeColor = (type) => {
    switch (type) {
      case "Preventive": return "#10b981";
      case "Corrective": return "#f59e0b";
      case "Emergency": return "#ef4444";
      case "Calibration": return "#8b5cf6";
      default: return "#6b7280";
    }
  };

  const isMaintenanceOverdue = (scheduledDate) => {
    return new Date(scheduledDate) < new Date();
  };

  // Filter maintenance records
  const filteredMaintenanceRecords = maintenanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      getEquipmentName(record.equipmentId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.performedBy?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesPriority = filterPriority === "all" || record.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter scheduled maintenance
  const filteredScheduledMaintenance = scheduledMaintenance.filter(schedule => {
    const matchesSearch = !searchTerm || 
      getEquipmentName(schedule.equipmentId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.assignedTo?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPriority = filterPriority === "all" || schedule.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  const upcomingMaintenance = filteredScheduledMaintenance.filter(item => 
    new Date(item.scheduledDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  if (!selectedCategory) {
    return (
      <div className="tab-content">
        <div className="empty-state">
          <div className="empty-icon">🔧</div>
          <h3 className="empty-title">Select a Category</h3>
          <p className="empty-message">Choose a category to view and manage equipment maintenance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="section-header">
        <h2 className="section-title">Equipment Maintenance</h2>
        <div className="section-header-right">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="btn btn-outline"
          >
            <span className="btn-icon">📅</span>
            Schedule Maintenance
          </button>
          <button
            onClick={() => setShowAddMaintenanceForm(true)}
            className="btn btn-primary"
          >
            <span className="btn-icon">+</span>
            Add Maintenance Record
          </button>
        </div>
      </div>

      {/* Maintenance Sub-tabs */}
      <div className="nav-tabs">
        <button
          onClick={() => setActiveSubTab("records")}
          className={`nav-tab ${activeSubTab === "records" ? "active" : ""}`}
        >
          <span className="nav-tab-icon">📋</span>
          Maintenance Records ({maintenanceRecords.length})
        </button>
        <button
          onClick={() => setActiveSubTab("scheduled")}
          className={`nav-tab ${activeSubTab === "scheduled" ? "active" : ""}`}
        >
          <span className="nav-tab-icon">📅</span>
          Scheduled Maintenance ({scheduledMaintenance.length})
        </button>
        <button
          onClick={() => setActiveSubTab("upcoming")}
          className={`nav-tab ${activeSubTab === "upcoming" ? "active" : ""}`}
        >
          <span className="nav-tab-icon">⚠️</span>
          Upcoming ({upcomingMaintenance.length})
        </button>
      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search maintenance records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '300px',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem'
            }}
          />
          <span style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }}>🔍</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeSubTab === "records" && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="all">All Status</option>
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
            </select>
          )}
          
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
          >
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Maintenance Records Tab */}
      {activeSubTab === "records" && (
        <div>
          {filteredMaintenanceRecords.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔧</div>
              <h3 className="empty-title">No maintenance records found</h3>
              <p className="empty-message">
                {searchTerm ? "Try adjusting your search or filters." : "Start by adding your first maintenance record."}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredMaintenanceRecords.map((record) => (
                <div key={record.id} style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                        {getEquipmentName(record.equipmentId)}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0' }}>{record.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: getMaintenanceTypeColor(record.type) + "20",
                        color: getMaintenanceTypeColor(record.type)
                      }}>
                        {record.type}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: getPriorityColor(record.priority) + "20",
                        color: getPriorityColor(record.priority)
                      }}>
                        {record.priority}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Performed By:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{record.performedBy || "—"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Date:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{record.datePerformed || "—"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Time Spent:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{record.timeSpent || "—"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Cost:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{record.cost ? `$${record.cost}` : "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => handleEditMaintenance(record)}
                      className="btn btn-outline btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMaintenance(record.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Maintenance Tab */}
      {(activeSubTab === "scheduled" || activeSubTab === "upcoming") && (
        <div>
          {(activeSubTab === "scheduled" ? filteredScheduledMaintenance : upcomingMaintenance).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3 className="empty-title">
                {activeSubTab === "upcoming" ? "No upcoming maintenance" : "No scheduled maintenance"}
              </h3>
              <p className="empty-message">
                {activeSubTab === "upcoming" 
                  ? "All maintenance is up to date for the next 7 days."
                  : "Schedule maintenance to keep your equipment in optimal condition."
                }
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(activeSubTab === "scheduled" ? filteredScheduledMaintenance : upcomingMaintenance).map((schedule) => (
                <div 
                  key={schedule.id} 
                  style={{
                    background: 'white',
                    border: isMaintenanceOverdue(schedule.scheduledDate) ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderLeft: isMaintenanceOverdue(schedule.scheduledDate) ? '4px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', margin: '0 0 0.25rem 0' }}>
                        {getEquipmentName(schedule.equipmentId)}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0' }}>{schedule.description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: getMaintenanceTypeColor(schedule.type) + "20",
                        color: getMaintenanceTypeColor(schedule.type)
                      }}>
                        {schedule.type}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: getPriorityColor(schedule.priority) + "20",
                        color: getPriorityColor(schedule.priority)
                      }}>
                        {schedule.priority}
                      </span>
                      {isMaintenanceOverdue(schedule.scheduledDate) && (
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626'
                        }}>
                          OVERDUE
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Scheduled Date:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{schedule.scheduledDate}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Assigned To:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{schedule.assignedTo || "—"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Est. Time:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{schedule.estimatedTime || "—"}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Est. Cost:</span>
                      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>{schedule.estimatedCost ? `$${schedule.estimatedCost}` : "—"}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => completeScheduledMaintenance(schedule)}
                      className="btn btn-success btn-sm"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleDeleteScheduled(schedule.id)}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Maintenance Modal */}
      {showAddMaintenanceForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingMaintenance ? "Edit Maintenance Record" : "Add Maintenance Record"}
              </h2>
              <button onClick={resetMaintenanceForm} className="modal-close">×</button>
            </div>

            <form onSubmit={handleMaintenanceSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label required">Equipment</label>
                  <select
                    name="equipmentId"
                    value={maintenanceFormData.equipmentId}
                    onChange={handleMaintenanceInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Equipment</option>
                    {equipments.map((equipment) => (
                      <option key={equipment.id} value={equipment.id}>
                        {equipment.name} ({equipment.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Maintenance Type</label>
                  <select
                    name="type"
                    value={maintenanceFormData.type}
                    onChange={handleMaintenanceInputChange}
                    className="form-select"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Corrective">Corrective</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Calibration">Calibration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label required">Description</label>
                <textarea
                  name="description"
                  value={maintenanceFormData.description}
                  onChange={handleMaintenanceInputChange}
                  placeholder="Describe the maintenance work performed"
                  required
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Performed By</label>
                  <input
                    type="text"
                    name="performedBy"
                    value={maintenanceFormData.performedBy}
                    onChange={handleMaintenanceInputChange}
                    placeholder="Technician name"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Date Performed</label>
                  <input
                    type="date"
                    name="datePerformed"
                    value={maintenanceFormData.datePerformed}
                    onChange={handleMaintenanceInputChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Time Spent</label>
                  <input
                    type="text"
                    name="timeSpent"
                    value={maintenanceFormData.timeSpent}
                    onChange={handleMaintenanceInputChange}
                    placeholder="e.g., 2 hours"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Cost</label>
                  <input
                    type="number"
                    name="cost"
                    value={maintenanceFormData.cost}
                    onChange={handleMaintenanceInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    name="status"
                    value={maintenanceFormData.status}
                    onChange={handleMaintenanceInputChange}
                    className="form-select"
                  >
                    <option value="Completed">Completed</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    name="priority"
                    value={maintenanceFormData.priority}
                    onChange={handleMaintenanceInputChange}
                    className="form-select"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={maintenanceFormData.notes}
                  onChange={handleMaintenanceInputChange}
                  placeholder="Additional notes"
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetMaintenanceForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMaintenance ? "Update Record" : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {showScheduleForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Schedule Maintenance</h2>
              <button onClick={resetScheduleForm} className="modal-close">×</button>
            </div>

            <form onSubmit={handleScheduleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label required">Equipment</label>
                  <select
                    name="equipmentId"
                    value={scheduleFormData.equipmentId}
                    onChange={handleScheduleInputChange}
                    required
                    className="form-select"
                  >
                    <option value="">Select Equipment</option>
                    {equipments.map((equipment) => (
                      <option key={equipment.id} value={equipment.id}>
                        {equipment.name} ({equipment.serialNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Maintenance Type</label>
                  <select
                    name="type"
                    value={scheduleFormData.type}
                    onChange={handleScheduleInputChange}
                    className="form-select"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Corrective">Corrective</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Calibration">Calibration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label required">Description</label>
                <textarea
                  name="description"
                  value={scheduleFormData.description}
                  onChange={handleScheduleInputChange}
                  placeholder="Describe the maintenance work to be performed"
                  required
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label required">Scheduled Date</label>
                  <input
                    type="date"
                    name="scheduledDate"
                    value={scheduleFormData.scheduledDate}
                    onChange={handleScheduleInputChange}
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={scheduleFormData.assignedTo}
                    onChange={handleScheduleInputChange}
                    placeholder="Technician name"
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    name="priority"
                    value={scheduleFormData.priority}
                    onChange={handleScheduleInputChange}
                    className="form-select"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Frequency</label>
                  <select
                    name="frequency"
                    value={scheduleFormData.frequency}
                    onChange={handleScheduleInputChange}
                    className="form-select"
                  >
                    <option value="One-time">One-time</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-annually">Semi-annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Estimated Time</label>
                  <input
                    type="text"
                    name="estimatedTime"
                    value={scheduleFormData.estimatedTime}
                    onChange={handleScheduleInputChange}
                    placeholder="e.g., 2 hours"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Estimated Cost</label>
                  <input
                    type="number"
                    name="estimatedCost"
                    value={scheduleFormData.estimatedCost}
                    onChange={handleScheduleInputChange}
                    placeholder="0.00"
                    step="0.01"
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  value={scheduleFormData.notes}
                  onChange={handleScheduleInputChange}
                  placeholder="Additional notes or instructions"
                  rows="3"
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={resetScheduleForm} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Maintenance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}