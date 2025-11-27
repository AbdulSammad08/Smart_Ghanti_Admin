import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubscriptionPlans from './pages/SubscriptionPlans';
import Homeowners from './pages/Homeowners';
import HomeownerDetails from './pages/HomeownerDetails';
import ActiveSubscriptions from './pages/ActiveSubscriptions';
import TransferRequests from './pages/TransferRequests';
import PaymentProofs from './pages/PaymentProofs';
import AdminManagement from './pages/AdminManagement';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/subscription-plans" element={<ProtectedRoute><SubscriptionPlans /></ProtectedRoute>} />
          <Route path="/homeowners" element={<ProtectedRoute><Homeowners /></ProtectedRoute>} />
          <Route path="/homeowner-details/:id" element={<ProtectedRoute><HomeownerDetails /></ProtectedRoute>} />
          <Route path="/active-subscriptions" element={<ProtectedRoute><ActiveSubscriptions /></ProtectedRoute>} />
          <Route path="/transfer-requests" element={<ProtectedRoute><TransferRequests /></ProtectedRoute>} />
          <Route path="/payment-proofs" element={<ProtectedRoute><PaymentProofs /></ProtectedRoute>} />
          <Route path="/admin-management" element={<ProtectedRoute><AdminManagement /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;