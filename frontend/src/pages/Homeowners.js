import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../components/AuthContext';

const Homeowners = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [homeowners, setHomeowners] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    console.log('Token changed:', token);
    if (token) {
      fetchHomeowners();
    }
  }, [token]);

  const fetchHomeowners = async () => {
    if (!token) {
      console.log('No token available');
      setLoading(false);
      return;
    }
    
    console.log('Fetching homeowners with token:', token);
    
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Fetched data:', data);
      setHomeowners(data.users || []);
    } catch (error) {
      console.error('Error fetching homeowners:', error);
      alert('Failed to fetch data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setHomeowners(homeowners.filter(h => h._id !== userId));
        } else {
          alert('Failed to delete user');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const filteredHomeowners = homeowners.filter(homeowner => 
    (homeowner.name && homeowner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (homeowner.email && homeowner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (homeowner._id && homeowner._id.toString().includes(searchTerm))
  );

  const getBadgeClass = (status) => {
    switch(status) {
      case 'Yes': case 'Completed': return 'badge-success';
      case 'Pending': return 'badge-warning';
      case 'No': case 'Rejected': return 'badge-danger';
      default: return 'badge-primary';
    }
  };

  if (loading) {
    return (
      <Layout title="Homeowners">
        <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>
      </Layout>
    );
  }

  if (!token) {
    return (
      <Layout title="Homeowners">
        <div style={{textAlign: 'center', padding: '50px'}}>Please log in to view homeowners.</div>
      </Layout>
    );
  }

  return (
    <Layout title="Homeowners">
      <div className="search-container" style={{marginBottom: '20px'}}>
        <input 
          type="text" 
          placeholder="Search by name or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '300px',
            padding: '10px',
            border: '1px solid #e3e6f0',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Verified</th>
              <th>Secondary Users</th>
              <th>Beneficiary Allotted</th>
              <th>Ownership Transfer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHomeowners.length === 0 ? (
              <tr>
                <td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>
                  {homeowners.length === 0 ? 'No homeowners found in database' : 'No homeowners match your search'}
                </td>
              </tr>
            ) : (
              filteredHomeowners.map((homeowner, index) => (
                <tr key={homeowner._id}>
                  <td><span className="badge-count">{index + 1}</span></td>
                  <td>{homeowner.name}</td>
                  <td>{homeowner.email}</td>
                  <td><span className={`badge ${homeowner.isVerified ? 'badge-success' : 'badge-danger'}`}>{homeowner.isVerified ? 'Yes' : 'No'}</span></td>
                  <td><span className="badge-count">{homeowner.secondaryUsers || 0}</span></td>
                  <td><span className={`badge ${getBadgeClass(homeowner.beneficiaryAllotted)}`}>{homeowner.beneficiaryAllotted}</span></td>
                  <td><span className={`badge ${getBadgeClass(homeowner.ownershipTransfer)}`}>{homeowner.ownershipTransfer}</span></td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/homeowner-details/${homeowner._id}`} className="btn btn-small btn-primary">View</Link>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleDelete(homeowner._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Homeowners;