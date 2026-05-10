export default function AnalysisPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Analysis</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Run AI-powered creative variable extraction on your mapped creatives.
      </p>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-zinc-500">Mapped creatives</div>
          </div>
          <div>
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-zinc-500">Approved variables</div>
          </div>
          <div>
            <div className="text-2xl font-bold">—</div>
            <div className="text-xs text-zinc-500">Estimated cost</div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
          <button
            disabled
            className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900"
          >
            Start analysis
          </button>
          <p className="mt-2 text-xs text-zinc-400">
            Analysis will be implemented in Phase 7.
          </p>
        </div>
      </div>
    </div>
  );
}
