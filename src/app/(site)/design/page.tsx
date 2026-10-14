import type { Metadata } from "next";
import { Suspense } from "react";
import { Configurator } from "@/components/configurator/configurator";

export const metadata: Metadata = {
  title: "Design your door",
  description: "Choose the style, size, timber, finish, colour, glass and hardware of your door and see an itemised estimate update as you go.",
  alternates: { canonical: "/design" },
};

export default function DesignPage() {
  return (
    <Suspense fallback={<div className="min-h-[80svh] animate-pulse bg-ivory" aria-busy="true" />}>
      <Configurator />
    </Suspense>
  );
}
