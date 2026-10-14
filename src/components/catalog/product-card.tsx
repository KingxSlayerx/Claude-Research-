import Image from "next/image";
import Link from "next/link";
import { ROOMS, type DoorStyle } from "@/domain/catalog";
import { startingPrice } from "@/domain/pricing";
import { inr } from "@/domain/format";
import { PRODUCT_RENDERS } from "@/content/assets";

export function ProductCard({ style, priority = false }: { style: DoorStyle; priority?: boolean }) {
  const img = PRODUCT_RENDERS[style.id];
  const rooms = style.rooms.map((r) => ROOMS.find((x) => x.id === r)!.label).join(" · ");
  return (
    <article className="tile group relative flex h-full flex-col transition-shadow duration-500 hover:shadow-lift">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-apple)] group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col items-center px-6 pb-7 pt-5 text-center">
        <p className="eyebrow">{rooms}</p>
        <h3 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.025em]">
          <Link href={`/doors/${style.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {style.name}
          </Link>
        </h3>
        <p className="mt-1 max-w-[34ch] text-[0.95rem] text-muted">{style.blurb}</p>
        <p className="tabular mt-3 text-[0.95rem]">
          From {inr(startingPrice(style))}
          <span className="block text-xs text-muted">Estimate per door, before GST</span>
        </p>
        <div className="mt-5 flex items-center gap-5">
          <Link href={`/design?style=${style.id}`} className="relative z-10 inline-flex h-9 items-center rounded-full bg-olive px-5 text-sm font-medium text-white transition-colors hover:bg-olive-deep">
            Configure<span className="sr-only"> {style.name}</span>
          </Link>
          <span className="chevron-link pointer-events-none text-sm" aria-hidden="true">
            Learn more
          </span>
        </div>
      </div>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[var(--radius-tile)] outline-2 outline-offset-4 outline-olive group-has-[a:focus-visible]:outline" />
    </article>
  );
}
