import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Scan() {
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (code) => {
    if (loading) return;
    
    setScanning(false);
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
        body: JSON.stringify({ code })
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
      
      setTimeout(() => {
        setResult(null);
        setScanning(true);
        setLoading(false);
      }, 2500);
      
    } catch (err) {
      setResult({
        status: 'error',
        message: '❌ Invalid QR code or payment pending'
      });
      
      setTimeout(() => {
        setResult(null);
        setScanning(true);
        setLoading(false);
      }, 2500);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>📱 Check-In Scanner</h1>
      
      {scanning && !result && (
        <div>
          <p style={{ textAlign: 'center', marginBottom: '20px', fontSize: '16px', color: '#666' }}>
            Position QR code within the frame
          </p>
          <QRScanner onScan={handleScan} />
        </div>
      )}
      
      {result && (
        <div style={{
          padding: '60px 40px',
          borderRadius: '16px',
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: 'bold',
          marginTop: '40px',
          background: result.status === 'success' ? '#4caf50' :
                     result.status === 'already' ? '#ff9800' : '#f44336',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
        }}>
          {result.message}
          {result.attendee && (
            <div style={{ marginTop: '30px', fontSize: '18px', fontWeight: 'normal' }}>
              <p style={{ margin: '10px 0' }}>📧 {result.attendee.email}</p>
              <p style={{ margin: '10px 0' }}>🎟️ Tickets: {result.attendee.quantity}</p>
            </div>
          )}
        </div>
      )}
      
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
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