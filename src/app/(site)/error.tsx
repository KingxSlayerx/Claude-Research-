"use client";

import { Container } from "@/components/ui/layout";
import { Button, LinkButton } from "@/components/ui/button";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex min-h-[60svh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="font-display text-display-m">We couldn&rsquo;t load this page.</h1>
      <p className="text-ink-soft">Your saved designs and quote are safe on this device.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <LinkButton href="/" variant="secondary">
          Home
        </LinkButton>
      </div>
    </Container>
  );
}
