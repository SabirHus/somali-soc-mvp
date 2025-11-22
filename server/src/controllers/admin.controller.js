// server/src/controllers/admin.controller.js
import {
  listAttendees,
  toggleCheckInByCode,
  summary,
} from "../services/attendee.service.js";

export async function adminList(req, res, next) {
  try {
    const q = req.query.q?.trim() || undefined;
    const rows = await listAttendees({ q });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function adminToggle(req, res, next) {
  try {
    const code = (req.body?.code || req.params?.code || "").trim();
    if (!code) return res.status(400).json({ error: "code_required" });

    const updated = await toggleCheckInByCode(code);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function adminSummary(_req, res, next) {
  try {
    const data = await summary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
