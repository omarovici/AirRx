import { clsx } from "clsx";
import type React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  return (
    <button
      className={clsx(
        "btn transition-colors focus-visible:outline-none",
        variant === "primary"
          ? "btn-primary hover:bg-[--color-primary-400]"
          : "btn-ghost hover:border-[--color-primary-500]",
        size === "lg" ? "text-base px-5 py-3" : "text-sm",
        className,
      )}
      {...props}
    />
  );
}
