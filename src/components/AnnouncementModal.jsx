// src/components/AnnouncementModal.js
import React, { useState, useEffect } from "react";
import "../CSS/AnnouncementModal.css";

export default function AnnouncementModal({ announcement, onSave, onClose }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    author: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        category: announcement.category || "",
        author: announcement.author || ""
      });
    }
  }, [announcement]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.content.trim()) {
      newErrors.content = "Content is required";
    }

    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>{announcement ? "Edit Announcement" : "Add New Announcement"}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Title <span className="required">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input ${errors.title ? 'error' : ''}`}
                placeholder="Enter announcement title"
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Author <span className="required">*</span>
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className={`form-input ${errors.author ? 'error' : ''}`}
                placeholder="Your name"
              />
              {errors.author && <span className="error-message">{errors.author}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Select category</option>
                <option value="General">General</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Security">Security</option>
                <option value="System Update">System Update</option>
                <option value="Policy">Policy</option>
                <option value="Event">Event</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Content <span className="required">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              className={`form-textarea ${errors.content ? 'error' : ''}`}
              placeholder="Enter your announcement content here..."
              rows="6"
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {announcement ? "Update Announcement" : "Create Announcement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}