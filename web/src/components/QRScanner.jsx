import React, { useRef, useEffect, useState } from 'react';

export default function QRScanner({ onScan, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let stream = null;
    let animationId = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          
          // Note: Full QR scanning would need a library like jsQR
          // For now, this is a placeholder that shows camera
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (onError) onError(err);
        setHasPermission(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      {!hasPermission && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          📷 Requesting camera permission...
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: '100%', borderRadius: '8px' }}
      />
      
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
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
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#fff3cd', 
        borderRadius: '8px',
        border: '1px solid #ffc107'
      }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
          💡 <strong>Manual Entry:</strong> For now, type the ticket code manually in the admin panel. 
          Full QR scanning requires additional setup.
        </p>
      </div>
    </div>
  );
}