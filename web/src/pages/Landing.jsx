import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Landing() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const response = await fetch(`${API_URL}/api/events?activeOnly=true&includeStats=true`);
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatPrice(price) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  if (loading) {
    return (
      <div className="landing">
        <div className="container">
          <div className="loading">Loading events...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing">
        <div className="container">
          <div className="error">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container">
          <h1>Somali Society Salford</h1>
          <p>Discover and register for upcoming events</p>
        </div>
      </header>

      <div className="container">
        {events.length === 0 ? (
          <div className="no-events">
            <h2>No Events Available</h2>
            <p>Check back soon for upcoming events from Somali Society Salford!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <h2>{event.name}</h2>
                  {event.isFull && <span className="badge sold-out">Sold Out</span>}
                </div>
                
                <div className="event-details">
                  <div className="detail">
                    <span className="icon">📅</span>
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">🕐</span>
                    <span>{event.eventTime}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">📍</span>
                    <span>{event.location}</span>
                  </div>
                  <div className="detail">
                    <span className="icon">💷</span>
                    <span>{formatPrice(event.price)}</span>
                  </div>
                </div>

                {event.description && (
                  <p className="event-description">{event.description}</p>
                )}

                <div className="event-capacity">
                  <div className="capacity-bar">
                    <div 
                      className="capacity-fill"
                      style={{ width: `${(event.attendeeCount / event.capacity) * 100}%` }}
                    />
                  </div>
                  <span className="capacity-text">
                    {event.remaining} / {event.capacity} tickets remaining
                  </span>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => navigate(`/event/${event.id}`)}
                  disabled={event.isFull}
                >
                  {event.isFull ? 'Sold Out' : 'Register Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

<footer className="landing-footer">
  <div className="container">
    <p>© 2025 Somali Society Salford. All rights reserved.</p>
    <div className="footer-links">
      <a href="/admin">Admin Login</a>
      <span className="divider">|</span>
      <a href="/terms">Terms & Conditions</a>
      <span className="divider">|</span>
      <a href="/privacy">Privacy Policy</a>
      <span className="divider">|</span>
      <a href="mailto:contact@somsocsal.com">Contact</a>
    </div>
  </div>
</footer>
    </div>
  );
}