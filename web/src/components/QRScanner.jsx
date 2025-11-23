import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

export default function QRScanner({ onScan, onError }) {
  const [facingMode, setFacingMode] = useState('environment');

  const handleScan = (data) => {
    if (data?.text) {
      onScan(data.text);
    }
  };

  const handleError = (err) => {
    console.error('QR Scanner Error:', err);
    if (onError) onError(err);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <QrScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        constraints={{
          video: { facingMode }
        }}
        style={{ width: '100%' }}
      />
      
      <button
        onClick={toggleCamera}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.95)',
          border: '2px solid #1a73e8',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
      >
        🔄 Flip Camera
      </button>
    </div>
  );
}