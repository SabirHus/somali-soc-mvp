// server/src/middleware/adminAuth.js
export function requireAdmin(req, res, next) {
  const pass =
    req.get("x-admin-password") ||
    req.headers["x-admin-password"] ||
    req.query.pass ||
    req.body?.adminKey ||
    "";

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "ADMIN_KEY_not_set" });
  }
  if (pass !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "unauthorized" });
  }

  req.isAdmin = true;
  next();
}
