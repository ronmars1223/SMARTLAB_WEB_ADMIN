// src/components/UserManagement.js
import React, { useState, useEffect } from "react";
import { 
  ref, 
  get, 
  update
} from "firebase/database";
import { database } from "../firebase";
import "../CSS/UserManagement.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "teacher",
    profile_setup: true
  });

  const roles = ["teacher", "student"];
  const statuses = ["Active", "Inactive", "Pending"];

  // Fetch users from Firebase Realtime Database
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const fetchedUsers = [];
        
        // Convert the object to array with IDs
        Object.keys(usersData).forEach((userId) => {
          const userData = usersData[userId];
          fetchedUsers.push({
            id: userId,
            name: userData.name || "Unknown",
            email: userData.email || "No email",
            role: userData.role || "student",
            status: userData.profile_setup ? "Active" : "Pending",
            createdAt: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : "Unknown",
            profile_setup: userData.profile_setup || false,
            ...userData
          });
        });
        
        // Sort by creation date (newest first)
        fetchedUsers.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        });
        
        setUsers(fetchedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      alert("Error fetching users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and sort users
  const filteredUsers = users
    .filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === "All" || user.role === filterRole;
      const matchesStatus = filterStatus === "All" || user.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "createdAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Update existing user only
      const userRef = ref(database, `users/${editingUser.id}`);
      await update(userRef, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        profile_setup: formData.profile_setup,
        updatedAt: Date.now()
      });
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              name: formData.name,
              email: formData.email,
              role: formData.role,
              profile_setup: formData.profile_setup,
              status: formData.profile_setup ? "Active" : "Pending"
            }
          : user
      ));
      
      closeModal();
      alert("User updated successfully!");
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      profile_setup: user.profile_setup
    });
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: "",
      email: "",
      role: "teacher",
      profile_setup: true
    });
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


  return (
    <div className="user-management">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading users...</div>
        </div>
      )}
      
      <div className="user-management-header">
        <div className="header-left">
          <h1>User Management</h1>
          <p>Manage user accounts, roles, and permissions ({users.length} users)</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="user-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
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
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")} className="sortable">
                Name {getSortIcon("name")}
              </th>
              <th onClick={() => handleSort("email")} className="sortable">
                Email {getSortIcon("email")}
              </th>
              <th onClick={() => handleSort("role")} className="sortable">
                Role {getSortIcon("role")}
              </th>
              <th onClick={() => handleSort("status")} className="sortable">
                Status {getSortIcon("status")}
              </th>
              <th onClick={() => handleSort("createdAt")} className="sortable">
                Date Joined {getSortIcon("createdAt")}
              </th>
              <th>Profile Setup</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="user-name">
                  <div className="user-avatar">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {user.name}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role.toLowerCase()}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${user.status === 'Active' ? 'success' : user.status === 'Pending' ? 'warning' : 'danger'}`}>
                    {user.status}
                  </span>
                </td>
                <td>{user.createdAt}</td>
                <td>
                  <span className={`profile-badge ${user.profile_setup ? 'setup-complete' : 'setup-pending'}`}>
                    {user.profile_setup ? '✅ Complete' : '⏳ Pending'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(user)}
                      title="Edit User"
                    >
                      ✏️ Edit
                    </button>      
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Modal for Edit User */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit User</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter full name"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Profile Setup Status</label>
                  <select
                    name="profile_setup"
                    value={formData.profile_setup}
                    onChange={(e) => setFormData(prev => ({...prev, profile_setup: e.target.value === 'true'}))}
                    className="form-select"
                  >
                    <option value={true}>Complete</option>
                    <option value={false}>Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}