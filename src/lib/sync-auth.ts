import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "./prisma";

const now = () => new Date();

export const generateId = (prefix?: string) =>
  `${prefix ? `${prefix}-` : ""}${crypto.randomUUID()}`;

export const generateToken = () => crypto.randomBytes(32).toString("hex");

export async function createOrVerifyUser(username: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        id: generateId("user"),
        username,
        passwordHash,
        createdAt: now(),
        updatedAt: now(),
      },
    });
    return user;
  }

  const ok = await bcrypt.compare(password, existing.passwordHash);
  if (!ok) {
    return null;
  }

  return existing;
}

export async function issueToken(userId: string) {
  const token = generateToken();
  await prisma.syncToken.create({
    data: {
      id: generateId("token"),
      token,
      userId,
      createdAt: now(),
      lastUsedAt: now(),
    },
  });
  return token;
}

export async function authenticateToken(token: string) {
  const session = await prisma.syncToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;

  await prisma.syncToken.update({
    where: { token },
    data: { lastUsedAt: now() },
  });

  return session.user;
}
