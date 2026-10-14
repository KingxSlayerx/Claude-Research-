import { Container } from "@/components/ui/layout";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60svh] flex-col items-start justify-center gap-6 py-24">
      <p className="eyebrow">Page not found</p>
      <h1 className="font-display text-display-l">This door doesn&rsquo;t lead anywhere.</h1>
      <p className="text-lg text-ink-soft">The page may have moved. Try the collection instead.</p>
      <div className="flex gap-3">
        <LinkButton href="/doors">Explore doors</LinkButton>
        <LinkButton href="/" variant="secondary">
          Home
        </LinkButton>
      </div>
    </Container>
  );
}
