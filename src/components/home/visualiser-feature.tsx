"use client";

import Image from "next/image";
import { SAMPLE_ROOMS } from "@/content/assets";
import { defaultConfig } from "@/domain/config";
import { DoorArt } from "@/components/ui/door-art";
import { ChevronLink } from "@/components/ui/button";

const room = SAMPLE_ROOMS[0].image;
const door = { ...defaultConfig("shaker"), color: "pu-clay" };

export function VisualiserFeature() {
  return (
    <section aria-labelledby="viz-title" className="bg-paper py-24 lg:py-32">
      <div className="mx-auto max-w-[1100px] px-6 text-center">
        <p className="eyebrow-accent">See it at home</p>
        <h2 id="viz-title" className="font-display mt-2 text-display-l">
          Hold the door up to your doorway.
        </h2>
        <p className="mx-auto mt-4 max-w-[50ch] text-lede text-muted">Upload a photo of your opening, then place and resize your design to judge colour and proportion. Your photo never leaves your device.</p>
        <div className="mt-6 flex justify-center gap-8 text-[1.05rem]">
          <ChevronLink href="/visualise">Try it with your photo</ChevronLink>
        </div>
      </div>
      <figure className="reveal mx-auto mt-12 max-w-[1240px] px-4 sm:px-6">
        <div className="tile relative">
          <Image src={room.src} alt="" width={room.width} height={room.height} sizes="(min-width: 1240px) 1240px, 100vw" className="w-full" />
          {/* Door plus 55 mm frame, placed over the 900 × 2100 mm opening in this 4800 × 3600 mm sample room. */}
          <div className="absolute" style={{ left: "39.48%", top: "24.86%", width: "21.04%", height: "59.86%" }}>
            <DoorArt config={door} mode="bare" decorative className="h-full w-full drop-shadow-[0_12px_14px_rgba(0,0,0,.25)]" />
          </div>
        </div>
        <figcaption className="mt-4 text-center text-sm text-muted">An illustration of your design over the photo — a guide to colour and scale, not a photographic render.</figcaption>
      </figure>
    </section>
  );
}
