import type { ComponentType } from "react";
import { SpotlightCard } from "@/components/ui";

interface ValueCardProps {
  title: string;
  copy: string;
  // Icon should be a component (not an already created element)
  Icon: ComponentType<{ size: number }>;
}

export function ValueCard({ title, copy, Icon }: ValueCardProps) {
  return (
    <SpotlightCard>
      <div className="text-start flex justify-center items-start flex-col gap-4">
        <Icon size={56} />
        <div>
          <h3 className="text-2xl font-semibold">{title}</h3>
          <p className="text-lg text-text-med mt-1">{copy}</p>
        </div>
      </div>
    </SpotlightCard>
  );
}
