import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { StoreHydrator } from "@/state/hydration";
import { Toaster } from "@/components/ui/toast";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StoreHydrator />
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        {children}
      </main>
      <Footer />
      <Toaster />
    </>
  );
}
