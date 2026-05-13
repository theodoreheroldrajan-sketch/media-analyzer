export default function Loading() {
  return (
    <div className="page">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <p className="muted" style={{ fontSize: 14 }}>
          Loading…
        </p>
      </div>
    </div>
  );
}
