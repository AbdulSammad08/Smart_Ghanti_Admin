import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const ActiveSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSubscriptions();
  }, []);

  const fetchActiveSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments/active', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      }
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRenewalDate = (createdAt, billingCycle) => {
    const startDate = new Date(createdAt);
    const renewalDate = new Date(startDate);
    
    if (billingCycle === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }
    
    return renewalDate.toLocaleDateString();
  };

  const getBadgeClass = () => {
    return 'badge-success';
  };

  if (loading) {
    return <Layout title="Active Subscriptions"><div>Loading...</div></Layout>;
  }

  return (
    <Layout title="Active Subscriptions">
      <div className="page-header">
        <h3>Active Subscriptions</h3>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Start Date</th>
              <th>Renewal Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length > 0 ? subscriptions.map((sub) => (
              <tr key={sub._id}>
                <td>{sub.userName}</td>
                <td>{sub.contactNumber}</td>
                <td>{sub.planSelected}</td>
                <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td>{calculateRenewalDate(sub.createdAt, sub.billingCycle)}</td>
                <td><span className={`badge ${getBadgeClass()}`}>Active</span></td>
              </tr>
            )) : (
              <tr><td colSpan="6" style={{textAlign: 'center'}}>No active subscriptions found</td></tr>
            )}
          </tbody>
        </table>
      </div>


    </Layout>
  );
};

export default ActiveSubscriptions;