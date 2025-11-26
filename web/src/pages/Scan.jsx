import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Scan.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Scan() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState(null);
  const [attendee, setAttendee] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (scanning) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [scanning]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      showMessage('error', 'Failed to access camera: ' + err.message);
      setScanning(false);
    }
  }

  function stopCamera() {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  }

  async function scanQRCode() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      try {
        // Use jsQR library to decode
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code && code.data) {
          const scannedCode = code.data.trim();
          
          // Only process if it's a new code
          if (scannedCode !== lastScannedCode && scannedCode.startsWith('SS-')) {
            setLastScannedCode(scannedCode);
            await handleCheckIn(scannedCode);
          }
        }
      } catch (err) {
        console.error('QR scanning error:', err);
      }
    }
  }

  async function handleCheckIn(code) {
    if (!token) {
      showMessage('error', 'Not authenticated');
      return;
    }

    setLoading(true);
    playSound('scan');

    try {
      const response = await fetch(`${API_URL}/api/attendees/${code}/checkin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Check-in failed');
      }

      setAttendee(data);
      
      if (data.checkedIn) {
        showMessage('success', `✅ ${data.name} checked in successfully!`);
        playSound('success');
      } else {
        showMessage('warning', `⚠️ ${data.name} checked out`);
        playSound('warning');
      }

      // Clear after 5 seconds
      setTimeout(() => {
        setAttendee(null);
        setLastScannedCode(null);
      }, 5000);

    } catch (err) {
      showMessage('error', err.message);
      playSound('error');
      setAttendee(null);
      
      // Allow retry after 2 seconds
      setTimeout(() => {
        setLastScannedCode(null);
      }, 2000);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCheckIn(e) {
    e.preventDefault();
    if (manualCode.trim()) {
      await handleCheckIn(manualCode.trim().toUpperCase());
      setManualCode('');
    }
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function playSound(type) {
    // Create audio context for sound feedback
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'success':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
      case 'warning':
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      case 'scan':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="scan-container">
        <div className="scan-login">
          <h1>Scanner Access</h1>
          <p>You must be logged in as admin</p>
          <button onClick={() => navigate('/admin')} className="btn btn-primary">
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scan-container">
      <div className="scan-header">
        <button onClick={() => navigate('/admin')} className="back-btn">
          ← Back to Dashboard
        </button>
        <h1>QR Code Scanner</h1>
      </div>

      {message && (
        <div className={`scan-message scan-message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="scan-content">
        <div className="scanner-section">
          <div className="scanner-controls">
            <button
              onClick={() => setScanning(!scanning)}
              className={`btn ${scanning ? 'btn-danger' : 'btn-primary'}`}
            >
              {scanning ? '⏹ Stop Scanner' : '📷 Start Scanner'}
            </button>
          </div>

          {scanning && (
            <div className="camera-container">
              <video ref={videoRef} className="camera-video" playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div className="scanner-overlay">
                <div className="scanner-box"></div>
              </div>
              <p className="scanner-hint">Position QR code in the box</p>
            </div>
          )}

          <div className="manual-entry">
            <h3>Manual Entry</h3>
            <form onSubmit={handleManualCheckIn}>
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter booking code (e.g., SS-ABC12345)"
                disabled={loading}
              />
              <button type="submit" className="btn btn-secondary" disabled={loading}>
                Check In
              </button>
            </form>
          </div>
        </div>

        {attendee && (
          <div className={`attendee-card ${attendee.checkedIn ? 'checked-in' : 'checked-out'}`}>
            <div className="attendee-status">
              {attendee.checkedIn ? (
                <>
                  <span className="status-icon">✅</span>
                  <h2>Checked In</h2>
                </>
              ) : (
                <>
                  <span className="status-icon">⚠️</span>
                  <h2>Checked Out</h2>
                </>
              )}
            </div>
            
            <div className="attendee-details">
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{attendee.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Code:</span>
                <span className="value"><code>{attendee.code}</code></span>
              </div>
              <div className="detail-row">
                <span className="label">Email:</span>
                <span className="value">{attendee.email}</span>
              </div>
              {attendee.event && (
                <div className="detail-row">
                  <span className="label">Event:</span>
                  <span className="value">{attendee.event.name}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Load jsQR library */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    </div>
  );
}