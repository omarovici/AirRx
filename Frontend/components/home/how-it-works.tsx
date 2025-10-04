import { TbBulb, TbMap2, TbSatellite } from "react-icons/tb";
import { Card, CardSwap, DotLottieIcon } from "@/components/ui";

export function HowItWorks() {
  const steps = [
    {
      t: "Data",
      c: "TEMPO satellite data and cloud models predict exposure.",
      Icon: TbSatellite,
      lottieSrc: "/lottie/Satellite.lottie",
    },
    {
      t: "Map",
      c: "Let users pick locations and view local AQ forecasts.",
      Icon: TbMap2,
      lottieSrc: "/lottie/Travel Icons - Map.lottie",
    },
    {
      t: "Action",
      c: "Deliver real-time alerts and tailored health advice.",
      Icon: TbBulb,
      lottieSrc: "/lottie/Light Solutions - blue green teal.lottie",
    },
  ];

  return (
    <section
      id="method"
      className="flex justify-center select-none items-center w-full max-w-[1680px] overflow-hidden h-[800px] px-24 relative"
    >
      <div
        className="absolute z-0 inset-0"
        style={{
          background:
            "radial-gradient(600px 300px at 70% 40%, rgba(109,106,254,0.25), transparent), radial-gradient(500px 240px at 30% 70%, rgba(45,212,191,0.18), transparent)",
          filter: "blur(2px)",
        }}
      ></div>
      <div className="flex flex-col w-full items-start justify-center relative">
        <h1 className="font-bold text-6xl">How it works?</h1>
        <p className="mt-4 text-lg max-w-[600px] text-text-dim">
          User selects area; AirRx forecasts air quality and recommends actions.
        </p>
      </div>

      <div className="w-full h-full relative -translate-y-32">
        <CardSwap
          cardDistance={60}
          verticalDistance={70}
          delay={5000}
          pauseOnHover={false}
        >
          {steps.map(({ t, Icon, lottieSrc, c }) => (
            <Card key={t}>
              <div className="border-b px-4 py-1 font-semibold flex gap-1">
                <span className="">
                  <Icon size={24} className="text-primary-400" />
                </span>
                <h3 className="">{t}</h3>
              </div>
              <div className="flex flex-col justify-center items-center px-6 text-center">
                <DotLottieIcon
                  src={lottieSrc}
                  className="aspect-square h-64"
                  ariaLabel="Satellite data animation"
                />
                <p className="text-text-dim text-lg">{c}</p>
              </div>
            </Card>
          ))}
        </CardSwap>
      </div>
    </section>
  );
}
