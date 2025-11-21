// Attendee service with the names your controllers expect
import { prisma } from '../models/prisma.js';
import crypto from 'node:crypto';

// Small helper for QR / check-in codes
function makeCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

/**
 * Create or update attendees when Stripe session completes
 * (keeps the name your webhook uses: upsertAttendeeFromSession)
 */
export async function upsertAttendeeFromSession(session) {
  // Defensive parsing: old code used these fields
  const name  = session?.metadata?.name  || session?.customer_details?.name  || 'Guest';
  const email = session?.metadata?.email || session?.customer_details?.email || null;
  const phone = session?.metadata?.phone || session?.customer_details?.phone || null;

  // how many tickets?
  const qty = Number(session?.metadata?.quantity ?? session?.amount_total ? 1 : 1);
  const results = [];

  for (let i = 0; i < Math.max(1, qty); i++) {
    const code = makeCode();

    // If your schema has unique(email)+name, switch to upsert with both fields.
    const attendee = await prisma.attendee.create({
      data: {
        name,
        email,
        phone,
        code,
        checkedIn: false,
        status: 'PAID',               // old project used PAID/PENDING or similar
        stripeSessionId: session.id,  // keep traceability
      },
    });

    results.push(attendee);
  }
  return results;
}

/** Admin: list attendees */
export async function listAttendees({ q } = {}) {
  return prisma.attendee.findMany({
    where: q
      ? {
          OR: [
            { name:  { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { code:  { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

/** Admin: toggle check-in by QR/code */
export async function toggleCheckInByCode(code) {
  const rec = await prisma.attendee.findUnique({ where: { code } });
  if (!rec) throw new Error('Attendee not found');

  return prisma.attendee.update({
    where: { code },
    data: { checkedIn: !rec.checkedIn },
  });
}

/** Dashboard summary (capacity math like your old UI expects) */
export async function summary() {
  // If your schema has a separate Payment table, adapt here.
  const paid   = await prisma.attendee.count({ where: { status: 'PAID' } });
  const pending= await prisma.attendee.count({ where: { status: 'PENDING' } });

  return { paid, pending };
}
