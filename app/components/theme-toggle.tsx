import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "./ui/button";
import { useFetcher, useRouteLoaderData } from "react-router";

export function ModeToggle() {
  const loaderData = useRouteLoaderData("root");
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" action="/set-theme">
      <div className="flex items-center justify-center">
        <Button
          variant={"outline"}
          size={"icon"}
          name="theme"
          value={loaderData?.theme === "dark" ? "light" : "dark"}
          disabled={fetcher.state === "submitting"}
        >
          {loaderData?.theme === "light" ? (
            <Sun className="h-5 w-5" />
          ) : loaderData?.theme === "dark" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <SunMoon className="h-5 w-5" />
          )}
        </Button>
      </div>
    </fetcher.Form>
  );
}
