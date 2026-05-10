export default function MappingPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Mapping Review</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Review how your creative files are linked to performance data rows.
      </p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total creatives", value: "—" },
          { label: "Auto-matched", value: "—" },
          { label: "Needs review", value: "—" },
          { label: "Unmatched", value: "—" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-400">
          Upload creatives and CSV first. The mapping engine will run
          automatically and show results here for your review.
        </p>
        <p className="mt-2 text-xs text-zinc-400">
          Mapping engine will be implemented in Phase 5.
        </p>
      </div>
    </div>
  );
}
