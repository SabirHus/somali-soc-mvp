import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [view, setView] = useState('login'); // login, events, attendees, create-event
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    location: '',
    eventDate: '',
    eventTime: '',
    price: '',
    capacity: '',
    stripePriceId: ''
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      setView('events');
      fetchEvents(savedToken);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setIsAuthenticated(true);
      setView('events');
      fetchEvents(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsAuthenticated(false);
    setView('login');
    setEvents([]);
    setAttendees([]);
    setSelectedEvent(null);
  }

  async function fetchEvents(authToken = token) {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/events?includeStats=true`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEventAttendees(eventId) {
    setLoading(true);
    try {
      const [attendeesRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/events/${eventId}/attendees`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/events/${eventId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!attendeesRes.ok || !summaryRes.ok) throw new Error('Failed to fetch data');

      const attendeesData = await attendeesRes.json();
      const summaryData = await summaryRes.json();

      setAttendees(attendeesData);
      setSummary(summaryData);
      setSelectedEvent(events.find(e => e.id === eventId));
      setView('attendees');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eventForm,
          price: parseFloat(eventForm.price),
          capacity: parseInt(eventForm.capacity)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }

      alert('Event created successfully!');
      setEventForm({
        name: '',
        description: '',
        location: '',
        eventDate: '',
        eventTime: '',
        price: '',
        capacity: '',
        stripePriceId: ''
      });
      setView('events');
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleEventActive(eventId, currentStatus) {
    try {
      const response = await fetch(`${API_URL}/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (!response.ok) throw new Error('Failed to update event');
      
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const filteredAttendees = attendees.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // LOGIN VIEW
  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="admin-login">
          <h1>Admin Login</h1>
          <p>Somali Society Salford</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  // MAIN ADMIN VIEW
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-nav">
          <button onClick={() => setView('events')} className={view === 'events' ? 'active' : ''}>
            Events
          </button>
          <button onClick={() => setView('create-event')} className={view === 'create-event' ? 'active' : ''}>
            Create Event
          </button>
          <button onClick={() => navigate('/scan')} className="btn-scan">
            Scanner
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* EVENTS LIST VIEW */}
      {view === 'events' && (
        <div className="admin-content">
          <h2>All Events</h2>
          {loading ? (
            <div className="loading">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <p>No events created yet.</p>
              <button onClick={() => setView('create-event')} className="btn btn-primary">
                Create First Event
              </button>
            </div>
          ) : (
            <div className="events-table">
              <table>
                <thead>
                  <tr>
                    <th>Event Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Price</th>
                    <th>Sold</th>
                    <th>Revenue</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map(event => (
                    <tr key={event.id}>
                      <td><strong>{event.name}</strong></td>
                      <td>{formatDate(event.eventDate)}</td>
                      <td>{event.location}</td>
                      <td>{formatPrice(event.price)}</td>
                      <td>{event.attendeeCount} / {event.capacity}</td>
                      <td>{formatPrice(event.attendeeCount * event.price)}</td>
                      <td>
                        <span className={`badge ${event.isActive ? 'badge-active' : 'badge-inactive'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => fetchEventAttendees(event.id)}
                          className="btn btn-small"
                        >
                          View Attendees
                        </button>
                        <button
                          onClick={() => toggleEventActive(event.id, event.isActive)}
                          className="btn btn-small"
                        >
                          {event.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE EVENT VIEW */}
      {view === 'create-event' && (
        <div className="admin-content">
          <h2>Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="event-form">
            <div className="form-row">
              <div className="form-group">
                <label>Event Name *</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  required
                  placeholder="Somali Cultural Night"
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  required
                  placeholder="Salford Community Centre"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                placeholder="Brief description of the event..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  value={eventForm.eventDate}
                  onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input
                  type="text"
                  value={eventForm.eventTime}
                  onChange={(e) => setEventForm({ ...eventForm, eventTime: e.target.value })}
                  required
                  placeholder="7:00 PM - 11:00 PM"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (£) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={eventForm.price}
                  onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                  required
                  placeholder="20.00"
                />
              </div>

              <div className="form-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  value={eventForm.capacity}
                  onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                  required
                  placeholder="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Stripe Price ID *</label>
              <input
                type="text"
                value={eventForm.stripePriceId}
                onChange={(e) => setEventForm({ ...eventForm, stripePriceId: e.target.value })}
                required
                placeholder="price_1234567890abcdef"
              />
              <small>Get this from your Stripe Dashboard → Products</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Event'}
              </button>
              <button
                type="button"
                onClick={() => setView('events')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ATTENDEES VIEW */}
      {view === 'attendees' && selectedEvent && (
        <div className="admin-content">
          <button onClick={() => setView('events')} className="back-btn">
            ← Back to Events
          </button>

          <h2>{selectedEvent.name} - Attendees</h2>

          {summary && (
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-value">{summary.totalAttendees}</div>
                <div className="summary-label">Total Attendees</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{summary.checkedIn}</div>
                <div className="summary-label">Checked In</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{summary.remaining}</div>
                <div className="summary-label">Tickets Left</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{formatPrice(summary.revenue)}</div>
                <div className="summary-label">Total Revenue</div>
              </div>
            </div>
          )}

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="attendees-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Code</th>
                  <th>Checked In</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No attendees found
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map(attendee => (
                    <tr key={attendee.id}>
                      <td><strong>{attendee.name}</strong></td>
                      <td>{attendee.email}</td>
                      <td>{attendee.phone || 'N/A'}</td>
                      <td><code>{attendee.code}</code></td>
                      <td>
                        <span className={`badge ${attendee.checkedIn ? 'badge-success' : 'badge-pending'}`}>
                          {attendee.checkedIn ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>{formatDate(attendee.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}