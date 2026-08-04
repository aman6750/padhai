import { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Check subscription status
  const checkStatus = async () => {
    try {
      const response = await api.get('/api/subscriptions/status');
      setIsSubscribed(response.data.active);
    } catch (error) {
      setMessage('Could not load status. Are you logged in?');
    } finally {
      setLoading(false);
    }
  };

  // Runs once when the page loads
  useEffect(() => {
    checkStatus();
  }, []);

  // Handle the "Pay" button
  const handlePayment = async () => {
    try {
      await api.post('/api/subscriptions/confirm-payment');
      setMessage('Payment successful! Subscription activated.');
      checkStatus(); // refresh status after paying
    } catch (error) {
      setMessage('Payment failed. Please try again.');
    }
  };

  if (loading) {
    return <p style={{ padding: '40px' }}>Loading...</p>;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '500px' }}>
      <h1>पढ़AI</h1>
      <h2>Dashboard</h2>

      {isSubscribed ? (
        <p style={{ color: 'green', fontSize: '18px' }}>
          ✅ You are subscribed! You can watch videos.
        </p>
      ) : (
        <div>
          <p style={{ color: 'red', fontSize: '18px' }}>
            ❌ You are not subscribed.
          </p>
          <button
            onClick={handlePayment}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Pay ₹500 for 1 month
          </button>
        </div>
      )}

      {message && <p style={{ marginTop: '15px' }}>{message}</p>}
    </div>
  );
}

export default Dashboard;