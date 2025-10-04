import { Hero, HowItWorks, MapPreview, Values } from "@/components/home";

export default function Home() {
  return (
    <main className="w-full max-w-[1680px] mx-auto gap-12 flex flex-col">
      <Hero
        title="Breathe Smarter, Act Sooner"
        subtitle="Our mission is people first: to reduce harmful exposure, prevent health crises, and give unprotected communities the tools to breathe safer every day."
      />
      <Values />
      <HowItWorks />
      <MapPreview />
    </main>
  );
}
