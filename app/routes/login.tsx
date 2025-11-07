import { GalleryVerticalEnd } from "lucide-react";
import { Link, redirect } from "react-router";
import { google } from "~/utils/google-oauth.server";
import * as arctic from "arctic";
import { LoginForm } from "~/components/login-form";

export async function action() {
  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];
  const authorizationURL = google.createAuthorizationURL(
    state,
    codeVerifier,
    scopes,
  );
  // Save state & codeVerifier in cookies so you can validate callback
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax; Secure=${process.env.NODE_ENV === "production"}`,
  );
  headers.append(
    "Set-Cookie",
    `oauth_code_verifier=${codeVerifier}; HttpOnly; Path=/; SameSite=Lax; Secure=${process.env.NODE_ENV === "production"}`,
  );
  return redirect(`${authorizationURL}`, { headers });
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Sifokus.
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
