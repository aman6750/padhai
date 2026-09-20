import { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState([]);

  const checkStatus = async () => {
    try {
      const response = await api.get('/api/subscriptions/status');
      setIsSubscribed(response.data.active);
    } catch (error) {
      setMessage('Could not load status.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async () => {
    try {
      const res = await api.get('/api/tests/my-attempts');
      setAttempts(res.data);
    } catch {
      setAttempts([]);
    }
  };

  useEffect(() => {
    checkStatus();
    loadAttempts();
  }, []);

  const handlePayment = async () => {
    try {
      const orderResponse = await api.post('/api/subscriptions/create-order');
      const order = typeof orderResponse.data === 'string'
        ? JSON.parse(orderResponse.data) : orderResponse.data;

      const options = {
        key: 'rzp_live_YOUR_KEY_ID',   // your live Key ID
        amount: order.amount,
        currency: order.currency,
        name: 'पढ़AI',
        description: '1 Month Subscription',
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyResponse = await api.post('/api/subscriptions/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyResponse.data.success) {
              setMessage('Payment successful! Subscription activated.');
              checkStatus();
            } else {
              setMessage('Payment verification failed.');
            }
          } catch {
            setMessage('Payment verification failed.');
          }
        },
        theme: { color: '#2563eb' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setMessage('Could not start payment. Please try again.');
    }
  };

  // Calculate progress stats
  const totalTests = attempts.length;
  const avgPercent = totalTests > 0
    ? Math.round(
        attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / totalTests
      )
    : 0;

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h2>Dashboard</h2>

      {/* Subscription status */}
      {isSubscribed ? (
        <p className="status-active">✅ You are subscribed! You can access all content.</p>
      ) : (
        <div>
          <p className="status-inactive">❌ You are not subscribed.</p>
          <button className="btn" onClick={handlePayment}>Pay ₹500 for 1 month</button>
        </div>
      )}
      {message && <p className="message">{message}</p>}

      {/* Progress summary cards */}
      <h3 style={{ marginTop: '32px' }}>Your Progress</h3>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '16px 0' }}>
        <div className="stat-card">
          <div className="stat-number">{totalTests}</div>
          <div className="stat-label">Tests Taken</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgPercent}%</div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>

      {/* Test history */}
      <h3 style={{ marginTop: '24px' }}>Test History</h3>
      {attempts.length === 0 ? (
        <p style={{ color: '#666' }}>You haven't taken any tests yet.</p>
      ) : (
        <div className="table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '8px' }}>Test</th>
                <th style={{ padding: '8px' }}>Score</th>
                <th style={{ padding: '8px' }}>Percentage</th>
                <th style={{ padding: '8px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px' }}>Test #{a.testId}</td>
                  <td style={{ padding: '8px' }}>{a.score} / {a.totalQuestions}</td>
                  <td style={{ padding: '8px' }}>
                    {Math.round((a.score / a.totalQuestions) * 100)}%
                  </td>
                  <td style={{ padding: '8px' }}>
                    {a.attemptedAt ? new Date(a.attemptedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;