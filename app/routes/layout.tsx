import { data, Outlet } from "react-router";
import { Navbar } from "~/components/navbar";
import type { Route } from "./+types/layout";
import { imageLinkToBase64 } from "~/helpers/image-to-base64";
import { successResponse } from "~/utils/app-response";
import { useAuthUserStore } from "~/store/authStore";
import React from "react";

export async function loader({ request }: Route.LoaderArgs) {
  const { isSignIn } = await import("~/utils/sessions.server");
  const signin = await isSignIn(request);
  if (!signin.isSignIn) {
    return data(successResponse({ message: "Success", data: null }));
  }
  let avatar = "";
  if (signin.avatarUrl !== null && signin.avatarUrl !== undefined) {
    avatar = await imageLinkToBase64(signin.avatarUrl);
  }
  return data(
    successResponse({
      message: "Success",
      data: { auth: { ...signin, avatarUrl: avatar } },
    }),
  );
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const setAuthUser = useAuthUserStore((s) => s.setAuthUser);
  // avoid client change the session storage value and reset on refresh
  React.useEffect(() => {
    if (loaderData.success === true) {
      setAuthUser({
        username: loaderData.data?.auth.username,
        email: loaderData.data?.auth.email,
        avatarUrl: loaderData.data?.auth.avatarUrl,
      });
    }
  }, [loaderData.success, loaderData.data]);

  return (
    <div className="pb-4 md:pb-0">
      <div className="h-sreen relative container mx-auto flex flex-col px-4 pb-4">
        <Navbar isLogin={loaderData.data?.auth.isSignIn} />
        <Outlet />
      </div>
    </div>
  );
}
