import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const SubscriptionPlans = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', duration: 'monthly', features: '', maxDevices: 1, maxSecondaryUsers: 0 });

  // Fetch plans from backend
  const fetchPlans = async () => {
    try {
      console.log('Fetching plans...');
      
      const response = await fetch('http://localhost:5000/api/subscriptions');
      
      console.log('Fetch plans response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched plans:', data);
        setPlans(data);
      } else {
        const errorData = await response.json();
        console.error('Error fetching plans:', errorData);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    try {
      const planData = {
        ...formData,
        features: formData.features.split('\n').filter(f => f.trim())
      };
      console.log('Plan data to send:', planData);
      
      const url = editingPlan 
        ? `http://localhost:5000/api/subscriptions/${editingPlan._id}`
        : 'http://localhost:5000/api/subscriptions';
      
      const method = editingPlan ? 'PUT' : 'POST';
      console.log('Making request to:', url, 'with method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planData)
      });
      
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
      
      if (response.ok) {
        alert('Plan saved successfully!');
        fetchPlans();
        setIsModalOpen(false);
        setEditingPlan(null);
        setFormData({ name: '', price: '', duration: 'monthly', features: '', maxDevices: 1, maxSecondaryUsers: 0 });
      } else {
        alert(`Error: ${responseData.message || 'Failed to save plan'}`);
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Network error occurred');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: plan.features.join('\n'),
      maxDevices: plan.maxDevices,
      maxSecondaryUsers: plan.maxSecondaryUsers
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/subscriptions/${planId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchPlans();
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData({ name: '', price: '', duration: 'monthly', features: '', maxDevices: 1, maxSecondaryUsers: 0 });
  };

  return (
    <Layout title="Subscription Plans">
      <div className="page-header">
        <h3>Manage Subscription Plans</h3>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus"></i> Add New Plan
        </button>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Price</th>
              <th>Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan._id}>
                <td>{plan.name}</td>
                <td>PKR {plan.price}/{plan.duration}</td>
                <td>
                  <ul style={{margin: 0, paddingLeft: '20px'}}>
                    {plan.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn btn-small btn-primary" onClick={() => handleEdit(plan)}>Edit</button>
                    <button className="btn btn-small btn-danger" onClick={() => handleDelete(plan._id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingPlan ? 'Edit Subscription Plan' : 'Add New Subscription Plan'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Plan Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="duration">Duration</label>
              <select
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                style={{width: '100%', padding: '10px', border: '1px solid #e3e6f0', borderRadius: '4px'}}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="features">Features (one per line)</label>
              <textarea
                id="features"
                rows="4"
                style={{width: '100%', padding: '10px', border: '1px solid #e3e6f0', borderRadius: '4px'}}
                value={formData.features}
                onChange={(e) => setFormData({...formData, features: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxDevices">Max Devices</label>
              <input
                type="number"
                id="maxDevices"
                min="1"
                value={formData.maxDevices}
                onChange={(e) => setFormData({...formData, maxDevices: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxSecondaryUsers">Max Secondary Users</label>
              <input
                type="number"
                id="maxSecondaryUsers"
                min="0"
                value={formData.maxSecondaryUsers}
                onChange={(e) => setFormData({...formData, maxSecondaryUsers: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editingPlan ? 'Update Plan' : 'Add Plan'}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default SubscriptionPlans;