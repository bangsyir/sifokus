import { createCookieSessionStorage } from "react-router";
import crypto from "node:crypto";
import { sessions, users } from "~/db/schema";
import { db } from "~/db/drizzle";
import { and, eq, gt, isNotNull, isNull } from "drizzle-orm";

type SessionData = {
  token: string;
  role: string;
};

type SessionFlashdata = {
  message: string;
  error: string;
};

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashdata>({
    cookie: {
      name: "__session",
      domain: process.env.DOMAIN || "",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
      secrets: [process.env.SESSION_SECRET!],
      secure: true,
    },
  });
export { getSession, commitSession, destroySession };

export async function findOrCreatedDbSession(userId: string) {
  // Try to reuse an active, not revoked session
  const existing = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return {
      token: existing[0].token,
      expiresAt: existing[0].expiresAt,
    }; // reuse session
  }
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  now.setDate(now.getDate() + 7);
  const expiresAt = now;
  // Otherwise create a new one
  const [newSession] = await db
    .insert(sessions)
    .values({
      userId,
      token,
      expiresAt: expiresAt,
    })
    .returning();

  return { token: newSession.token, expiresAt };
}

export async function getDbSession(token: string) {
  const [result] = await db
    .select({
      token: sessions.token,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt,
      username: users.username,
      email: users.email,
      userId: sessions.userId,
      avatarUrl: users.image,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), isNotNull(sessions.expiresAt)))
    .limit(1);
  if (!result) return null;

  if (result.expiresAt < new Date()) {
    return null;
  }

  // by default not refresh
  let refreshed = false;
  let newExpiredAt = result.expiresAt;
  return {
    refreshed,
    userId: result.userId,
    expiresAt: newExpiredAt,
    username: result.username,
    email: result.email,
    avatarUrl: result.avatarUrl,
  };
}

export async function revokeSession(token: string) {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.token, token));
}

export async function isSignIn(request: Request): Promise<{
  userId?: string;
  isSignIn: boolean;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}> {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const token = session.get("token");
  if (token) {
    const dbSession = await getDbSession(token);
    if (dbSession === null) {
      return { isSignIn: false };
    } else {
      return {
        userId: dbSession.userId,
        isSignIn: true,
        username: dbSession.username,
        email: dbSession.email,
        avatarUrl: dbSession.avatarUrl,
      };
    }
  }
  return { isSignIn: false };
}
