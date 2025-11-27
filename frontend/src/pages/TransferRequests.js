import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const TransferRequests = () => {
  const [beneficialAllotments, setBeneficialAllotments] = useState([]);
  const [ownershipTransfers, setOwnershipTransfers] = useState([]);
  const [secondaryOwnerships, setSecondaryOwnerships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing');
      const headers = { Authorization: `Bearer ${token}` };

      const [allotmentsRes, transfersRes, ownershipsRes] = await Promise.all([
        fetch('http://localhost:5000/api/transfers/beneficial-allotments', { headers }),
        fetch('http://localhost:5000/api/transfers/ownership-transfers', { headers }),
        fetch('http://localhost:5000/api/transfers/secondary-ownerships', { headers })
      ]);

      console.log('Response status:', {
        allotments: allotmentsRes.status,
        transfers: transfersRes.status,
        ownerships: ownershipsRes.status
      });

      if (!allotmentsRes.ok || !transfersRes.ok || !ownershipsRes.ok) {
        console.error('API Error:', {
          allotments: allotmentsRes.statusText,
          transfers: transfersRes.statusText,
          ownerships: ownershipsRes.statusText
        });
        return;
      }

      const allotmentsData = await allotmentsRes.json();
      const transfersData = await transfersRes.json();
      const ownershipsData = await ownershipsRes.json();

      console.log('Fetched data:', {
        allotments: allotmentsData.length,
        transfers: transfersData.length,
        ownerships: ownershipsData.length
      });

      setBeneficialAllotments(allotmentsData);
      setOwnershipTransfers(transfersData);
      setSecondaryOwnerships(ownershipsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (__v) => (__v === 1 ? 'Approved' : 'Pending');

  const getBadgeClass = (status) => {
    return status === 'Approved' ? 'badge-success' : 'badge-warning';
  };

  const handleAction = async (id, action, type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/transfers/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchAllData(); // Refresh data
        alert(`Request ${action}ed successfully!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating request status');
    }
  };

  const ActionDropdown = ({ item, type }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="dropdown" style={{ position: 'relative' }}>
        <button 
          className="btn btn-small btn-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          Actions ▼
        </button>
        {isOpen && (
          <div className="dropdown-menu" style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000,
            minWidth: '140px'
          }}>
            <button 
              className="dropdown-item"
              onClick={() => {
                handleAction(item._id, 'confirm', type);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#28a745',
                fontWeight: 'bold'
              }}
            >
              <span>✓</span> Confirm
            </button>
            <button 
              className="dropdown-item"
              onClick={() => {
                handleAction(item._id, 'reject', type);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#dc3545',
                fontWeight: 'bold'
              }}
            >
              <span>✗</span> Reject
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <Layout title="Transfer Requests"><div>Loading...</div></Layout>;
  }

  return (
    <Layout title="Transfer Requests">
      {/* Beneficial Allotments Table */}
      <div className="table-section" style={{ marginBottom: '40px' }}>
        <h3>Beneficial Allotments</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>User Email</th>
                <th>Beneficiary Name</th>
                <th>Allotment Type</th>
                <th>Share %</th>
                <th>Effective Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {beneficialAllotments.length > 0 ? beneficialAllotments.map(item => (
                <tr key={item._id}>
                  <td>{item.userName}</td>
                  <td>{item.userEmail}</td>
                  <td>{item.beneficiaryName}</td>
                  <td>{item.allotmentType}</td>
                  <td>{item.sharePercentage}%</td>
                  <td>{new Date(item.effectiveDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${getBadgeClass(getStatus(item.__v))}`}>{getStatus(item.__v)}</span></td>
                  <td><ActionDropdown item={item} type="beneficial-allotments" /></td>
                </tr>
              )) : (
                <tr><td colSpan="8" style={{textAlign: 'center'}}>No beneficial allotments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ownership Transfers Table */}
      <div className="table-section" style={{ marginBottom: '40px' }}>
        <h3>Ownership Transfers</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>User Email</th>
                <th>Current Owner</th>
                <th>New Owner</th>
                <th>Property Address</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ownershipTransfers.length > 0 ? ownershipTransfers.map(item => (
                <tr key={item._id}>
                  <td>{item.userName}</td>
                  <td>{item.userEmail}</td>
                  <td>{item.currentOwner}</td>
                  <td>{item.newOwner}</td>
                  <td>{item.propertyAddress}</td>
                  <td>{item.reason}</td>
                  <td><span className={`badge ${getBadgeClass(getStatus(item.__v))}`}>{getStatus(item.__v)}</span></td>
                  <td><ActionDropdown item={item} type="ownership-transfers" /></td>
                </tr>
              )) : (
                <tr><td colSpan="8" style={{textAlign: 'center'}}>No ownership transfers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Ownerships Table */}
      <div className="table-section">
        <h3>Secondary Ownerships</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>User Email</th>
                <th>Secondary Owner</th>
                <th>Ownership %</th>
                <th>Relationship</th>
                <th>Document Number</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secondaryOwnerships.length > 0 ? secondaryOwnerships.map(item => (
                <tr key={item._id}>
                  <td>{item.userName}</td>
                  <td>{item.userEmail}</td>
                  <td>{item.secondaryOwnerName}</td>
                  <td>{item.ownershipPercentage}%</td>
                  <td>{item.relationshipType}</td>
                  <td>{item.documentNumber}</td>
                  <td><span className={`badge ${getBadgeClass(getStatus(item.__v))}`}>{getStatus(item.__v)}</span></td>
                  <td><ActionDropdown item={item} type="secondary-ownerships" /></td>
                </tr>
              )) : (
                <tr><td colSpan="8" style={{textAlign: 'center'}}>No secondary ownerships found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default TransferRequests;