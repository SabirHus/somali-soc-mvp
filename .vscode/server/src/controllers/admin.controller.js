import { listAttendees, toggleCheckinByCode, summary } from "../services/attendee.service.js";
import { setAdminCookie, clearAdminCookie } from "../services/auth.service.js";

export async function login(req, res) {
    const { password } = req.body || {};
    if (!password || password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: "wrong_password" });
    setAdminCookie(res);
    res.json({ ok: true });
}

export async function logout(_req, res) {
    clearAdminCookie(res);
    res.json({ ok: true });
}

export async function attendees(req, res) {
    const { q, status } = req.query;
    const list = await listAttendees({ q: q?.toString() || "", status: status?.toString() || "" });
    res.json(list);
}

export async function checkin(req, res) {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ status: "err", msg: "Missing code" });
    const result = await toggleCheckinByCode(String(code));
    res.json(result);
}

export async function getSummary(_req, res) {
    res.json(await summary());
}
