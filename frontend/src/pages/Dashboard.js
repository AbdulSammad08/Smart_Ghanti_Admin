import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API_BASE_URL from '../utils/apiConfig';

import { NotificationService } from '../utils/NotificationService';
const Dashboard = () => {
  const [cloudStatus, setCloudStatus] = useState({ cloudStatus: 'checking', message: 'Checking MongoDB Connection...' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    pendingRequests: 0
  });
  const [activities, setActivities] = useState([]);

  // Check MongoDB Database connectivity
  const checkCloudStatus = async () => {
        try {
      const response = await fetch(`${API_BASE_URL}/api/admin/system/status`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCloudStatus(data);
              // Show notification for successful database connection
              if (data.cloudStatus === 'connected') {
                NotificationService.success('✅ Database Connected', 'MongoDB connection established');
              }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.message || 'MongoDB Connection Disrupted';
        setCloudStatus({ 
          cloudStatus: 'disconnected', 
          message: message
        });
        NotificationService.error('⚠️ Database Disconnected', message);
      }
    } catch (error) {
      setCloudStatus({ 
        cloudStatus: 'disconnected', 
        message: 'Not Connected to MongoDB' 
      });
      NotificationService.warning('⚠️ Connection Error', 'Failed to connect to MongoDB');
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
              // Show notification for dashboard stats update
              NotificationService.info('📊 Dashboard Updated', 'Statistics refreshed successfully');
            } else {
              NotificationService.error('Failed to Load Stats', 'Could not fetch dashboard statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      NotificationService.error('Error', 'Failed to fetch dashboard statistics');
    }
  };

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📬 Activities received:', data);
        setActivities(data);
              // Show notification for new activities
              if (data.length > 0) {
                NotificationService.info('📬 New Activities', `${data.length} recent activities loaded`);
              } else {
                console.warn('⚠️ No activities found');
              }
            } else {
              console.error('Failed response:', response.status);
              NotificationService.error('Failed to Load Activities', 'Could not fetch recent activities');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      NotificationService.error('Error', 'Failed to fetch activities');
    }
  };

  // Monitor cloud connectivity and fetch data
  useEffect(() => {
    // Initial checks
    checkCloudStatus();
    fetchStats();
    fetchActivities();

    // Periodic status check every 15 seconds
    const interval = setInterval(() => {
      checkCloudStatus();
      fetchStats();
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getStatusDisplay = () => {
    if (cloudStatus.cloudStatus === 'checking') {
      return { 
        value: 'Checking MongoDB...', 
        status: 'checking',
        icon: 'fas fa-spinner fa-spin'
      };
    }
    if (cloudStatus.cloudStatus === 'connected') {
      return { 
        value: cloudStatus.message || 'Connected to MongoDB', 
        status: 'connected',
        icon: 'fas fa-database'
      };
    }
    return { 
      value: cloudStatus.message || 'Not Connected to MongoDB', 
      status: 'disconnected',
      icon: 'fas fa-database'
    };
  };

  const statusDisplay = getStatusDisplay();

  const statsCards = [
    { icon: 'fas fa-users', value: stats.totalUsers, label: 'Total Homeowners' },
    { icon: 'fas fa-id-card', value: stats.activeSubscriptions, label: 'Active Subscriptions' },
    { icon: 'fas fa-clock', value: stats.pendingRequests, label: 'Pending Requests' },
    { 
      icon: statusDisplay.icon, 
      value: statusDisplay.value, 
      label: 'MongoDB Status',
      status: statusDisplay.status
    }
  ];

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        {statsCards.map((stat, index) => (
          <div key={index} className={`stat-card ${stat.status ? `status-${stat.status}` : ''}`}>
            <div className="stat-icon">
              <i className={stat.icon}></i>
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="activity-section">
        <h3>Recent Activities</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Activity</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {activities.length > 0 ? activities.map((activity, index) => (
                <tr key={index}>
                  <td>{new Date(activity.timestamp).toLocaleString()}</td>
                  <td>{activity.message}</td>
                  <td>{activity.type}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="3" style={{textAlign: 'center', padding: '20px'}}>No recent activities</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
