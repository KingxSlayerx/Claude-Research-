import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "dark" | "secondary" | "ghost" | "light" | "outline-light" | "olive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background-color,color,border-color,transform,opacity] duration-300 ease-[var(--ease-apple)] disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-olive text-white hover:bg-olive-deep",
  olive: "bg-olive text-white hover:bg-olive-deep",
  dark: "bg-ink text-white hover:bg-ink-soft",
  secondary: "border border-olive text-olive hover:bg-olive hover:text-white",
  ghost: "text-ink hover:bg-stone",
  light: "bg-white text-ink hover:bg-white/85",
  "outline-light": "border border-white/70 text-white hover:bg-white hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-[0.8125rem]",
  md: "h-11 px-6 text-[1rem]",
  lg: "h-12 px-7 text-[1.0625rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type LinkButtonProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode };

export function LinkButton({ variant = "primary", size = "md", className = "", ...rest }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/** Apple-style text link with a trailing chevron. */
export function ChevronLink({ className = "", ...rest }: ComponentProps<typeof Link>) {
  return <Link className={`chevron-link ${className}`} {...rest} />;
}

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}
