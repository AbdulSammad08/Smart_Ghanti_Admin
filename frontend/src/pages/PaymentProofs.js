import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const PaymentProofs = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (__v) => (__v === 1 ? 'Approved' : 'Pending');

  const getBadgeClass = (status) => {
    return status === 'Approved' ? 'badge-success' : 'badge-warning';
  };

  const handleAction = async (id, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/payments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        fetchPayments();
        alert(`Payment ${action}ed successfully!`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating payment status');
    }
  };

  const openReceipt = (receiptFile) => {
    const filename = receiptFile.split('\\').pop();
    const receiptUrl = `http://localhost:5000/api/payments/receipt/${filename}`;
    window.open(receiptUrl, '_blank');
  };

  const ActionDropdown = ({ item }) => {
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
                handleAction(item._id, 'confirm');
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
                handleAction(item._id, 'reject');
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
    return <Layout title="Payment Proofs"><div>Loading...</div></Layout>;
  }

  return (
    <Layout title="Payment Proofs">
      <div className="table-section">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Contact Number</th>
                <th>Plan Selected</th>
                <th>Billing Cycle</th>
                <th>Final Amount</th>
                <th>Receipt File</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? payments.map(payment => (
                <tr key={payment._id}>
                  <td>{payment.userName}</td>
                  <td>{payment.contactNumber}</td>
                  <td>{payment.planSelected}</td>
                  <td>{payment.billingCycle}</td>
                  <td>PKR {payment.finalAmount}</td>
                  <td>
                    <button 
                      className="btn btn-small btn-info"
                      onClick={() => openReceipt(payment.receiptFile)}
                    >
                      View Receipt
                    </button>
                  </td>
                  <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getBadgeClass(getStatus(payment.__v))}`}>
                      {getStatus(payment.__v)}
                    </span>
                  </td>
                  <td><ActionDropdown item={payment} /></td>
                </tr>
              )) : (
                <tr><td colSpan="9" style={{textAlign: 'center'}}>No payment proofs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentProofs;