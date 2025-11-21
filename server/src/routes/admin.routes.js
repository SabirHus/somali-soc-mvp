// server/src/routes/admin.routes.js
import { Router } from "express";
import {
  getSummary,
  getAttendees,
  postToggleCheckin,
} from "../controllers/admin.controller.js";

const router = Router();

// Frontend uses /summary (e.g. Register.jsx)
router.get("/summary", getSummary);

// Admin list/search
router.get("/attendees", getAttendees);

// QR / manual code toggle
router.post("/checkin/toggle", postToggleCheckin);

export default router;
