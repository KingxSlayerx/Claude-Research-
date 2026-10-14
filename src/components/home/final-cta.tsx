import Image from "next/image";
import { CTA_IMAGE } from "@/content/assets";
import { ArrowIcon, LinkButton } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-walnut text-paper">
      <Image src={CTA_IMAGE.src} alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(22,16,10,.62)_0%,rgba(22,16,10,.25)_75%)]" />
      <div className="mx-auto flex min-h-[70svh] max-w-[1320px] flex-col items-center justify-center gap-8 px-5 py-28 text-center">
        <h2 id="cta-title" className="font-display max-w-[16ch] text-display-l">
          Begin with the door you walk through every day.
        </h2>
        <p className="max-w-[46ch] text-lg text-paper/85">Design it online in a few minutes. We&rsquo;ll measure, confirm the price and fit it for you.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href="/design" size="lg" className="!border-paper !bg-paper !text-ink hover:!bg-ivory">
            Design your door <ArrowIcon />
          </LinkButton>
          <LinkButton href="/doors" variant="light" size="lg">
            Explore the collection
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
