"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page">
      <div
        className="panel"
        style={{
          maxWidth: 500,
          margin: "60px auto",
          textAlign: "center",
          padding: 32,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--red)",
          }}
        >
          Something went wrong
        </h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          {error.message || "An unexpected error occurred."}
        </p>
        <button className="btn btn-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
