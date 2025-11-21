import { isAdmin } from "../services/auth.service.js";
export function adminGuard(req, res, next) {
    if (!isAdmin(req)) return res.status(401).json({ error: "unauthorised" });
    next();
}
