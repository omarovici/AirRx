export function InsightChip({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-30">
      <div className="px-3 py-2 rounded-full bg-[--color-bg-2] border border-[--color-stroke] text-xs shadow">
        {text}
      </div>
    </div>
  );
}
