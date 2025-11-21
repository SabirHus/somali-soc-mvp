import Stripe from "stripe";
export function stripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
}
export async function createCheckoutSession({ quantity, email, attendeeId, code }) {
  const s = stripe();
  return s.checkout.sessions.create({
    mode: "payment",
    success_url: `${process.env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/`,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity }],
    metadata: { attendeeId, code },
    customer_email: email
  });
}
export async function retrieveSession(sessionId) {
  return stripe().checkout.sessions.retrieve(sessionId);
}
