export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Manage project configuration, exports and data.
      </p>

      <div className="space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">Brand context</h2>
          <p className="text-sm text-zinc-400">
            Edit your project&apos;s brand context, audience, goal and KPI
            settings.
          </p>
          <button
            disabled
            className="mt-3 rounded-md border border-zinc-300 px-4 py-1.5 text-sm opacity-50 cursor-not-allowed dark:border-zinc-700"
          >
            Edit context
          </button>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">Export data</h2>
          <div className="flex gap-3">
            {["Variables CSV", "Performance CSV", "Combined CSV"].map(
              (label) => (
                <button
                  key={label}
                  disabled
                  className="rounded-md border border-zinc-300 px-4 py-1.5 text-sm opacity-50 cursor-not-allowed dark:border-zinc-700"
                >
                  {label}
                </button>
              )
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">API usage</h2>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-xl font-bold">—</div>
              <div className="text-xs text-zinc-500">Total tokens</div>
            </div>
            <div>
              <div className="text-xl font-bold">—</div>
              <div className="text-xs text-zinc-500">Total cost</div>
            </div>
            <div>
              <div className="text-xl font-bold">—</div>
              <div className="text-xs text-zinc-500">Analysis runs</div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h2 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-3">
            Danger zone
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400 mb-3">
            Permanently delete this project and all associated data.
          </p>
          <button
            disabled
            className="rounded-md border border-red-300 px-4 py-1.5 text-sm text-red-700 opacity-50 cursor-not-allowed dark:border-red-800 dark:text-red-400"
          >
            Delete project
          </button>
        </section>
      </div>

      <p className="mt-6 text-xs text-zinc-400">
        Settings will be functional after Supabase integration.
      </p>
    </div>
  );
}
