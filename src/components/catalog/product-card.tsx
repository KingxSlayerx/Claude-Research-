import Image from "next/image";
import Link from "next/link";
import { ROOMS, type DoorStyle } from "@/domain/catalog";
import { startingPrice } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { DOOR_IMAGES } from "@/content/assets";

export function ProductCard({ style, priority = false }: { style: DoorStyle; priority?: boolean }) {
  const img = DOOR_IMAGES[style.id];
  const rooms = style.rooms.map((r) => ROOMS.find((x) => x.id === r)!.label).join(" · ");
  return (
    <article className="group relative flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-stone">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:scale-[1.035] group-focus-within:scale-[1.035]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-5">
        <p className="eyebrow">{rooms}</p>
        <h3 className="font-display text-[2rem] leading-tight">
          <Link href={`/doors/${style.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {style.name}
          </Link>
        </h3>
        <p className="max-w-[40ch] text-[0.95rem] text-ink-soft">{style.blurb}</p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <p className="tabular text-[0.95rem] text-ink-soft">
            From <span className="text-lg text-ink">{inr(startingPrice(style))}</span>
            <span className="block text-xs text-muted">Estimate per door, before GST</span>
          </p>
          <Link
            href={`/design?style=${style.id}`}
            className="relative z-10 rounded-full border border-ink/70 px-4 py-2 text-sm transition-colors hover:bg-ink hover:text-paper"
          >
            Configure<span className="sr-only"> {style.name}</span>
          </Link>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 outline-2 outline-offset-4 outline-olive group-has-[a:focus-visible]:outline" />
    </article>
  );
}
