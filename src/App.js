// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

// Timebomb Component
const SystemExpired = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '60px 40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '20px'
        }}>⏰</div>
        
        <h1 style={{
          color: '#dc2626',
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '16px'
        }}>
          System License Expired
        </h1>
        
        <p style={{
          color: '#6b7280',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          marginBottom: '30px'
        }}>
          This SmartLab system has reached its license expiration date. 
          Please contact your system administrator to renew your license.
        </p>
        
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px'
        }}>
          <p style={{
            color: '#991b1b',
            fontSize: '0.9rem',
            margin: '0',
            fontWeight: '500'
          }}>
            System expired on: June 10, 2025
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          fontSize: '0.9rem',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0' }}>
            📧 Contact: admin@smartlab.com
          </p>
          <p style={{ margin: '0' }}>
            📞 Support: +1 (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isSystemExpired, setIsSystemExpired] = useState(false);

  useEffect(() => {
    // Check if system has expired
    const checkSystemExpiry = () => {
      const currentDate = new Date();
      const expirationDate = new Date('2025-06-10T23:59:59'); // June 10, 2025
      
      if (currentDate > expirationDate) {
        setIsSystemExpired(true);
        
        // Additional security: Clear any stored data
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (error) {
          console.log('Storage clear failed:', error);
        }
      }
    };

    // Check immediately
    checkSystemExpiry();
    
    // Check every hour to ensure system stays locked
    const intervalId = setInterval(checkSystemExpiry, 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // If system is expired, show expiration screen
  if (isSystemExpired) {
    return <SystemExpired />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <div className="dashboard-container">
              <Dashboard />
            </div>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;