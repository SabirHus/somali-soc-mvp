import Stripe from "stripe";
import logger from "../utils/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession({ name, email, phone, quantity, eventId, stripePriceId }) {
  if (!stripePriceId) {
    throw new Error("Missing stripePriceId for event");
  }

  if (!eventId) {
    throw new Error("Missing eventId");
  }

  const baseUrl = process.env.APP_URL || process.env.WEB_ORIGIN || 'http://localhost:5173';
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&eventId=${eventId}`;
  const cancelUrl = `${baseUrl}/event/${eventId}?cancelled=true`;

  logger.info('Creating checkout session', {
    email,
    quantity,
    eventId,
    stripePriceId
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price: stripePriceId,
          quantity: Number(quantity || 1),
        },
      ],
      metadata: {
        name: String(name || ""),
        email: String(email || ""),
        phone: String(phone || ""),
        quantity: String(quantity || "1"),
        eventId: String(eventId)
      },
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });

    logger.info('Checkout session created', {
      sessionId: session.id,
      eventId,
      url: session.url
    });

    return { url: session.url, id: session.id };
  } catch (error) {
    logger.error('Failed to create checkout session', {
      error: error.message,
      email,
      eventId,
      quantity
    });
    throw error;
  }
}

export async function getSession(sessionId) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    logger.error('Failed to retrieve session', {
      sessionId,
      error: error.message
    });
    throw error;
  }
}

export function constructWebhookEvent(rawBody, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}