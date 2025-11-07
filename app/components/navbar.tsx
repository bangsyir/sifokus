import { ChevronsDown, Loader, LogOut, Settings } from "lucide-react";
import { Link } from "react-router";
import { ModeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuthUserStore } from "~/store/authStore";
import { Button, buttonVariants } from "./ui/button";
import { cn } from "~/lib/utils";
import { Logout } from "./logout";

export function Navbar({ isLogin }: { isLogin: boolean | undefined }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 pt-2 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Loader className="size-4" />
          </div>
          sifokus.
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />

        {!isLogin ? (
          <Link to="/signin" className={buttonVariants({ variant: "outline" })}>
            Signin
          </Link>
        ) : (
          <SignedInUserDropDown />
        )}
      </div>
    </div>
  );
}

function SignedInUserDropDown() {
  const authUser = useAuthUserStore((s) => s.authUser);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Avatar>
            <AvatarImage
              src={authUser?.avatarUrl || undefined}
              alt="@evilrabbit"
            />
            <AvatarFallback>{authUser?.username?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <p>{authUser?.username}</p>
          <ChevronsDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex w-full items-center gap-2">
            <Settings />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Logout className={cn("ml-0 flex w-full items-center gap-2")}>
            <LogOut />
            Logout
          </Logout>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
