import { GalleryVerticalEnd } from "lucide-react";
import { Link } from "react-router";
import { ModeToggle } from "./theme-toggle";

export function Navbar() {
  return (
    <div className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 flex items-center justify-between border-b pt-2 pb-2 backdrop-blur">
      <div>
        <Link
          to="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          sifokus.
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
      </div>
    </div>
  );
}
