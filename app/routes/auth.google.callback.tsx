import { data, redirect, useNavigate } from "react-router";

import * as arctic from "arctic";
import React from "react";
import { toast } from "sonner";
import type { Route } from "./+types/auth.google.callback";
import type { GoogleIdTokenClaims } from "~/models/user-model";
import { appResponse } from "~/helpers/http-response";
import { userService } from "~/services/user-service.server";
import { imageLinkToBase64 } from "~/helpers/image-to-base64";
import { useAuthUserStore } from "~/store/authStore";
import { errorResponse, successResponse } from "~/utils/app-response";

export async function loader({ request }: Route.LoaderArgs) {
  const { google } = await import("~/utils/google-oauth.server");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = request.headers.get("Cookie") || "";
  const getCookie = (name: string) => {
    // simple cookie parse; or use a cookie parser
    const re = new RegExp(`(?:^|; )${name}=([^;]*)`);
    const m = cookies.match(re);
    return m ? decodeURIComponent(m[1]) : null;
  };

  // const storedState = getCookie("oauth_state");
  const codeVerifier = getCookie("oauth_code_verifier");

  if (!code || !state) throw redirect("/signin?error=oauth");

  let tokens;
  try {
    tokens = await google.validateAuthorizationCode(code, codeVerifier!);
  } catch (e) {
    console.error("OAuth validation failed", e);
    return data(appResponse.BadRequest("Oauth validate failed"));
  }

  // Use ID token or userinfo endpoint to get profile (email etc.)
  // Arctic docs: you can get idToken then decode it or fetch userinfo
  const idToken = tokens.idToken();
  const claims = arctic.decodeIdToken(idToken) as GoogleIdTokenClaims;
  const username = claims.email.split("@")[0];
  const login = await userService.loginWithGoogle({
    name: claims.name,
    username: username,
    email: claims.email,
    provider: "google",
    providerId: claims.sub,
    avatarUrl: claims.picture,
  });
  if (!login.success) {
    return data(errorResponse({ message: login.error.message }), {
      status: login.error.status,
    });
  }
  const { commitSession, findOrCreatedDbSession, getSession } = await import(
    "~/utils/sessions.server"
  );

  const session = await getSession(request.headers.get("Cookie"));
  const { token, expiresAt } = await findOrCreatedDbSession(login?.data?.id!);
  session.set("token", token);
  session.set("role", login.data?.role!);
  const message = `Welcome back ${login?.data?.name || null}, let's start focus.`;
  const base64Image = await imageLinkToBase64(claims.picture);
  const dataValue = {
    username: username,
    email: claims.email,
    avatarUrl: base64Image,
  };

  return data(successResponse({ message, data: dataValue }), {
    status: 200,
    headers: {
      "Set-Cookie": await commitSession(session, {
        expires: expiresAt,
      }),
    },
  });
}

export default function GoogleCallback({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const setAuthUser = useAuthUserStore((s) => s.setAuthUser);

  React.useEffect(() => {
    if (loaderData.success) {
      setAuthUser({
        username: loaderData.data?.username,
        email: loaderData.data?.email,
        avatarUrl: loaderData.data?.avatarUrl,
      });
    }
  }, [loaderData.success, loaderData.data]);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaderData.success) {
        toast.error("Opss something wrong...", {
          description: `${loaderData.message}`,
        });
        navigate("/signin");
      }
      toast.success("Success", {
        description: loaderData.message,
      });
      navigate("/");
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [loaderData.success, loaderData.message, navigate, toast]);
}
