import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Scan() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      if (!token) {
        setResult({
          status: 'error',
          message: '❌ Not authenticated. Please login.'
        });
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
        return;
      }

      const response = await fetch(`${API_URL}/api/admin/toggle-checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: code.trim() })
      });

      if (!response.ok) {
        throw new Error('Invalid code or payment pending');
      }

      const attendee = await response.json();
      
      setResult({
        status: attendee.checkedIn ? 'success' : 'already',
        message: attendee.checkedIn 
          ? `✅ ${attendee.name} checked in!`
          : `⚠️ ${attendee.name} already checked in`,
        attendee
      });
      
      setCode('');
      
      setTimeout(() => {
        setResult(null);
      }, 3000);
      
    } catch (err) {
      setResult({
        status: 'error',
        message: '❌ Invalid ticket code or payment pending'
      });
      
      setTimeout(() => {
        setResult(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>🎫 Check-In</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            Enter Ticket Code:
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="SS-..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              boxSizing: 'border-box',
              textTransform: 'uppercase'
            }}
            disabled={loading}
            autoFocus
          />
        </div>
        
        <button
          type="submit"
          disabled={loading || !code.trim()}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#ccc' : '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Checking...' : 'Check In'}
        </button>
      </form>
      
      {result && (
        <div style={{
          padding: '40px 20px',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          background: result.status === 'success' ? '#4caf50' :
                     result.status === 'already' ? '#ff9800' : '#f44336',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          {result.message}
          {result.attendee && (
            <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'normal' }}>
              <p style={{ margin: '8px 0' }}>📧 {result.attendee.email}</p>
              <p style={{ margin: '8px 0' }}>🎟️ Tickets: {result.attendee.quantity}</p>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a 
          href="/admin" 
          style={{ 
            color: '#1a73e8', 
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          ← Back to Admin Dashboard
        </a>
      </div>
    </div>
  );
}