export default function UploadPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-2">Upload</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">
        Upload your ad creative files and performance CSV.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <div className="text-zinc-400 mb-2 text-3xl">📁</div>
          <p className="text-sm font-medium mb-1">Creative assets</p>
          <p className="text-xs text-zinc-400">
            Drag &amp; drop PNG, JPG or JPEG files here
          </p>
          <p className="text-xs text-zinc-400 mt-4">0 files uploaded</p>
        </div>

        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <div className="text-zinc-400 mb-2 text-3xl">📊</div>
          <p className="text-sm font-medium mb-1">Performance CSV</p>
          <p className="text-xs text-zinc-400">
            Drag &amp; drop your CSV export here
          </p>
          <p className="text-xs text-zinc-400 mt-4">No file uploaded</p>
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold mb-3">Validation report</h2>
        <p className="text-sm text-zinc-400">
          Upload a CSV to see the validation report here.
        </p>
      </div>

      <div className="mt-6">
        <button
          disabled
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900"
        >
          Continue to mapping
        </button>
        <p className="mt-2 text-xs text-zinc-400">
          Upload functionality will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
