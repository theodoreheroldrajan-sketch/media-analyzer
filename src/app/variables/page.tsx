export default function VariablesPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Variable Schema Builder</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Choose which creative variables the AI should extract from your ad
        images.
      </p>

      <div className="space-y-6">
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">Universal variables</h2>
          <p className="text-sm text-zinc-400">
            Standard creative variables that apply across most ad types (format,
            placement, color, CTA, people, etc.).
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Variable checklist will be implemented in Phase 6.
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">Category variables</h2>
          <p className="text-sm text-zinc-400">
            Variables specific to your brand category (e.g. food texture cues
            for restaurants, app UI visibility for app install).
          </p>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">AI-suggested variables</h2>
          <p className="text-sm text-zinc-400">
            Ask Claude to suggest additional variables based on your brand
            context and sample creatives.
          </p>
          <button
            disabled
            className="mt-3 rounded-md border border-zinc-300 px-4 py-1.5 text-sm opacity-50 cursor-not-allowed dark:border-zinc-700"
          >
            Suggest variables
          </button>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold mb-3">Custom variables</h2>
          <p className="text-sm text-zinc-400">
            Add your own custom variables to the extraction schema.
          </p>
          <button
            disabled
            className="mt-3 rounded-md border border-zinc-300 px-4 py-1.5 text-sm opacity-50 cursor-not-allowed dark:border-zinc-700"
          >
            Add custom variable
          </button>
        </section>
      </div>

      <div className="mt-8">
        <button
          disabled
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900"
        >
          Approve schema &amp; continue to analysis
        </button>
      </div>
    </div>
  );
}
