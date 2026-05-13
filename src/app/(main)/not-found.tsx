import Link from "next/link";

export default function NotFound() {
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
          }}
        >
          Page not found
        </h2>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
      </div>
    </div>
  );
}
