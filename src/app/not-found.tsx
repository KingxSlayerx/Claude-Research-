import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-ivory px-6 text-center">
      <p className="eyebrow">Page not found</p>
      <h1 className="font-display text-display-m">This door doesn&rsquo;t lead anywhere.</h1>
      <Link href="/" className="link-underline">
        Return home
      </Link>
    </main>
  );
}
