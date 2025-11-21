import Stripe from "stripe";
import { markPaidBySession } from "../services/attendee.service.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

export async function stripeWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
        // why: prevents accepting unsigned events
        return res.status(500).send("Webhook secret not configured");
    }

    let event;
    try {
        // req.body is a Buffer here (express.raw)
        event = stripe.webhooks.constructEvent(req.body, sig, secret);
    } catch (err) {
        console.error("⚠️  Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                // why: source of truth; user may close browser before /success
                await markPaidBySession(session.id);
                break;
            }
            default:
                // ignore other events for MVP
                break;
        }
    } catch (err) {
        console.error("Webhook handler error:", err);
        return res.status(500).send("Webhook handler error");
    }

    res.json({ received: true });
}
