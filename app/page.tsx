import HeroSection from "./components/HeroSection";
import DatabaseSearchSection from "./components/DatabaseSearchSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <DatabaseSearchSection />
    </main>
  );
}
