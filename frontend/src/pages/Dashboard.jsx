import { useEffect, useState } from 'react';
import api from '../services/api';

function Dashboard() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    checkStatus();
  }, []);

  const handlePayment = async () => {
    try {
      // Step 1: ask our backend to create a Razorpay order
      const orderResponse = await api.post('/api/subscriptions/create-order');
      const order = typeof orderResponse.data === 'string'
  ? JSON.parse(orderResponse.data)
  : orderResponse.data;

      // Step 2: configure the Razorpay popup
      const options = {
        key: 'rzp_test_TLnGgIKmD8cjOO', // <-- your Key ID
        amount: order.amount,
        currency: order.currency,
        name: 'पढ़AI',
        description: '1 Month Subscription',
        order_id: order.id,
        handler: async function (response) {
          // Step 3: after payment, verify it with our backend
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
          } catch (err) {
            setMessage('Payment verification failed.');
          }
        },
        theme: { color: '#2563eb' },
      };

      // Step 4: open the popup
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
        console.log('PAYMENT ERROR:', error); 
      setMessage('Could not start payment. Please try again.');
    }
  };

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <h2>Dashboard</h2>
      {isSubscribed ? (
        <p className="status-active">✅ You are subscribed! You can watch videos.</p>
      ) : (
        <div>
          <p className="status-inactive">❌ You are not subscribed.</p>
          <button className="btn" onClick={handlePayment}>Pay ₹500 for 1 month</button>
        </div>
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default Dashboard;