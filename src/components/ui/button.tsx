import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "light" | "olive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium tracking-[0.01em] transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[var(--ease-out-soft)] disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft border border-ink",
  olive: "bg-olive text-paper hover:bg-olive-deep border border-olive",
  secondary: "border border-ink/80 text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:bg-stone border border-transparent",
  light: "border border-paper/70 text-paper hover:bg-paper hover:text-ink backdrop-blur-[2px]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-full",
  md: "h-11 px-6 text-[0.95rem] rounded-full",
  lg: "h-13 px-8 text-base rounded-full",
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

export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  );
}
