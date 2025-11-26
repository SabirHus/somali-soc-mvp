import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function EditAttendee() {
  const { attendeeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkedIn: false
  });
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    fetchAttendeeDetails();
  }, [attendeeId]);

  async function fetchAttendeeDetails() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${attendeeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch attendee');
      
      const attendee = await response.json();
      setFormData({
        name: attendee.name,
        email: attendee.email,
        phone: attendee.phone || '',
        checkedIn: attendee.checkedIn
      });
      setEventName(attendee.event?.name || 'Unknown Event');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      alert('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/attendees/${attendeeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update attendee');
      }

      alert('Attendee updated successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-container">
      {/* HEADER WITH INLINE STYLES */}
      <div className="admin-header" style={{ padding: '20px 40px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%'
        }}>
          <h1 style={{ margin: 0, color: 'white', fontSize: '1.8rem' }}>Edit Attendee</h1>
          <button 
            onClick={() => navigate('/admin')} 
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              padding: '10px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      <div className="admin-content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading && !formData.name ? (
          <div className="loading">Loading attendee...</div>
        ) : (
          <>
            {/* TITLE BOX WITH INLINE STYLES */}
            <div style={{
              background: 'white',
              padding: '32px 40px',
              borderRadius: '12px',
              marginBottom: '32px',
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
              border: '3px solid #E3F2FD'
            }}>
              <h2 style={{ 
                margin: '0 0 20px 0', 
                color: '#003B73', 
                fontSize: '1.6rem',
                fontWeight: '600'
              }}>
                Editing: <span style={{
                  color: '#0074D9',
                  fontWeight: '800',
                  fontSize: '2.2rem',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(0, 116, 217, 0.4)',
                  textDecorationThickness: '4px',
                  textUnderlineOffset: '6px'
                }}>{formData.name}</span>
              </h2>
              
              {/* EVENT BADGE WITH INLINE STYLES */}
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #0074D9 0%, #0059B3 100%)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '1.25rem',
                fontWeight: '800',
                marginTop: '16px',
                boxShadow: '0 4px 12px rgba(0, 116, 217, 0.4)',
                letterSpacing: '0.5px',
                border: '2px solid rgba(255, 255, 255, 0.3)'
              }}>
                <strong style={{ marginRight: '12px', fontSize: '1.2rem', textTransform: 'uppercase' }}>
                  EVENT:
                </strong> 
                {eventName}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="checkedIn"
                    checked={formData.checkedIn}
                    onChange={handleChange}
                  />
                  <span>Checked In</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}