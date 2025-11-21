import { prisma } from "../models/prisma.js";

export async function createAttendee({ name, email, phone, quantity, code }) {
  return prisma.attendee.create({ data: { name, email, phone, quantity, code, status: "pending" } });
}

export async function linkSession(attendeeId, sessionId) {
  return prisma.attendee.update({ where: { id: attendeeId }, data: { stripeSessionId: sessionId } });
}

export async function markPaidBySession(sessionId) {
  return prisma.attendee.update({ where: { stripeSessionId: sessionId }, data: { status: "paid" } });
}

export async function findByCode(code) {
  return prisma.attendee.findFirst({ where: { code } });
}

export async function toggleCheckinByCode(code) {
  const a = await findByCode(code);
  if (!a) return { status: "err", msg: "Invalid QR" };
  if (a.status === "pending") return { status: "err", msg: "Payment pending" };
  if (a.status === "checked_in") {
    await prisma.attendee.update({ where: { id: a.id }, data: { status: "paid" } });
    return { status: "warn", msg: "Unchecked (back to Paid)" };
  }
  await prisma.attendee.update({ where: { id: a.id }, data: { status: "checked_in" } });
  return { status: "ok", msg: "Checked in — welcome!" };
}

export async function listAttendees({ q, status }) {
  const where = {};
  if (q) where.OR = [
    { name: { contains: q, mode: "insensitive" } },
    { email: { contains: q, mode: "insensitive" } },
    { code: { contains: q, mode: "insensitive" } }
  ];
  if (status) where.status = status;
  return prisma.attendee.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function summary() {
  const g = await prisma.attendee.groupBy({ by: ["status"], _sum: { quantity: true } });
  const paid = g.find(x => x.status === "paid")?._sum.quantity ?? 0;
  const pending = g.find(x => x.status === "pending")?._sum.quantity ?? 0;
  return { paid, pending };
}
