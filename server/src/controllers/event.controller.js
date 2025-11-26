import {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventSummary
} from '../services/event.service.js';

export async function createEventHandler(req, res, next) {
  try {
    const event = await createEvent(req.body);
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function listEventsHandler(req, res, next) {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const includeStats = req.query.includeStats === 'true';
    
    const events = await listEvents({ activeOnly, includeStats });
    res.json(events);
  } catch (err) {
    next(err);
  }
}

export async function getEventHandler(req, res, next) {
  try {
    const includeStats = req.query.includeStats === 'true';
    const event = await getEventById(req.params.id, includeStats);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function updateEventHandler(req, res, next) {
  try {
    const event = await updateEvent(req.params.id, req.body);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

export async function deleteEventHandler(req, res, next) {
  try {
    const hardDelete = req.query.hard === 'true';
    const result = await deleteEvent(req.params.id, hardDelete);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getEventSummaryHandler(req, res, next) {
  try {
    const summary = await getEventSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

export async function getEventAttendeesHandler(req, res, next) {
  try {
    const { listAttendees } = await import('../services/attendee.service.js');
    const attendees = await listAttendees({ eventId: req.params.id });
    res.json(attendees);
  } catch (err) {
    next(err);
  }
}