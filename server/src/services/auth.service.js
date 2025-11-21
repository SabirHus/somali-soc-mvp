import crypto from "crypto";
const COOKIE = "admin_auth";

export function sign(secret) {
    return crypto.createHash("sha256").update(secret).digest("hex");
}

export function setAdminCookie(res) {
    const value = sign(process.env.ADMIN_PASSWORD);
    res.cookie(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
}

export function clearAdminCookie(res) {
    res.clearCookie(COOKIE);
}

export function isAdmin(req) {
    const v = req.cookies?.admin_auth;
    if (!v) return false;
    const expected = sign(process.env.ADMIN_PASSWORD || "");
    try { return crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected)); }
    catch { return false; }
}
