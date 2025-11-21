// server/src/controllers/checkout.controller.js
import { z } from "zod";
import crypto from "crypto";
import { createAttendee, linkSession, markPaidBySession } from "../services/attendee.service.js";
import { createCheckoutSession, retrieveSession } from "../services/payment.service.js";
import { makeQrDataUrl } from "../services/qr.service.js";
import { generateICS } from "../services/ics.service.js";
import dayjs from "dayjs";

const CreateSessionDto = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    quantity: z.coerce.number().int().min(1).max(10)
});

// WHY: show precise errors when Stripe rejects (bad key/price/mode)
export async function createSession(req, res) {
    try {
        const parsed = CreateSessionDto.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "bad_request", issues: parsed.error.issues });
        }

        const code = crypto.randomUUID();
        const attendee = await createAttendee({ ...parsed.data, code });

        const session = await createCheckoutSession({
            quantity: attendee.quantity,
            email: attendee.email,
            attendeeId: attendee.id,
            code
        });

        await linkSession(attendee.id, session.id);
        return res.json({ url: session.url });
    } catch (err) {
        // Stripe errors include 'type' & 'message'
        console.error("createSession failed:", err?.message || err);
        return res.status(500).json({
            error: "server_error",
            message: err?.message || "internal_error"
        });
    }
}

export async function success(req, res) {
    const sessionId = req.query.session_id?.toString();
    if (!sessionId) return res.status(400).json({ error: "bad_request" });

    const session = await retrieveSession(sessionId);
    if (session?.payment_status === "paid") {
        await markPaidBySession(sessionId);
    }

    const start = dayjs().add(7, "day").hour(18).minute(0).second(0).millisecond(0).toDate();
    const end = dayjs(start).add(4, "hour").toDate();

    const guestUrl = `${process.env.APP_URL}/success?session_id=${encodeURIComponent(sessionId)}`;
    const ics = generateICS({
        title: "Somali Society Event",
        description: "Bring this QR code",
        location: "Campus Venue",
        start,
        end
    });

    const qr = await makeQrDataUrl(session.metadata?.code || "UNKNOWN");

    res.json({
        ok: true,
        sessionId,
        status: session?.payment_status,
        qr,
        icsDataUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
        googleCalendarUrl: makeGCalUrl(start, end, guestUrl)
    });
}

function pad(n) { return String(n).padStart(2, "0"); }
// keep it UTC for GCal format YYYYMMDDTHHMMSSZ
function fmt(d) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}
function makeGCalUrl(start, end, url) {
    const u = new URL("https://calendar.google.com/calendar/render");
    u.searchParams.set("action", "TEMPLATE");
    u.searchParams.set("text", "Somali Society Event");
    u.searchParams.set("details", "Keep this QR handy:\n" + url);
    u.searchParams.set("location", "Campus Venue");
    u.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
    return u.toString();
}
