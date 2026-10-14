import Image from "next/image";
import { HERO_OPEN_RENDER } from "@/content/assets";
import { LinkButton } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="on-dark relative isolate overflow-hidden bg-night text-white">
      <div className="relative mx-auto flex max-w-[1100px] flex-col items-center px-6 pt-24 text-center lg:pt-32">
        <h2 id="cta-title" className="font-display max-w-[15ch] text-display-l">
          Your door is waiting.
        </h2>
        <p className="mt-4 max-w-[44ch] text-lede text-white/80">Design it in a few minutes. We&rsquo;ll measure, confirm the price and fit it for you.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <LinkButton href="/design" variant="light" size="lg">
            Design your door
          </LinkButton>
          <LinkButton href="/doors" variant="outline-light" size="lg">
            Explore the collection
          </LinkButton>
        </div>
      </div>
      <div className="relative -mt-4 aspect-[16/9] w-full max-md:aspect-[4/5]">
        <Image src={HERO_OPEN_RENDER.src} alt={HERO_OPEN_RENDER.alt} fill sizes="100vw" className="object-cover object-[50%_75%]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-night to-transparent" />
      </div>
    </section>
  );
}
