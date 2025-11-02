import type { Route } from "./+types/set-theme";
import { data } from "react-router";

export async function action({ request }: Route.ActionArgs) {
  const { commitSession, getSession } = await import("~/utils/theme.server");
  const formData = await request.formData();
  const theme = formData.get("theme");

  if (typeof theme !== "string") {
    throw new Error();
  }
  const session = await getSession(request.headers.get("Cookie"));
  session.set("theme", theme);

  return data(null, {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
