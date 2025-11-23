import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-key-in-production';
const JWT_EXPIRES_IN = '7d';

export async function registerAdmin({ email, password, name }) {
  // Check if admin already exists
  const existing = await prisma.admin.findUnique({
    where: { email }
  });

  if (existing) {
    throw new Error('Admin with this email already exists');
  }

  // Hash password with bcrypt
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create admin in database
  const admin = await prisma.admin.create({
    data: {
      email,
      password: hashedPassword,
      name
    }
  });

  // Return admin without password
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name
  };
}

export async function loginAdmin({ email, password }) {
  // Find admin by email
  const admin = await prisma.admin.findUnique({
    where: { email }
  });

  if (!admin) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, admin.password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      name: admin.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name
    }
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}