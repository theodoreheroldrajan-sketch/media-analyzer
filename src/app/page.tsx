import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page">
      <div className="hero">
        <p className="hero-eyebrow">v0.4 · functional preview</p>
        <h1>Find out which creative patterns actually drive performance.</h1>
        <p>
          Upload your ad creatives and a performance CSV. The analyser extracts
          structured creative variables — colour, hook, CTA, social proof,
          message angle — with AI, links each creative to its performance row,
          and shows you what patterns correlate with better CTR, CPC, CPA, CVR,
          or ROAS.
        </p>

        <div className="flow-3step">
          <div className="flow-step">
            <p className="flow-step-num mono">01</p>
            <p className="flow-step-title">Upload</p>
            <p className="flow-step-sub">
              Creatives + performance CSV. We match them automatically.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">02</p>
            <p className="flow-step-title">Analyse</p>
            <p className="flow-step-sub">
              AI extracts 30+ structured variables per image.
            </p>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <p className="flow-step-num mono">03</p>
            <p className="flow-step-title">Learn</p>
            <p className="flow-step-sub">
              See which variables correlate with better performance.
            </p>
          </div>
        </div>

        <div className="hero-cta">
          <Link href="/setup" className="btn btn-primary">
            Start new project →
          </Link>
          <Link href="/dashboard" className="btn">
            Try demo
          </Link>
        </div>
      </div>
    </div>
  );
}
