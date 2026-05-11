export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Project Setup</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Create a new project and provide brand context for your creative
        analysis.
      </p>

      <div className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <fieldset className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Project name
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. Q2 Meta Campaign"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand name</label>
            <input
              type="text"
              disabled
              placeholder="e.g. Betterhalf"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Brand category
            </label>
            <select
              disabled
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Select category...</option>
              <option>Generic ecommerce</option>
              <option>Food / restaurant</option>
              <option>App install</option>
              <option>Matrimony / dating</option>
              <option>Local service</option>
              <option>B2B lead generation</option>
              <option>Personal brand / content creator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Campaign goal
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. App installs"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Target audience
            </label>
            <textarea
              disabled
              rows={2}
              placeholder="e.g. Urban Indian singles, 25-34"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Primary KPI
            </label>
            <select
              disabled
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Select KPI...</option>
              <option>CTR</option>
              <option>CPC</option>
              <option>CPA</option>
              <option>CVR</option>
              <option>ROAS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Tone / positioning
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. Playful, warm"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Platform / source
            </label>
            <select
              disabled
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option>Select platform...</option>
              <option>Meta Ads</option>
              <option>Google Ads</option>
              <option>Generic / Other</option>
            </select>
          </div>
        </fieldset>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <button
            disabled
            className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save &amp; continue
          </button>
          <p className="mt-2 text-xs text-zinc-400">
            Form will be functional after Supabase integration (Phase 2–3).
          </p>
        </div>
      </div>
    </div>
  );
}
