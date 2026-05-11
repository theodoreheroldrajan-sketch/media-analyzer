"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { useProject } from "@/context/project-context";
import { uploadCreative, parseCSV, mapCSVRow } from "@/lib/upload";

type UploadedFile = {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

type CSVPreview = {
  filename: string;
  headers: string[];
  rowCount: number;
  mappedRows: Record<string, string | number | null>[];
  extraColumns: Record<string, unknown>[];
};

type CSVResult = {
  insertedRows: number;
  snapshotNumber: number;
};

export default function UploadPage() {
  const router = useRouter();
  const { project } = useProject();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Image upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  // CSV state
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
  const [csvResult, setCsvResult] = useState<CSVResult | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);

  // Drag state
  const [imageDragActive, setImageDragActive] = useState(false);
  const [csvDragActive, setCsvDragActive] = useState(false);

  const doneCount = uploadedFiles.filter((f) => f.status === "done").length;
  const canContinue = doneCount > 0 && csvResult !== null;

  // ---- Image uploads ----

  const handleImageFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!project) return;

      const imageFiles = Array.from(files).filter((f) =>
        ["image/png", "image/jpeg", "image/jpg"].includes(f.type)
      );

      if (imageFiles.length === 0) return;

      setUploading(true);

      // Add placeholders
      setUploadedFiles((prev) => [
        ...prev,
        ...imageFiles.map((f) => ({
          name: f.name,
          status: "uploading" as const,
        })),
      ]);

      // Upload each file
      for (const file of imageFiles) {
        const result = await uploadCreative(project.id, file);

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? "error" in result
                ? { name: f.name, status: "error", error: result.error }
                : { name: f.name, status: "done" }
              : f
          )
        );
      }

      setUploading(false);
    },
    [project]
  );

  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setImageDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleImageFiles(e.dataTransfer.files);
    }
  }

  // ---- CSV upload ----

  const handleCSVFile = useCallback(
    async (file: File) => {
      if (!project) return;
      setCsvError(null);
      setCsvResult(null);

      try {
        const { headers, rows, rowCount } = await parseCSV(file);

        // Map each row
        const mappedRows: Record<string, string | number | null>[] = [];
        const extraColumns: Record<string, unknown>[] = [];

        for (const row of rows) {
          const { mapped, extra } = mapCSVRow(row, headers);
          mappedRows.push(mapped);
          extraColumns.push(extra);
        }

        setCsvPreview({
          filename: file.name,
          headers,
          rowCount,
          mappedRows,
          extraColumns,
        });
      } catch (err) {
        setCsvError(
          err instanceof Error ? err.message : "Failed to parse CSV"
        );
      }
    },
    [project]
  );

  async function confirmCSVUpload() {
    if (!project || !csvPreview) return;

    setCsvUploading(true);
    setCsvError(null);

    try {
      const res = await fetch("/api/upload-csv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          filename: csvPreview.filename,
          headers: csvPreview.headers,
          rows: csvPreview.mappedRows,
          extraColumns: csvPreview.extraColumns,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      setCsvResult({
        insertedRows: data.insertedRows,
        snapshotNumber: data.snapshotNumber,
      });
    } catch (err) {
      setCsvError(
        err instanceof Error ? err.message : "Failed to upload CSV"
      );
    } finally {
      setCsvUploading(false);
    }
  }

  function handleCSVDrop(e: React.DragEvent) {
    e.preventDefault();
    setCsvDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleCSVFile(file);
    }
  }

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

      {!project && (
        <div className="callout" style={{ marginBottom: 16 }}>
          Complete the setup step first to create a project.
        </div>
      )}

      <div className="grid-2">
        {/* ---- Creative assets panel ---- */}
        <div className="panel">
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="panel-title">Creative assets</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                PNG, JPG, JPEG. Drop a folder or pick files.
              </p>
            </div>
            <span className="badge mono">{doneCount} uploaded</span>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files) handleImageFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div
            className={`dropzone ${imageDragActive ? "dropzone-active" : ""}`}
            onClick={() => imageInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setImageDragActive(true);
            }}
            onDragLeave={() => setImageDragActive(false)}
            onDrop={handleImageDrop}
            style={{ cursor: "pointer" }}
          >
            {uploadedFiles.length === 0 ? (
              <>
                <p className="dropzone-title">
                  Drop images here or click to select
                </p>
                <p className="dropzone-sub">
                  .png .jpg .jpeg — up to 500 files, 10 MB each
                </p>
              </>
            ) : (
              <div style={{ width: "100%", textAlign: "left" }}>
                <p className="dropzone-title" style={{ marginBottom: 8 }}>
                  {uploading ? "Uploading…" : `${doneCount} file${doneCount !== 1 ? "s" : ""} uploaded`}
                </p>
                <div
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    fontSize: 12,
                  }}
                >
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.name}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "2px 0",
                        color:
                          f.status === "error"
                            ? "var(--red)"
                            : f.status === "done"
                              ? "var(--green)"
                              : "var(--text-2)",
                      }}
                    >
                      <span className="mono">{f.name}</span>
                      <span>
                        {f.status === "uploading"
                          ? "…"
                          : f.status === "done"
                            ? "✓"
                            : "✗"}
                      </span>
                    </div>
                  ))}
                </div>
                <p
                  className="dropzone-sub"
                  style={{ marginTop: 8, cursor: "pointer" }}
                >
                  Click or drop more files to add
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---- Performance data panel ---- */}
        <div className="panel">
          <div className="between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="panel-title">Performance data</h3>
              <p className="panel-sub" style={{ marginBottom: 0 }}>
                One CSV file with the columns you reviewed.
              </p>
            </div>
          </div>

          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCSVFile(file);
              e.target.value = "";
            }}
          />

          {csvResult ? (
            /* ---- CSV upload complete ---- */
            <div
              className="dropzone"
              style={{
                borderColor: "var(--green)",
                textAlign: "left",
              }}
            >
              <p
                className="dropzone-title"
                style={{ color: "var(--green)", marginBottom: 4 }}
              >
                ✓ CSV imported
              </p>
              <p className="mono" style={{ fontSize: 12, margin: "2px 0" }}>
                {csvPreview?.filename}
              </p>
              <p className="muted" style={{ fontSize: 12, margin: "2px 0" }}>
                {csvResult.insertedRows} rows · snapshot #{csvResult.snapshotNumber}
              </p>
              <button
                className="btn mt-2"
                style={{ fontSize: 12 }}
                onClick={() => {
                  setCsvResult(null);
                  setCsvPreview(null);
                }}
              >
                Replace CSV
              </button>
            </div>
          ) : csvPreview ? (
            /* ---- CSV preview / confirm ---- */
            <div
              className="dropzone"
              style={{ textAlign: "left" }}
            >
              <p className="dropzone-title" style={{ marginBottom: 4 }}>
                {csvPreview.filename}
              </p>
              <p className="muted" style={{ fontSize: 12, margin: "2px 0" }}>
                {csvPreview.rowCount} rows · {csvPreview.headers.length} columns
              </p>
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 100,
                  overflowY: "auto",
                  fontSize: 11,
                }}
              >
                {csvPreview.headers.map((h) => (
                  <span
                    key={h}
                    className="badge mono"
                    style={{
                      display: "inline-block",
                      marginRight: 4,
                      marginBottom: 4,
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {csvError && (
                <p
                  style={{
                    color: "var(--red)",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {csvError}
                </p>
              )}

              <div className="btn-row mt-2">
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 12 }}
                  onClick={confirmCSVUpload}
                  disabled={csvUploading || !project}
                >
                  {csvUploading ? "Importing…" : "Confirm & import"}
                </button>
                <button
                  className="btn"
                  style={{ fontSize: 12 }}
                  onClick={() => {
                    setCsvPreview(null);
                    setCsvError(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* ---- CSV dropzone ---- */
            <div
              className={`dropzone ${csvDragActive ? "dropzone-active" : ""}`}
              onClick={() => csvInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setCsvDragActive(true);
              }}
              onDragLeave={() => setCsvDragActive(false)}
              onDrop={handleCSVDrop}
              style={{ cursor: "pointer" }}
            >
              <p className="dropzone-title">
                Drop CSV here or click to select
              </p>
              <p className="dropzone-sub">.csv — single file, UTF-8 encoded</p>
              {csvError && (
                <p
                  style={{
                    color: "var(--red)",
                    fontSize: 12,
                    marginTop: 8,
                  }}
                >
                  {csvError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="page-actions">
        <Link href="/instructions" className="btn">
          ← Back
        </Link>
        <div className="spacer" />
        {!canContinue && (
          <p
            className="muted"
            style={{ fontSize: 12, margin: 0, marginRight: 12 }}
          >
            Upload both files to continue.
          </p>
        )}
        <button
          className="btn btn-primary"
          disabled={!canContinue}
          onClick={() => router.push("/mapping")}
        >
          Continue to mapping →
        </button>
      </div>
    </div>
  );
}
