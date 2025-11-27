import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../components/AuthContext';

const HomeownerDetails = () => {
  const { id } = useParams();

  const [homeowner, setHomeowner] = useState(null);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [secondaryOwnerships, setSecondaryOwnerships] = useState([]);
  const [ownershipTransfers, setOwnershipTransfers] = useState([]);
  const [beneficialAllotments, setBeneficialAllotments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token && id) {
      fetchHomeownerDetails();
    }
  }, [token, id]);

  const fetchHomeownerDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHomeowner(data.user);
        setActiveSubscription(data.activeSubscription);
        setSecondaryOwnerships(data.secondaryOwnerships);
        setOwnershipTransfers(data.ownershipTransfers);
        setBeneficialAllotments(data.beneficialAllotments);
      } else {
        console.error('Failed to fetch homeowner details');
      }
    } catch (error) {
      console.error('Error fetching homeowner:', error);
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

  if (loading) {
    return (
      <Layout title="Homeowner Details">
        <div style={{textAlign: 'center', padding: '50px'}}>Loading...</div>
      </Layout>
    );
  }

  if (!homeowner) {
    return (
      <Layout title="Homeowner Details">
        <div style={{textAlign: 'center', padding: '50px'}}>Homeowner not found</div>
      </Layout>
    );
  }



  return (
    <Layout title="Homeowner Details">
      <Link to="/homeowners" className="back-btn">
        <i className="fas fa-arrow-left"></i>
        Back to Homeowners
      </Link>
      
      <div className="detail-grid">
        <div className="detail-card">
          <h4>Personal Information</h4>
          <div className="detail-item">
            <span className="detail-label">Full Name:</span>
            <span className="detail-value">{homeowner.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Verification Status:</span>
            <span className="detail-value"><span className={`badge ${homeowner.isVerified=true ? 'badge-success' : 'badge-danger'}`}>{homeowner.isVerified ? 'Verified' : 'Not Verified'}</span></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{homeowner.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone:</span>
            <span className="detail-value">{homeowner.phone || 'Not provided'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address:</span>
            <span className="detail-value">{homeowner.address || 'Not provided'}</span>
          </div>
        </div>
        
        <div className="detail-card">
          <h4>Account Information</h4>
          <div className="detail-item">
            <span className="detail-label">Registration Date:</span>
            <span className="detail-value">{homeowner.createdAt ? new Date(homeowner.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Subscription Plan:</span>
            <span className="detail-value">{activeSubscription ? activeSubscription.planSelected : 'No Active Subscription'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Billing Cycle:</span>
            <span className="detail-value">{activeSubscription ? activeSubscription.billingCycle : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Start Date:</span>
            <span className="detail-value">{activeSubscription ? new Date(activeSubscription.createdAt).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Renewal Date:</span>
            <span className="detail-value">{activeSubscription ? calculateRenewalDate(activeSubscription.createdAt, activeSubscription.billingCycle) : 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Final Amount:</span>
            <span className="detail-value">{activeSubscription ? `PKR ${activeSubscription.finalAmount}` : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div className="activity-section">
        <h3>Secondary Users</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Relationship</th>
                <th>Added Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {secondaryOwnerships.length > 0 ? (
                secondaryOwnerships.map((ownership, index) => (
                  <tr key={index}>
                    <td>{ownership.secondaryOwnerName}</td>
                    <td>{ownership.userEmail}</td>
                    <td>{ownership.relationshipType}</td>
                    <td>{new Date(ownership.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${ownership.__v === 1 ? 'badge-success' : 'badge-warning'}`}>
                        {ownership.__v === 1 ? 'Active' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{textAlign: 'center', padding: '20px'}}>No secondary users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="activity-section">
        <h3>Ownership Transfer History</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Current Owner</th>
                <th>New Owner</th>
                <th>Property Address</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {ownershipTransfers.length > 0 ? ownershipTransfers.map((transfer, index) => (
                <tr key={index}>
                  <td>{transfer.currentOwner}</td>
                  <td>{transfer.newOwner}</td>
                  <td>{transfer.propertyAddress}</td>
                  <td>{transfer.reason}</td>
                  <td>{new Date(transfer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${transfer.__v === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {transfer.__v === 1 ? 'Active' : 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No ownership transfers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="activity-section">
        <h3>Beneficiary Allotment</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficiary Name</th>
                <th>Allotment Type</th>
                <th>Share Percentage</th>
                <th>Effective Date</th>
                <th>Created Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {beneficialAllotments.length > 0 ? beneficialAllotments.map((beneficiary, index) => (
                <tr key={index}>
                  <td>{beneficiary.beneficiaryName}</td>
                  <td>{beneficiary.allotmentType}</td>
                  <td>{beneficiary.sharePercentage}%</td>
                  <td>{new Date(beneficiary.effectiveDate).toLocaleDateString()}</td>
                  <td>{new Date(beneficiary.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${beneficiary.__v === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {beneficiary.__v === 1 ? 'Active' : 'Pending'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No beneficiary allotments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


    </Layout>
  );
};

export default HomeownerDetails;