"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

export function Navbar() {
  const pathname = usePathname();
  const links = [
    {
      label: "home",
      url: "/",
    },
    {
      label: "map",
      url: "/map",
    },
  ];

  return (
    <header className="fixed rounded-full top-6 left-1/2 -translate-x-1/2 z-50 bg-bg-0/80 backdrop-blur border w-11/12 max-w-4xl border-stroke">
      <nav className="px-12 flex items-center justify-between h-14">
        <Logo />
        <div className="flex items-center gap-4">
          {links.map(({ label, url }) => (
            <Link
              href={url}
              className={`capitalize transition-all ${
                (pathname?.startsWith(url) && url !== "/") ||
                (pathname === "/" && url === "/")
                  ? "text-primary-400 font-semibold"
                  : "text-text-med hover:text-text-high"
              }`}
              key={label}
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
