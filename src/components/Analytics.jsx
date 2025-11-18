// src/components/Analytics.jsx
import React, { useState, useEffect } from "react";
import { ref } from "firebase/database";
import { database } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import "../CSS/Analytics.css";

export default function Analytics() {
  const { isAdmin, getAssignedLaboratoryIds } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    equipmentStats: {},
    borrowingTrends: [],
    userActivity: {},
    maintenanceStats: {},
    categoryBreakdown: [],
    monthlyData: {},
    peakHours: {},
    utilizationRates: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30"); // days
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadAllEquipment = async (categories) => {
    const { get } = await import('firebase/database');
    const allEquipment = [];
    
    try {
      console.log("Categories loaded:", Object.keys(categories).length);
      
      // Load laboratories for filtering
      const laboratoriesRef = ref(database, 'laboratories');
      const labsSnapshot = await get(laboratoriesRef);
      let laboratories = [];
      if (labsSnapshot.exists()) {
        const labsData = labsSnapshot.val();
        laboratories = Object.keys(labsData).map(key => ({
          id: key,
          ...labsData[key]
        }));
      }
      
      // Load equipment from each category
      const equipmentPromises = Object.keys(categories).map(async (categoryId) => {
        const equipmentsRef = ref(database, `equipment_categories/${categoryId}/equipments`);
        const snapshot = await get(equipmentsRef);
        const equipmentData = snapshot.val();
        
        console.log(`Category ${categoryId} equipment data:`, equipmentData);
        
        if (equipmentData) {
          const categoryEquipment = Object.keys(equipmentData).map(equipmentId => ({
            id: equipmentId,
            categoryId: categoryId,
            categoryName: categories[categoryId].title,
            ...equipmentData[equipmentId]
          }));
          
          // Filter equipment based on user role and assigned laboratories
          let filteredEquipment = categoryEquipment;
          if (!isAdmin()) {
            const assignedLabIds = getAssignedLaboratoryIds();
            if (assignedLabIds) {
              filteredEquipment = categoryEquipment.filter(equipment => {
                const lab = laboratories.find(l => l.labId === equipment.labId);
                return lab && assignedLabIds.includes(lab.id);
              });
            }
          }
          
          console.log(`Category ${categoryId} processed equipment:`, filteredEquipment.length);
          return filteredEquipment;
        }
        return [];
      });
      
      const equipmentArrays = await Promise.all(equipmentPromises);
      allEquipment.push(...equipmentArrays.flat());
      
      console.log("Total equipment loaded:", allEquipment.length);
      console.log("Equipment details:", allEquipment);
      
    } catch (error) {
      console.error("Error loading equipment:", error);
    }
    
    return allEquipment;
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const { get } = await import('firebase/database');
      
      // Load all necessary data
      const [borrowRequestsSnapshot, historySnapshot, categoriesSnapshot] = await Promise.all([
        get(ref(database, 'borrow_requests')),
        get(ref(database, 'history')),
        get(ref(database, 'equipment_categories'))
      ]);

      const borrowRequests = borrowRequestsSnapshot.val() || {};
      const history = historySnapshot.val() || {};
      const categories = categoriesSnapshot.val() || {};
      
      console.log("Raw categories data:", categories);
      console.log("Categories keys:", Object.keys(categories));
      
      // Load equipment data from all categories
      const equipment = await loadAllEquipment(categories);

      // Process analytics data
      const processedData = processAnalyticsData(borrowRequests, equipment, history, categories, selectedPeriod);
      console.log("Processed analytics data:", processedData);
      setAnalyticsData(processedData);
      
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (borrowRequests, equipment, history, categories, period) => {
    const periodDays = parseInt(period);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    // Equipment Statistics
    console.log("Processing equipment stats for:", equipment.length, "equipment items");
    console.log("Equipment status breakdown:", {
      available: equipment.filter(eq => eq.status === 'Available' || eq.status === 'available').length,
      inUse: equipment.filter(eq => eq.status === 'In Use' || eq.status === 'in_use' || eq.status === 'in use').length,
      maintenance: equipment.filter(eq => eq.status === 'Maintenance' || eq.status === 'maintenance').length,
      retired: equipment.filter(eq => eq.status === 'Retired' || eq.status === 'retired').length,
      other: equipment.filter(eq => !['Available', 'available', 'In Use', 'in_use', 'in use', 'Maintenance', 'maintenance', 'Retired', 'retired'].includes(eq.status)).length
    });
    
    const equipmentStats = {
      total: equipment.length,
      available: equipment.filter(eq => eq.status === 'Available' || eq.status === 'available').length,
      inUse: equipment.filter(eq => eq.status === 'In Use' || eq.status === 'in_use' || eq.status === 'in use').length,
      maintenance: equipment.filter(eq => eq.status === 'Maintenance' || eq.status === 'maintenance').length,
      utilizationRate: 0
    };

    if (equipmentStats.total > 0) {
      equipmentStats.utilizationRate = Math.round((equipmentStats.inUse / equipmentStats.total) * 100);
    }

    // Borrowing Trends
    const borrowingTrends = calculateBorrowingTrends(borrowRequests, periodDays);

    // User Activity
    const userActivity = calculateUserActivity(borrowRequests, periodDays);

    // Maintenance Statistics
    const maintenanceStats = calculateMaintenanceStats(equipment, history, periodDays);

    // Category Breakdown
    const categoryBreakdown = calculateCategoryBreakdown(categories, borrowRequests);

    // Monthly Data
    const monthlyData = calculateMonthlyData(borrowRequests, periodDays);

    // Peak Hours Analysis
    const peakHours = calculatePeakHours(history, periodDays);

    // Utilization Rates
    const utilizationRates = calculateUtilizationRates(equipment, history, periodDays);

    return {
      equipmentStats,
      borrowingTrends,
      userActivity,
      maintenanceStats,
      categoryBreakdown,
      monthlyData,
      peakHours,
      utilizationRates
    };
  };

  const calculateBorrowingTrends = (borrowRequests, periodDays) => {
    const trends = [];
    const requests = Object.values(borrowRequests);
    
    // Group by date
    const dailyData = {};
    requests.forEach(req => {
      if (req.requestedAt) {
        const date = new Date(req.requestedAt).toDateString();
        dailyData[date] = (dailyData[date] || 0) + 1;
      }
    });

    // Create trend data for the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      trends.push({
        date: date.toISOString().split('T')[0],
        requests: dailyData[dateStr] || 0
      });
    }

    return trends;
  };

  const calculateUserActivity = (borrowRequests, periodDays) => {
    const requests = Object.values(borrowRequests);
    const userCounts = {};
    
    requests.forEach(req => {
      if (req.requestedAt && new Date(req.requestedAt) >= new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)) {
        const user = req.adviserName || req.userEmail || 'Unknown';
        userCounts[user] = (userCounts[user] || 0) + 1;
      }
    });

    const sortedUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      totalActiveUsers: Object.keys(userCounts).length,
      topUsers: sortedUsers.map(([user, count]) => ({ user, count }))
    };
  };

  const calculateMaintenanceStats = (equipment, history, periodDays) => {
    const historyValues = Object.values(history);
    
    const maintenanceCount = equipment.filter(eq => eq.status === 'Maintenance' || eq.status === 'maintenance').length;
    const totalMaintenance = historyValues.filter(h => h.action && h.action.toLowerCase().includes('maintenance')).length;
    
    return {
      currentMaintenance: maintenanceCount,
      totalMaintenanceEvents: totalMaintenance,
      maintenanceRate: equipment.length > 0 ? Math.round((maintenanceCount / equipment.length) * 100) : 0
    };
  };

  const calculateCategoryBreakdown = (categories, borrowRequests) => {
    const requests = Object.values(borrowRequests);
    const categoryData = {};
    
    // Count requests by category
    requests.forEach(req => {
      const category = req.categoryName || 'Other';
      categoryData[category] = (categoryData[category] || 0) + 1;
    });

    // Get category details
    return Object.entries(categoryData).map(([name, count]) => ({
      name,
      count,
      color: getCategoryColor(name)
    })).sort((a, b) => b.count - a.count);
  };

  const calculateMonthlyData = (borrowRequests, periodDays) => {
    const requests = Object.values(borrowRequests);
    const monthlyData = {};
    
    requests.forEach(req => {
      if (req.requestedAt) {
        const date = new Date(req.requestedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      }
    });

    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      count
    })).sort((a, b) => a.month.localeCompare(b.month));
  };

  const calculatePeakHours = (history, periodDays) => {
    const historyValues = Object.values(history);
    const hourlyData = {};
    
    historyValues.forEach(h => {
      if (h.timestamp) {
        const hour = new Date(h.timestamp).getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      }
    });

    return Object.entries(hourlyData)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
  };

  const calculateUtilizationRates = (equipment, history, periodDays) => {
    const totalEquipment = equipment.length;
    const inUseEquipment = equipment.filter(eq => eq.status === 'In Use' || eq.status === 'in_use' || eq.status === 'in use').length;
    
    return {
      overall: totalEquipment > 0 ? Math.round((inUseEquipment / totalEquipment) * 100) : 0,
      byCategory: {}
    };
  };

  const getCategoryColor = (categoryName) => {
    const colors = [
      '#2aa59d', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatHour = (hour) => {
    return `${hour}:00`;
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-title">
          <h1>Analytics Dashboard</h1>
          <p>Comprehensive insights into your laboratory operations</p>
        </div>
        
        <div className="analytics-controls">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Analytics Navigation */}
      <div className="analytics-nav">
        <button 
          className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === "equipment" ? "active" : ""}`}
          onClick={() => setActiveTab("equipment")}
        >
          Equipment
        </button>
        <button 
          className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button 
          className={`nav-tab ${activeTab === "trends" ? "active" : ""}`}
          onClick={() => setActiveTab("trends")}
        >
          Trends
        </button>
      </div>

      {/* Analytics Content */}
      <div className="analytics-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            {/* Key Metrics */}
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                  <div className="metric-value">{analyticsData.equipmentStats.total}</div>
                  <div className="metric-label">Total Equipment</div>
                </div>
              </div>
              
              <div className="metric-card success">
                <div className="metric-icon">✅</div>
                <div className="metric-content">
                  <div className="metric-value">{analyticsData.equipmentStats.utilizationRate}%</div>
                  <div className="metric-label">Utilization Rate</div>
                </div>
              </div>
              
              <div className="metric-card warning">
                <div className="metric-icon">🔧</div>
                <div className="metric-content">
                  <div className="metric-value">{analyticsData.maintenanceStats.currentMaintenance}</div>
                  <div className="metric-label">Under Maintenance</div>
                </div>
              </div>
              
              <div className="metric-card info">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <div className="metric-value">{analyticsData.userActivity.totalActiveUsers}</div>
                  <div className="metric-label">Active Users</div>
                </div>
              </div>
            </div>

            {/* Equipment Status Chart */}
            <div className="chart-section">
              <div className="chart-card">
                <h3>Equipment Status Distribution</h3>
                <div className="pie-chart">
                  <div className="pie-slice available" style={{
                    '--percentage': analyticsData.equipmentStats.total > 0 ? (analyticsData.equipmentStats.available / analyticsData.equipmentStats.total) * 100 : 0
                  }}>
                    <span>Available ({analyticsData.equipmentStats.available})</span>
                  </div>
                  <div className="pie-slice in-use" style={{
                    '--percentage': analyticsData.equipmentStats.total > 0 ? (analyticsData.equipmentStats.inUse / analyticsData.equipmentStats.total) * 100 : 0
                  }}>
                    <span>In Use ({analyticsData.equipmentStats.inUse})</span>
                  </div>
                  <div className="pie-slice maintenance" style={{
                    '--percentage': analyticsData.equipmentStats.total > 0 ? (analyticsData.equipmentStats.maintenance / analyticsData.equipmentStats.total) * 100 : 0
                  }}>
                    <span>Maintenance ({analyticsData.equipmentStats.maintenance})</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="chart-card">
                <h3>Most Borrowed Categories</h3>
                <div className="category-chart">
                  {analyticsData.categoryBreakdown.slice(0, 5).map((category, index) => (
                    <div key={category.name} className="category-bar">
                      <div className="category-label">{category.name}</div>
                      <div className="category-bar-container">
                        <div 
                          className="category-bar-fill"
                          style={{
                            width: `${(category.count / Math.max(...analyticsData.categoryBreakdown.map(c => c.count))) * 100}%`,
                            backgroundColor: category.color
                          }}
                        ></div>
                        <span className="category-count">{category.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "equipment" && (
          <div className="equipment-tab">
            <div className="equipment-analytics">
              <div className="chart-card full-width">
                <h3>Equipment Utilization Trends</h3>
                <div className="line-chart">
                  <div className="line-chart-container">
                    {analyticsData.borrowingTrends.map((point, index) => (
                      <div key={point.date} className="chart-point">
                        <div 
                          className="point"
                          style={{
                            height: `${(point.requests / Math.max(...analyticsData.borrowingTrends.map(p => p.requests))) * 100}%`
                          }}
                        ></div>
                        <span className="point-label">{formatDate(point.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="users-tab">
            <div className="chart-card">
              <h3>Top Active Users</h3>
              <div className="user-list">
                {analyticsData.userActivity.topUsers.map((user, index) => (
                  <div key={user.user} className="user-item">
                    <div className="user-rank">#{index + 1}</div>
                    <div className="user-info">
                      <div className="user-name">{user.user}</div>
                      <div className="user-activity">{user.count} requests</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-card">
              <h3>Peak Activity Hours</h3>
              <div className="hourly-chart">
                {analyticsData.peakHours.map(hour => (
                  <div key={hour.hour} className="hour-bar">
                    <div className="hour-label">{formatHour(hour.hour)}</div>
                    <div className="hour-bar-container">
                      <div 
                        className="hour-bar-fill"
                        style={{
                          height: `${(hour.count / Math.max(...analyticsData.peakHours.map(h => h.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <div className="hour-count">{hour.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="trends-tab">
            <div className="chart-card full-width">
              <h3>Monthly Borrowing Trends</h3>
              <div className="monthly-chart">
                <div className="monthly-chart-container">
                  {analyticsData.monthlyData.map(month => (
                    <div key={month.month} className="month-bar">
                      <div className="month-label">{month.month}</div>
                      <div 
                        className="month-bar-fill"
                        style={{
                          height: `${(month.count / Math.max(...analyticsData.monthlyData.map(m => m.count))) * 100}%`
                        }}
                      ></div>
                      <div className="month-count">{month.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
