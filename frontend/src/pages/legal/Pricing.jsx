function Pricing() {
  return (
    <div className="page" style={{ maxWidth: '800px', lineHeight: '1.7' }}>
      <h2>Pricing</h2>
      <p>Simple, transparent pricing for full access to पढ़AI.</p>

      <div className="card" style={{ maxWidth: '400px' }}>
        <h3>Monthly Subscription</h3>
        <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb', margin: '10px 0' }}>₹500 <span style={{ fontSize: '16px', color: '#666' }}>/ month</span></p>
        <p>Includes:</p>
        <ul>
          <li>All video lessons</li>
          <li>All study notes (secure, watermarked)</li>
          <li>All mock tests with instant scoring</li>
          <li>Doubt-resolution with subject teachers</li>
        </ul>
        <p style={{ fontSize: '14px', color: '#666' }}>Valid for 30 days from date of payment. Does not auto-renew.</p>
      </div>
    </div>
  );
}

export default Pricing;