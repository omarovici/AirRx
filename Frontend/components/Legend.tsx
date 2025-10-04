export function Legend({
  title,
  subtitle,
  ramp,
}: {
  title: string;
  subtitle?: string;
  ramp?: { from: string; to: string; min: string; max: string };
}) {
  return (
    <div className="card p-3 text-sm">
      <div className="font-medium">
        {title}
        {subtitle ? ` — ${subtitle}` : ""}
      </div>
      {ramp ? (
        <div className="mt-2">
          <div
            className="h-2 rounded"
            style={{
              background: `linear-gradient(to right, ${ramp.from}, ${ramp.to})`,
            }}
          />
          <div className="flex justify-between text-[11px] text-[--color-text-med] mt-1">
            <span>{ramp.min}</span>
            <span>{ramp.max}</span>
          </div>
        </div>
      ) : (
        <div className="mt-2 text-[--color-text-med]">Legend not available</div>
      )}
    </div>
  );
}
