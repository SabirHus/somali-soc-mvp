import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function EditEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    eventDate: '',
    eventTime: '',
    price: '',
    capacity: ''
  });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  async function fetchEventDetails() {
    const token = localStorage.getItem('adminToken');
    
    if (!token) {
      navigate('/admin');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch event');
      
      const event = await response.json();
      setFormData({
        name: event.name,
        description: event.description || '',
        location: event.location,
        eventDate: event.eventDate.split('T')[0],
        eventTime: event.eventTime,
        price: event.price,
        capacity: event.capacity
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update event');
      }

      alert('Event updated successfully!');
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
          <h1 style={{ margin: 0, color: 'white', fontSize: '1.8rem' }}>Edit Event</h1>
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
          <div className="loading">Loading event...</div>
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
                margin: '0', 
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
            </div>

            <form onSubmit={handleSubmit} className="event-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Event Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Event Time *</label>
                  <input
                    type="text"
                    name="eventTime"
                    value={formData.eventTime}
                    onChange={handleChange}
                    placeholder="e.g., 19:00-23:00"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (£) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
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