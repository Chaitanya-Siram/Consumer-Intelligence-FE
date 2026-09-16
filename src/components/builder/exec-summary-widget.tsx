/**
 * Executive Summary card (Figma 480:1864) — violet panel with a title, body
 * paragraph and a "Full Summary" link. Fills the card height.
 */
export function ExecSummaryWidget({ summary }: { summary: string }) {
  return (
    <div
      className="relative flex min-h-[300px] w-full flex-1 flex-col justify-center gap-[20px] overflow-hidden rounded-[var(--sense-radius)] p-[20px] text-white"
      style={{ backgroundColor: "var(--sense-violet, #6952c1)" }}
    >
      <h3 className="type-title text-white">Executive Summary</h3>
      <p className="type-caption leading-[1.4] text-white">{summary}</p>
      <button
        type="button"
        className="self-start type-caption text-white underline decoration-solid underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
      >
        Full Summary
      </button>
    </div>
  )
}
