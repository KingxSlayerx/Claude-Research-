"use client";

import Image from "next/image";
import { SAMPLE_ROOMS } from "@/content/assets";
import { defaultConfig } from "@/domain/config";
import { DoorArt } from "@/components/ui/door-art";
import { ArrowIcon, LinkButton } from "@/components/ui/button";
import { Container } from "@/components/ui/layout";

const room = SAMPLE_ROOMS[0].image;
const door = { ...defaultConfig("shaker"), color: "pu-clay" };

export function VisualiserFeature() {
  return (
    <section aria-labelledby="viz-title" className="py-24 lg:py-36">
      <Container className="grid items-center gap-14 lg:grid-cols-12 lg:gap-20">
        <figure className="reveal relative overflow-hidden bg-stone lg:col-span-7">
          <Image src={room.src} alt="" width={room.width} height={room.height} sizes="(min-width: 1024px) 58vw, 100vw" className="w-full" />
          {/* Door plus 55 mm frame, placed over the 900 × 2100 mm opening in this 4800 × 3600 mm sample room. */}
          <div className="absolute" style={{ left: "39.48%", top: "24.86%", width: "21.04%", height: "59.86%" }}>
            <DoorArt config={door} mode="bare" decorative className="h-full w-full drop-shadow-[0_12px_14px_rgba(0,0,0,.25)]" />
          </div>
          <figcaption className="absolute bottom-4 left-4 rounded-full bg-paper/90 px-4 py-2 text-xs text-ink-soft backdrop-blur">
            Sample room with a Shaker door in clay
          </figcaption>
        </figure>
        <div className="flex flex-col gap-7 lg:col-span-5">
          <p className="eyebrow">See it in your space</p>
          <h2 id="viz-title" className="font-display text-display-l">
            Hold the door up to your doorway.
          </h2>
          <p className="max-w-[44ch] text-lg leading-relaxed text-ink-soft">
            Upload a photo of your opening, then place, move and resize your design over it to judge colour and proportion before you commit.
          </p>
          <ul className="flex flex-col border-t border-line text-[0.95rem] text-ink-soft">
            <li className="border-b border-line py-3">Your photo is processed in your browser and never uploaded.</li>
            <li className="border-b border-line py-3">It overlays an illustration of your design — a guide to colour and scale, not a photographic render.</li>
            <li className="border-b border-line py-3">No photo to hand? Try it in one of our sample rooms.</li>
          </ul>
          <div>
            <LinkButton href="/visualise" variant="secondary">
              Try the visualiser <ArrowIcon />
            </LinkButton>
          </div>
        </div>
      </Container>
    </section>
  );
}
