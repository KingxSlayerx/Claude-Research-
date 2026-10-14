import { Approach } from "@/components/home/approach";
import { Collections } from "@/components/home/collections";
import { Featured } from "@/components/home/featured";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { MakeItYours } from "@/components/home/make-it-yours";
import { Materials } from "@/components/home/materials";
import { VisualiserFeature } from "@/components/home/visualiser-feature";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Collections />
      <Featured />
      <Materials />
      <MakeItYours />
      <VisualiserFeature />
      <Approach />
      <FinalCta />
    </>
  );
}
