import type { ReactNode } from "react";

export function Container({ children, className = "", wide = false }: { children: ReactNode; className?: string; wide?: boolean }) {
  return <div className={`mx-auto w-full ${wide ? "max-w-[1600px]" : "max-w-[1320px]"} px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 ${align === "center" ? "mx-auto max-w-3xl items-center text-center" : "max-w-3xl"}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className="font-display text-display-l">
        {title}
      </h2>
      {intro && <p className="max-w-[56ch] text-lg leading-relaxed text-ink-soft">{intro}</p>}
    </div>
  );
}
