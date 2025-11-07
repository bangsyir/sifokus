import { data } from "react-router";
import { authMiddleware } from "~/middleware/auth";
import type { Route } from "./+types/logout";
import { errorResponse, successResponse } from "~/utils/app-response";

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];

export async function action({ request }: Route.ActionArgs) {
  const { revokeSession, getSession, destroySession } = await import(
    "~/utils/sessions.server"
  );

  const cookieHeader = request.headers.get("Cookie");
  const session = await getSession(cookieHeader);

  const token = session.get("token");
  if (!token)
    return data(
      errorResponse({
        message: "Token request not found",
      }),
      { status: 401 },
    );
  await revokeSession(token);

  return data(
    successResponse({
      message: "See you soon, please come back later",
    }),
    {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    },
  );
}

export async function loader() {
  return null;
}
