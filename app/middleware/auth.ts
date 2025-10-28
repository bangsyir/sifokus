import { redirect } from "react-router";
import { userContext } from "~/context";
import { isSignIn } from "~/utils/sessions.server";

export async function authMiddleware({ request, context }: any) {
  const signin = await isSignIn(request);
  if (signin.isSignIn === false) {
    throw redirect("/login");
  }
  context.set(userContext, signin);
}

export async function isSignInMiddleware({ request, context }: any) {
  const signin = await isSignIn(request);
  context.set(userContext, signin);
}
