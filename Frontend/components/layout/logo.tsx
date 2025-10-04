import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  // If you know exact dimensions, provide width & height (intrinsic mode).
  width?: number;
  height?: number;

  // If you don't know dimensions, omit width/height and size via Tailwind on the wrapper.
  // Example: "w-28 h-8" (default), "w-36 h-10", "w-24 h-6", etc.
  className?: string;

  // For fill mode, pass responsive sizes to prevent over-fetching.
  sizes?: string;

  // Optionally prioritize loading (e.g., in navbar).
  priority?: boolean;
};

export function Logo({
  width,
  height,
  className = "h-full w-full",
  sizes = "(max-width: 640px) 112px, 160px",
  priority = true,
}: LogoProps) {
  const fillMode = !(width && height);

  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex w-32 h-full items-center"
    >
      <span
        className={clsx(
          fillMode && "relative block object-cover",
          fillMode ? className : undefined,
        )}
      >
        {fillMode ? (
          <Image
            src="/logo.png"
            alt="logo"
            fill
            sizes={sizes}
            style={{ objectFit: "cover" }}
            priority={priority}
            objectFit="cover"
            draggable={false}
          />
        ) : (
          <Image
            src="/logo.png"
            alt="logo"
            width={width}
            height={height}
            priority={priority}
            draggable={false}
          />
        )}
      </span>
    </Link>
  );
}
