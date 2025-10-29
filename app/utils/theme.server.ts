import { createCookieSessionStorage } from "react-router";

const isProduction = import.meta.env.NODE_ENV === "production";

type SessionData = {
  theme: string;
};

export const { getSession, commitSession } =
  createCookieSessionStorage<SessionData>({
    cookie: {
      name: "theme",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secrets: [import.meta.env.VITE_SESSION_SECRET],
      ...(isProduction
        ? { domain: import.meta.env.VITE_DOMAIN, secure: true }
        : {}),
    },
  });

// Helpers to get and set the cookie
export async function getColorScheme(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);
  const colorScheme = session.get("theme");
  return colorScheme ?? "dark";
}
