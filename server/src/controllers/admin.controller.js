import { listAttendees, toggleCheckInByCode, summary } from '../services/attendee.service.js';

export async function adminList(req, res) {
  const data = await listAttendees({ q: req.query.q });
  res.json({ data });
}

export async function adminToggle(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code_required' });
  const attendee = await toggleCheckInByCode(code);
  res.json({ attendee });
}

export async function adminSummary(req, res) {
  const data = await summary();
  res.json({ data });
}
