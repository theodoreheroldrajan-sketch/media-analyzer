import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">
          Creative Media Analyser
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Upload ad creatives and performance data. Extract structured creative
          variables using AI. Discover which visual patterns correlate with
          better performance for your brand.
        </p>

        <div className="flex flex-col items-center gap-3 pt-4">
          <div className="grid grid-cols-3 gap-6 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                1
              </div>
              <div>Upload creatives &amp; CSV</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                2
              </div>
              <div>AI extracts variables</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                3
              </div>
              <div>See what works</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-6">
          <Link
            href="/setup"
            className="rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Start new project
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Try demo
          </Link>
        </div>
      </div>
    </div>
  );
}
