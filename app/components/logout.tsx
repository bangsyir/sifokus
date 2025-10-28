import { useFetcher, useNavigate, useRevalidator } from "react-router";
import { cn } from "~/lib/utils";
import React from "react";
import { toast } from "sonner";
import { useAuthUserStore } from "~/store/authStore";

export function Logout({
  children,
  className,
  ...props
}: React.ComponentProps<"button">) {
  const revalidator = useRevalidator();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const destroyAuthUser = useAuthUserStore((s) => s.destroy);
  React.useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data == null) {
      return;
    }
    if (!fetcher?.data?.success) {
      toast.error("Opss something wrong...", {
        description: `${fetcher?.data?.message}`,
      });
    } else {
      toast.success("Success", {
        description: fetcher?.data?.message,
      });
      destroyAuthUser();
      revalidator.revalidate();
      navigate("/signin");
    }
  }, [fetcher.data]);
  return (
    <fetcher.Form method="post" action="/action/logout">
      <button type="submit" className={cn(className)} {...props}>
        {children}
      </button>
    </fetcher.Form>
  );
}
