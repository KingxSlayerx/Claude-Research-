import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/layout";
import { Visualiser } from "@/components/visualiser/visualiser";

export const metadata: Metadata = {
  title: "See it in your space",
  description: "Upload a photo of your doorway and place your Threshold door design over it. Your photo stays on your device.",
  alternates: { canonical: "/visualise" },
};

export default function VisualisePage() {
  return (
    <Container wide className="py-12 lg:py-16">
      <header className="mb-10 flex flex-col gap-4 lg:mb-14">
        <p className="eyebrow">See it in your space</p>
        <h1 className="font-display text-display-l">Hold the door up to your doorway.</h1>
        <p className="max-w-[60ch] text-lg text-ink-soft">
          Upload a photo of your opening, then move and resize your design to judge colour and proportion before you commit.
        </p>
      </header>
      <Suspense fallback={<div className="aspect-[4/3] animate-pulse bg-stone" />}>
        <Visualiser />
      </Suspense>
    </Container>
  );
}
