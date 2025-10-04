"use client";
import type React from "react";

export function BottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className={[
          "fixed z-50 left-0 right-0 bottom-0 rounded-t-2xl border-t border-[--color-stroke] bg-[--color-bg-1] shadow-2xl",
          "transition-transform duration-200",
          open ? "translate-y-0" : "translate-y-[110%]",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-screen-md mx-auto p-4">{children}</div>
      </div>
    </>
  );
}
