// server/src/routes/admin.routes.js
import { Router } from "express";
import {
  adminList,
  adminToggle,
  adminSummary,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { adminGuard } from "../middleware/admin.guard.js";

const router = Router();

router.use(requireAdmin);
router.use(adminGuard);

router.get("/summary", adminSummary);
router.get("/attendees", adminList);
router.post("/toggle-checkin", adminToggle);

export default router;
