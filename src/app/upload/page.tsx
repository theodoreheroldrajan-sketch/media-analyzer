import Link from "next/link";

export default function UploadPage() {
  return (
    <div className="page">
      <div className="page-head">
        <p className="page-eyebrow">Step 04 of 09</p>
        <h1 className="page-title">
          Upload your creatives and performance data
        </h1>
        <p className="page-sub">
          Drop image files on the left, drop one CSV on the right. We&apos;ll
          validate both before allowing you to continue.
        </p>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="panel-title">Creative assets</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                PNG, JPG, JPEG. Drop a folder or pick files.
              </p>
            </div>
            <span className="badge mono">0 uploaded</span>
          </div>
          <div className="dropzone">
            <p className="dropzone-title">Drop images here or click to select</p>
            <p className="dropzone-sub">
              .png .jpg .jpeg — up to 500 files, 10 MB each
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="panel-title">Performance data</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                One CSV file with the columns you reviewed.
              </p>
            </div>
          </div>
          <div className="dropzone">
            <p className="dropzone-title">Drop CSV here or click to select</p>
            <p className="dropzone-sub">.csv — single file, UTF-8 encoded</p>
          </div>
        </div>
      </div>

      <div className="page-actions">
        <Link href="/instructions" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        <p className="muted" style={{ fontSize: 12, margin: 0, marginRight: 12 }}>
          Upload both files to continue.
        </p>
        <button className="btn btn-primary" disabled>
          Continue to mapping →
        </button>
      </div>
    </div>
  );
}
