export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Dataset health, performance metrics, variable patterns and insights.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500 mb-1">Dataset Trust Score</div>
          <div className="text-3xl font-bold">—</div>
          <div className="text-xs text-zinc-400 mt-1">Trust level: —</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500 mb-1">Creatives analysed</div>
          <div className="text-3xl font-bold">—</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500 mb-1">Mapping rate</div>
          <div className="text-3xl font-bold">—</div>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Performance metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {["CTR", "CPC", "CPM", "CVR", "CPA", "ROAS"].map((metric) => (
            <div
              key={metric}
              className="rounded-lg border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-xs text-zinc-500 mb-1">{metric}</div>
              <div className="text-xl font-bold">—</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          Variable performance table
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-400">
            Run an analysis first to see which creative variables correlate with
            better performance.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Dashboard will be implemented in Phase 8.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Creative gallery</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-400">
            Analysed creatives will appear here sorted by performance.
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Insights</h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-400">
            AI-generated insights will appear here after analysis is complete.
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Insight narration will be implemented in Phase 9.
          </p>
        </div>
      </section>
    </div>
  );
}
