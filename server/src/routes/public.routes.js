import { Router } from "express";
import { createSession, success } from "../controllers/checkout.controller.js";
import { getSummary } from "../controllers/admin.controller.js";

const r = Router();
r.post("/checkout/session", createSession);
r.get("/checkout/success", success);
r.get("/summary", getSummary);
export default r;
