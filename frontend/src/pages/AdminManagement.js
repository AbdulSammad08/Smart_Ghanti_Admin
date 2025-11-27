import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/admins', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        alert('Admin created successfully');
        setEmail('');
        setPassword('');
        fetchAdmins();
      } else {
        const error = await response.json();
        alert(error.message);
      }
    } catch (error) {
      alert('Error creating admin');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/admin/admins/${adminId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          alert('Admin deleted successfully');
          fetchAdmins();
        } else {
          alert('Error deleting admin');
        }
      } catch (error) {
        alert('Error deleting admin');
      }
    }
  };

  return (
    <Layout title="Admin Management">
      <div className="admin-management">
        <div className="create-admin-form">
          <h3>Add New Admin</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Admin'}
            </button>
          </form>
        </div>

        <div className="admins-list">
          <h3>Existing Admins</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin._id}>
                  <td>{admin.email}</td>
                  <td>{admin.role}</td>
                  <td>{admin.isActive ? 'Active' : 'Inactive'}</td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td>
                    {admin.email !== 'admin@smartbell.com' && (
                      <button 
                        onClick={() => handleDelete(admin._id)}
                        className="btn btn-danger btn-small"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default AdminManagement;