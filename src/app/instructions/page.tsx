import Link from "next/link";

export default function InstructionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-2">Before You Upload</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Read this carefully. The tool only works if your creative files can be
          linked to performance data.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">What you need</h2>
        <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
          <li>Your ad creative files (PNG, JPG, JPEG)</li>
          <li>
            A performance export CSV from Meta Ads, Google Ads, or any ad
            reporting source
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          How creatives connect to performance rows
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Method</th>
                <th className="text-left px-3 py-2 font-medium">How it works</th>
                <th className="text-left px-3 py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr>
                <td className="px-3 py-2">Exact filename match</td>
                <td className="px-3 py-2 text-zinc-500">
                  CSV filename column matches uploaded file exactly
                </td>
                <td className="px-3 py-2 text-green-600">Highest</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Normalised filename</td>
                <td className="px-3 py-2 text-zinc-500">
                  Ignores case, spaces, underscores, hyphens, extensions
                </td>
                <td className="px-3 py-2 text-green-600">High</td>
              </tr>
              <tr>
                <td className="px-3 py-2">ID match</td>
                <td className="px-3 py-2 text-zinc-500">
                  Creative / ad / asset ID from CSV appears in filename
                </td>
                <td className="px-3 py-2 text-green-600">High</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Ad name match</td>
                <td className="px-3 py-2 text-zinc-500">
                  Ad name or slug appears in filename
                </td>
                <td className="px-3 py-2 text-yellow-600">Medium</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Fuzzy match</td>
                <td className="px-3 py-2 text-zinc-500">
                  Approximate string match — suggested only, you must confirm
                </td>
                <td className="px-3 py-2 text-orange-600">Low until confirmed</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Manual mapping</td>
                <td className="px-3 py-2 text-zinc-500">
                  You manually connect a creative to a performance row
                </td>
                <td className="px-3 py-2 text-zinc-500">User confirmed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recommended file naming</h2>
        <code className="block bg-zinc-100 dark:bg-zinc-900 rounded px-3 py-2 text-sm">
          platform_campaign_adset_adname_creativeid_variant.ext
        </code>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
          <p>
            <strong>Meta example:</strong>{" "}
            meta_ramadan2026_broadaudience_offer1_238472384_staticA.png
          </p>
          <p>
            <strong>Google example:</strong>{" "}
            google_pmax_springlaunch_asset983742_squareimage_v1.png
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Required CSV columns</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-zinc-200 dark:border-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Fields</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              <tr>
                <td className="px-3 py-2 font-medium">Identifier (at least one)</td>
                <td className="px-3 py-2 text-zinc-500">
                  filename, creative_id, ad_id, asset_id, ad_name, creative_name
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Basic metrics</td>
                <td className="px-3 py-2 text-zinc-500">
                  impressions, clicks, spend
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Recommended</td>
                <td className="px-3 py-2 text-zinc-500">
                  conversions, revenue, date_start, date_end, campaign_name,
                  adset_name, platform, placement
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Why dataset size matters</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          More creatives mean more reliable patterns. The dashboard shows a
          Dataset Trust Score based on how much data you have:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-sm">
          {[
            { n: "<10", label: "Not enough data", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400" },
            { n: "10–29", label: "Directional only", color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" },
            { n: "30–99", label: "Early patterns", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" },
            { n: "100–299", label: "Moderate confidence", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" },
            { n: "300+", label: "Stronger confidence", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
          ].map((level) => (
            <div key={level.n} className={`rounded-md px-3 py-2 text-center ${level.color}`}>
              <div className="font-semibold">{level.n}</div>
              <div className="text-xs">{level.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/upload"
          className="rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          I understand, continue to upload
        </Link>
      </div>
    </div>
  );
}
