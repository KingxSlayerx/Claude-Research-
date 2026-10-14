import { Approach } from "@/components/home/approach";
import { Collections } from "@/components/home/collections";
import { Featured } from "@/components/home/featured";
import { FinalCta } from "@/components/home/final-cta";
import { FinishStudio } from "@/components/home/finish-studio";
import { HeroScene } from "@/components/home/hero-scene";
import { Materials } from "@/components/home/materials";
import { VisualiserFeature } from "@/components/home/visualiser-feature";

export default function HomePage() {
  return (
    <>
      <HeroScene />
      <FinishStudio />
      <Collections />
      <Featured />
      <Materials />
      <VisualiserFeature />
      <Approach />
      <FinalCta />
    </>
  );
}
