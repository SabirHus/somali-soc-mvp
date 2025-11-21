import { Router } from "express";
import { attendees, checkin, login, logout } from "../controllers/admin.controller.js";
import { adminGuard } from "../middleware/admin.guard.js";

const r = Router();
r.post("/login", login);
r.post("/logout", logout);
r.use(adminGuard);
r.get("/attendees", attendees);
r.post("/checkin", checkin);
export default r;
