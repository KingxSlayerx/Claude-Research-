import Image from "next/image";
import { HERO } from "@/content/assets";
import { ArrowIcon, LinkButton } from "@/components/ui/button";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-walnut text-paper lg:min-h-[calc(100svh-72px)] lg:max-h-[1000px] lg:items-center">
      <Image
        src={HERO.src}
        alt={HERO.alt}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[72%_50%] lg:object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(20,15,10,0)_30%,rgba(20,15,10,.72)_100%)] lg:bg-[linear-gradient(90deg,rgba(24,18,12,.62)_0%,rgba(24,18,12,.3)_40%,rgba(24,18,12,0)_62%)]"
      />
      <div className="mx-auto w-full max-w-[1600px] px-5 pb-14 sm:px-6 lg:px-10 lg:pb-0">
        <div className="max-w-[40rem] motion-safe:animate-[fade-up_.9s_var(--ease-out-soft)_both]">
          <p className="eyebrow mb-6 !text-paper/75">Threshold · Hyderabad</p>
          <h1 id="hero-title" className="font-display text-display-xl">
            An entrance worth coming home&nbsp;to.
          </h1>
          <p className="mt-6 max-w-[30ch] text-lg leading-relaxed text-paper/85 sm:text-xl">
            Thoughtfully crafted doors, made to belong to your space.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <LinkButton href="/doors" variant="light" size="lg" className="!bg-paper !text-ink hover:!bg-ivory">
              Explore the collection <ArrowIcon />
            </LinkButton>
            <LinkButton href="/design" variant="light" size="lg">
              Design your door
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
