"""
Build three portfolio PDFs for the Creative Media Analyzer:
  docs/PRD.pdf
  docs/methodology.pdf  (with TOC)
  docs/roadmap.pdf

Each PDF: title page, page-numbered footers, section headers, no emoji.
"""

from __future__ import annotations

import os
from datetime import datetime
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, ".."))
DOCS = os.path.join(ROOT, "docs")
os.makedirs(DOCS, exist_ok=True)

AUTHOR = "Theo Rajan"
PROJECT = "Creative Media Analyzer"
DOC_DATE = "2026-05-21"
URL = "https://media-analyzer-theta.vercel.app"
REPO = "github.com/theodoreheroldrajan-sketch/media-analyzer"


# ---------- styles ----------

def make_styles():
    base = getSampleStyleSheet()
    s = {}
    s["title"] = ParagraphStyle(
        "title", parent=base["Title"],
        fontName="Helvetica-Bold", fontSize=28, leading=34,
        textColor=colors.HexColor("#1b1714"), alignment=TA_LEFT,
        spaceAfter=10,
    )
    s["subtitle"] = ParagraphStyle(
        "subtitle", parent=base["Normal"],
        fontName="Helvetica", fontSize=14, leading=18,
        textColor=colors.HexColor("#3a3329"), alignment=TA_LEFT,
        spaceAfter=24,
    )
    s["meta"] = ParagraphStyle(
        "meta", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=colors.HexColor("#6a5f4f"), alignment=TA_LEFT,
        spaceAfter=4,
    )
    s["h1"] = ParagraphStyle(
        "h1", parent=base["Heading1"],
        fontName="Helvetica-Bold", fontSize=18, leading=22,
        textColor=colors.HexColor("#1b1714"),
        spaceBefore=22, spaceAfter=8, keepWithNext=True,
    )
    s["h2"] = ParagraphStyle(
        "h2", parent=base["Heading2"],
        fontName="Helvetica-Bold", fontSize=13, leading=17,
        textColor=colors.HexColor("#1b1714"),
        spaceBefore=14, spaceAfter=6, keepWithNext=True,
    )
    s["body"] = ParagraphStyle(
        "body", parent=base["BodyText"],
        fontName="Helvetica", fontSize=10.5, leading=15,
        textColor=colors.HexColor("#1b1714"), alignment=TA_JUSTIFY,
        spaceAfter=8,
    )
    s["bullet"] = ParagraphStyle(
        "bullet", parent=s["body"],
        leftIndent=14, bulletIndent=0, spaceAfter=4,
    )
    s["mono"] = ParagraphStyle(
        "mono", parent=base["Code"],
        fontName="Courier", fontSize=9, leading=12,
        textColor=colors.HexColor("#1b1714"),
        leftIndent=12, spaceAfter=8,
    )
    s["callout"] = ParagraphStyle(
        "callout", parent=s["body"],
        fontName="Helvetica-Oblique", fontSize=10, leading=14,
        textColor=colors.HexColor("#3a3329"),
        leftIndent=12, rightIndent=12, spaceBefore=8, spaceAfter=8,
        backColor=colors.HexColor("#f5f0e6"),
        borderPadding=8,
    )
    s["toc1"] = ParagraphStyle(
        "toc1", fontName="Helvetica-Bold", fontSize=11, leading=16, leftIndent=0,
    )
    s["toc2"] = ParagraphStyle(
        "toc2", fontName="Helvetica", fontSize=10, leading=14, leftIndent=18,
    )
    return s


# ---------- document template with footer ----------

class FooteredDoc(BaseDocTemplate):
    """Document with page numbers and a small footer line."""

    def __init__(self, filename, doc_title, **kw):
        super().__init__(filename, pagesize=LETTER, **kw)
        self.doc_title = doc_title
        margin = 0.85 * inch
        frame = Frame(
            margin, margin, LETTER[0] - 2 * margin, LETTER[1] - 2 * margin - 0.4 * inch,
            id="body",
        )
        self.addPageTemplates([
            PageTemplate(id="main", frames=[frame], onPage=self._draw_footer),
        ])

    def _draw_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#6a5f4f"))
        # Left: project + doc
        canvas.drawString(
            0.85 * inch, 0.5 * inch,
            f"{PROJECT} - {self.doc_title}",
        )
        # Right: page x
        canvas.drawRightString(
            LETTER[0] - 0.85 * inch, 0.5 * inch,
            f"Page {doc.page}",
        )
        canvas.restoreState()


# ---------- heading wrapper that registers in the TOC ----------

class TocDoc(FooteredDoc):
    """Subclass for the methodology paper. Captures h1/h2 paragraphs into a TOC."""

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            text = flowable.getPlainText()
            style = flowable.style.name
            if style == "h1":
                self.notify("TOCEntry", (0, text, self.page))
            elif style == "h2":
                self.notify("TOCEntry", (1, text, self.page))


# ---------- helpers ----------

def title_page(s, doc_title, subtitle):
    """Returns flowables for a title page."""
    fl = []
    fl.append(Spacer(1, 1.5 * inch))
    fl.append(Paragraph(PROJECT, s["meta"]))
    fl.append(Spacer(1, 0.15 * inch))
    fl.append(Paragraph(doc_title, s["title"]))
    fl.append(Paragraph(subtitle, s["subtitle"]))
    fl.append(Spacer(1, 0.5 * inch))
    fl.append(Paragraph(f"<b>Author</b>  {AUTHOR}", s["meta"]))
    fl.append(Paragraph(f"<b>Date</b>  {DOC_DATE}", s["meta"]))
    fl.append(Paragraph(f"<b>Deployment</b>  {URL}", s["meta"]))
    fl.append(Paragraph(f"<b>Repository</b>  {REPO}", s["meta"]))
    fl.append(PageBreak())
    return fl


def bullets(s, items):
    fl = []
    for item in items:
        fl.append(Paragraph(item, s["bullet"], bulletText="•"))
    return fl


def section(s, heading, body_paragraphs, level=1):
    style_key = "h1" if level == 1 else "h2"
    fl = [Paragraph(heading, s[style_key])]
    for p in body_paragraphs:
        if isinstance(p, str):
            fl.append(Paragraph(p, s["body"]))
        else:
            fl.append(p)
    return fl


def small_table(s, data, col_widths=None):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("FONT", (0, 0), (-1, -1), "Helvetica", 9),
        ("FONT", (0, 0), (-1, 0), "Helvetica-Bold", 9),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f5f0e6")),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1b1714")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cdbfa8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


# ============================================================
#  Document 1: PRD.pdf
# ============================================================

def build_prd():
    s = make_styles()
    out = os.path.join(DOCS, "PRD.pdf")
    doc = FooteredDoc(out, doc_title="Product Requirements Document")
    fl = []

    # ----- title page -----
    fl.extend(title_page(
        s, "Product Requirements", "An open-source, AI-assisted creative analytics tool for performance marketers"
    ))

    # 1. Problem statement
    fl.extend(section(s, "1. Problem statement", [
        "Performance marketers running paid campaigns on Meta and Google generate dozens to hundreds of creative variants per quarter. The platforms report metrics at the creative level (impressions, clicks, spend, conversions, revenue) but offer no structured analysis of <i>why</i> certain creatives outperform others. Practitioners fall back on manual eyeballing, ad-hoc spreadsheets, or inconsistent tagging conventions that decay over time.",
        "The result is decision-making by anecdote. A marketer might believe \"warm colours work for our brand\" because the last hero ad happened to feature them, when the real driver was an unrelated copy hook. Without structured variable extraction and a sample-size-aware comparison, post-campaign learnings are unreliable and rarely transfer to the next brief.",
        "Existing platforms address fragments of this problem. Motion (motionapp.com) and Benly (benly.ai) are well-resourced paid SaaS tools doing AI-assisted creative analysis at scale. Agency tools tag creatives manually (expensive and inconsistent). MMM software focuses on channel-level rather than creative-level signal. Generic LLM image taggers extract free-text descriptions that cannot be grouped or compared. There is no open-source tool in this category that closes the loop from image to structured variable to performance to ranked insight in a single workflow.",
    ]))

    # 2. Why this exists
    fl.extend(section(s, "2. Why this exists", [
        "This project is open source (MIT) and built in public. Primary motivation is learning - the author is a performance marketer building with AI to understand the full pipeline end-to-end (vision extraction, matching, statistics, dashboards). Secondary motivation is that no open-source equivalent exists in this category; if the tool earns the right to be used, anyone can clone it and run their own instance with their own API keys.",
        "This shapes a few things in the rest of this document:",
    ]))
    fl.extend(bullets(s, [
        "Feedback and methodology critique are explicit asks, not aspirational extras. The methodology document is a public invitation for review.",
        "Real anonymised datasets are needed to validate the production OLS backend. Anyone willing to share is the canonical contributor.",
        "Productisation is not a goal. If the tool turns into something multiple people want to use commercially, that becomes a fork question, not a roadmap item for this repo.",
    ]))

    # 3. Target user
    fl.extend(section(s, "3. Target user", [
        "<b>Primary persona</b> - in-house performance marketers at consumer brands managing GBP 50,000-plus monthly paid spend on Meta and Google, with 50-plus creative variants per quarter. Comfortable in ad platform dashboards but not in Python or R. They want to know which creative patterns to brief next, supported by evidence stronger than gut feel.",
        "<b>Secondary persona</b> - agency planners running paid media for several mid-sized clients. Same problem shape, larger total dataset, less continuity between campaigns.",
        "<b>Lighthouse case</b> - a high-volume DTC advertiser running approximately GBP 150,000 per month in spend across roughly 200 creatives. This scale is the canonical Pro-mode case: enough data for proper modelling, technical enough to read coefficients and p-values.",
        "Because the tool is open source and self-hosted, the operator and the person who deploys it are the same. This shapes the trust model (no auth needed, UUID access is sufficient) and the feedback loop (operators running the tool are the natural source of bug reports and contribution).",
        "<b>Open question, not yet resolved.</b> The primary persona description (\"not Python or R\") sits in tension with the Pro mode UI, which references coefficients and p-values inline. Resolution depends on first real-user testing: if the operator reads coefficients comfortably, the persona description is wrong and gets updated; if they do not, the Pro UI needs plain-English translation. Both paths are designed; the decision waits for evidence.",
    ]))

    # 4. Value proposition / differentiation
    fl.extend(section(s, "4. Value proposition and differentiation", [
        "<b>What is commodity.</b> Vision-based extraction of structured variables from images is now a near-commodity capability available through any major LLM provider with tool-use. The tool depends on this commodity (Claude Haiku 4.5 with forced tool_use) but does not claim it as differentiation.",
        "<b>What is differentiated.</b>",
    ]))
    fl.extend(bullets(s, [
        "<b>Open source and self-hostable.</b> Marketers and analysts run their own instance, BYO API keys, own their data and costs end-to-end. The methodology is in the open and the code is in the open. Motion and Benly are paid closed SaaS; there is no equivalent open-source tool in the category. The structural differentiator is open vs closed.",
        "<b>Schema rigour.</b> A fixed set of 24 universal variables (format, visual, colour, text, brand, CTA, strategy) plus 4-6 category-specific variables drawn from one of ten brand-vertical templates. Variables are typed (boolean, enum, integer, string) so they can be grouped, compared, and regressed. The schema is project-versioned: a re-run extracts under the same definitions.",
        "<b>Lite vs Pro methodology split.</b> Two analysis paths gated on dataset size. Under 100 creatives runs descriptive group-by analysis with explicit sample-size confidence labels and bootstrap 95% confidence intervals on every delta. At 100-plus creatives, the tool surfaces multiple-regression outputs (coefficients, p-values, interaction matrices) with Benjamini-Hochberg FDR correction on exploratory variables. The split is honest about what each path can and cannot infer. Closed competitors in the category do not surface this distinction.",
        "<b>Pre-registration of hypothesis variables.</b> Before running the analysis, the operator can pre-register which variables they expect to matter. The dashboard separates pre-registered findings (treated as confirmatory) from exploratory findings (treated as hypothesis-generating). This closes a common pitfall where every observed delta looks like a finding.",
        "<b>Trust score (floor-gated).</b> A composite 0-100 quality indicator shown above every dashboard, combining five sub-scores: creative count, impression volume, mapping quality, data completeness, and bucket balance. The first three act as floors; the composite cannot exceed the worst of them. Closes the failure mode where a low mapping rate could be averaged into a misleadingly \"Good\" score. Marketers see the ceiling on how seriously to take the numbers before they read them.",
        "<b>Planned personal-knowledge-base layer.</b> The brand context passed into extraction (brand, category, KPI, audience, campaign goal) is the seed for a markdown-based knowledge store the operator maintains over time. Repeated campaigns inherit context rather than starting from zero.",
    ]))

    # 5. Scope
    fl.extend(section(s, "5. Scope (v1)", [
        "<b>In scope.</b>",
    ]))
    fl.extend(bullets(s, [
        "Static image creatives (PNG or JPEG), one file per variant.",
        "CSV exports from Meta Ads Manager and Google Ads. Auto-detected column mapping for the standard headers; the upload module accepts variants on filename, ad_id, ad_name, impressions, clicks, spend, conversions, revenue, date, campaign, ad set, platform, placement.",
        "Six-method matching cascade linking creatives to performance rows (exact, normalised, embedded platform ID, prefix, contains, fuzzy Levenshtein).",
        "Structured variable extraction via Claude Haiku 4.5 with tool_use forcing.",
        "Group-by analysis for any chosen metric (CTR, CPC, CPA, CVR, ROAS).",
        "Bootstrap 95% confidence intervals on every Lite delta, displayed as error bars and numeric ranges.",
        "\"Patterns to investigate\" framing for exploratory findings, with noise-adjusted ranking (<font face=\"Courier\">|delta| * sqrt(n)</font>) on both the insights panel and the variable performance table.",
        "Pre-registration of hypothesis variables (database-backed, real app + demo).",
        "Snapshot data layer: re-uploaded CSVs are preserved as historical snapshots; dashboard filters to the latest by default with a \"Showing snapshot N of M\" indicator.",
        "Dashboard with trust score, key metrics, variable explorer, sortable performance table, ranked creative gallery, and an insights panel.",
        "CSV exports of variables, performance, and a combined view.",
        "Interactive demo with sample data so portfolio visitors and prospective contributors can explore without API budget exposure.",
    ]))
    fl.extend([
        Paragraph("<b>Out of scope (v1).</b>", s["body"]),
    ])
    fl.extend(bullets(s, [
        "Video and dynamic creatives.",
        "Real-time platform API integrations (Meta or Google); CSV uploads only.",
        "Multi-user collaboration, comments, or shared workspaces.",
        "Authentication and authorisation. UUID-based access is the design for self-host single-operator use.",
        "Causal claims. The tool is correlational by design and labels outputs as directional hypotheses.",
    ]))

    # 6. Lite vs Pro
    fl.extend(section(s, "6. Lite vs Pro", [
        "The application splits its dashboard on a hard threshold of 100 creatives. The threshold is set in <font face=\"Courier\">src/app/api/dashboard/route.ts</font> and is justified as the conservative floor for an OLS model with roughly 25 predictors (rule of thumb: 5-10 observations per predictor).",
    ]))
    fl.append(small_table(s, [
        ["Aspect", "Lite (under 100)", "Pro (100 or more)"],
        ["Primary user", "Solo marketer, small ad set, founder", "In-house growth team, agency planner"],
        ["Statistical method", "Group-by descriptive with bootstrap 95% CI", "Group-by + multiple regression with FDR correction"],
        ["Visualisations", "Bar chart", "Bar, scatter, regression, distribution, heatmap"],
        ["Mapping UI", "Flat confirmed table", "Match cards with confidence and method badges; suggested and unmatched panels"],
        ["Variables UI", "Toggle list", "Four-tier: Universal, Category, AI suggestions, Custom builder"],
        ["Multiple-comparison control", "None on Lite deltas (descriptive); CI shows variance", "Benjamini-Hochberg FDR on exploratory regression variables"],
        ["Stability indicator", "n/a", "Green/yellow/red traffic light for N/predictor ratio"],
        ["Insights tone", "Plain English; \"Patterns to investigate\" framing", "Coefficient and p-value referenced inline"],
    ], col_widths=[1.4 * inch, 2.4 * inch, 2.7 * inch]))
    fl.append(Spacer(1, 8))
    fl.append(Paragraph(
        "Implementation note. The Pro UI ships in the interactive demo with mocked statistics so the experience is portfolio-visible and contribution-evaluable. The production regression backend is designed in the methodology document but is not yet wired - it will be built against the first real 100-plus creative dataset rather than synthesised in advance.",
        s["callout"],
    ))

    # 7. Key features
    fl.extend(section(s, "7. Key features (shipped)", [
        "Nine-step wizard: Home, Setup, Instructions, Upload, Mapping, Variables, Analysis, Dashboard, Settings.",
    ]))
    fl.extend(bullets(s, [
        "Image upload to Supabase Storage with PNG/JPEG validation and a 10 MB cap per file (client-enforced).",
        "CSV parser (PapaParse) with auto-detected column mapping across Meta and Google export conventions; 40-plus column-name aliases handled automatically. All-zero metric rows are filtered server-side with a skip count returned to the client.",
        "Six-method matching cascade with confidence scoring per match and a manual override flow for the unmatched.",
        "Variable schema builder: 24 universal definitions, 10 category templates, custom variables in Pro.",
        "Streaming AI extraction over Node.js runtime via NDJSON (Edge runtime is incompatible with the Anthropic SDK). Each per-image call is retried on transient failures (2 attempts, exponential backoff) inside a 5-worker concurrency pool. Concurrent runs on the same project are blocked with a 409; stuck runs auto-fail after 15 minutes.",
        "Live cost tracking per image, priced at the Haiku 4.5 rate of USD 0.80 per million input tokens and USD 4.00 per million output tokens.",
        "Dashboard: metric switcher, trust score gauge (5 sub-scores, floor-gated), variable explorer (bar in Lite; bar plus four more chart types in Pro), sortable variable performance table, ranked creative gallery, insights panel.",
        "Bootstrap 95% confidence intervals on every Lite delta. The bootstrap PRNG is seeded for deterministic tests; production uses non-seeded Math.random().",
        "Pre-registration of hypothesis variables, with the dashboard separating confirmatory from exploratory findings.",
        "Snapshot data layer: historical CSV uploads preserved; latest snapshot selected for display by default.",
        "Model stability indicator in Pro mode (green/yellow/red traffic light for N/predictor ratio).",
        "\"Patterns to investigate\" framing on exploratory findings, with noise-adjusted ranking.",
        "Three CSV exports: variables, performance, and a combined view.",
        "Project delete with cascade across all nine database tables and the storage bucket.",
        "Comprehensive instructions page with Meta and Google export step-by-step guides, sample CSV previews, common pitfalls, and a pre-upload checklist.",
        "CI workflow gating every PR (TypeScript, ESLint, Vitest test suite, Next.js build).",
    ]))

    # 8. Success criteria
    fl.extend(section(s, "8. Success criteria", [
        "<b>Functional.</b> A user starting with a folder of 50 creative images and a fresh Meta CSV export can complete the full pipeline (setup through dashboard) in under 10 minutes. The trust score reaches Good or better. At least three variable-value pairs return a delta with at least Medium confidence and a bootstrap CI that does not cross zero.",
        "<b>Decision quality.</b> The output passes the \"would a marketer change their next brief?\" test - the ranked insights surface at least one pattern the user did not already know, or refute one they wrongly believed.",
        "<b>Trust.</b> The user can articulate, after reading the dashboard, both what the data shows and what it does not show. Sample-size labels, the regression-unlock indicator, the trust score, and the pre-registered-vs-exploratory split together make the limits legible.",
        "<b>Public iteration.</b> At least one external reviewer engages substantively with the methodology document or the limitations document and either confirms the approach or surfaces a real gap. At least one external operator clones the repo and reports back on the experience (positive or negative). These are the validation events that the project actually needs.",
    ]))

    # 9. Non-goals
    fl.extend(section(s, "9. Non-goals", [
        "These are deliberate omissions, not future work.",
    ]))
    fl.extend(bullets(s, [
        "<b>No causal claims.</b> Group-by deltas are descriptive. Regression coefficients (when shipped) are conditional associations. The tool produces hypotheses, not causes.",
        "<b>No real-time platform integration.</b> CSV uploads are the contract. Real-time APIs change too often and require credential management out of scope.",
        "<b>No multi-user collaboration.</b> Designed for a single operator. Shared workspaces, comments, audit trails, and role-based access are a separate product surface; a fork can add them.",
        "<b>No video creatives.</b> Frame extraction, motion tagging, and audio variables are a different problem.",
        "<b>No machine learning beyond OLS in v1.</b> Outputs stay in the regime where they are interpretable line by line. Random forests, gradient boosting, and Bayesian regression are listed as future extensions only.",
        "<b>No authentication.</b> UUID-based access is the design, not a stopgap. The deployment model is single-operator self-host; multi-tenant deployments are out of scope for this codebase and would be a fork.",
    ]))

    # 10. Future direction
    fl.extend(section(s, "10. Future direction (post-v1)", [
        "<b>Production regression backend.</b> Move the mocked Pro statistics out of <font face=\"Courier\">demo-data.ts</font> and into a real server-side OLS pipeline. Gate on the first 100-plus creative real dataset to validate the design end-to-end before generalising. Empirical decisions on regularisation, impression weighting (count vs sqrt), and interaction-selection threshold all wait on real data.",
        "<b>AI insight narration.</b> Replace the current insights panel copy with Claude-generated explanations grounded in actual coefficients and deltas. Path depends on the persona-vs-translation decision (see section 3 open question).",
        "<b>Personal knowledge-base layer.</b> Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes get injected into extraction prompts so repeated campaigns inherit context.",
        "<b>Longitudinal / temporal analysis (v3 direction).</b> Cross-snapshot analysis: creative fatigue, seasonality, pre/post brand campaigns, platform algorithm shifts. Gated on the first real operator accumulating 3-plus snapshots over a 60-day window.",
        "<b>Video creatives (v3 or later).</b> Frame extraction, motion variables, audio extraction. Hybrid pathway with marketer-input variables for things AI cannot see (talent identity, music choice, production type).",
        "<b>Additional platforms.</b> TikTok and LinkedIn CSV formats. Demand-driven.",
        "<b>Optional advanced modelling.</b> Mixed-effects models, Bayesian regression, tree-based methods with SHAP for interpretability. Explored only if real datasets justify the complexity.",
        "<b>Multi-tenant fork (separate codebase).</b> Supabase Auth + Row Level Security scoped per user, shared workspaces, comments, audit trails. Not on this repo's roadmap; what a fork would need to add for a multi-user product. (The single-operator operational baseline - retry on transient Anthropic failures, concurrency guard, stuck-run cleanup, 10 MB image cap, CSV all-zero-row rejection - shipped in PRs #21-23 and is no longer pending.)",
    ]))

    # 11. Limitations summary
    fl.extend(section(s, "11. Limitations summary", [
        "A condensed view of what the tool cannot do or does silently differently from the user's expectations. Included so the PRD reads standalone. Full version in <font face=\"Courier\">LIMITATIONS.md</font>.",
        "<b>Methodological.</b> No hypothesis testing in Lite (descriptive only). No interaction effects in Lite. Confidence label ignores impression volume: n=3 with 300k impressions each is labelled \"low\" even though it has more statistical power than n=10 with 1k impressions each. Pro statistics in the demo are mocked. Everything is correlational.",
        "<b>Reliability.</b> Transient Anthropic API failures retry with exponential backoff (2 attempts, 1s base) inside a 5-worker concurrency pool. Simultaneous runs on the same project are blocked (409 if a run started within the last 15 minutes is still in 'running'). Stuck runs auto-fail after 15 minutes on the next dashboard load. Transitive PostCSS XSS advisory present in <font face=\"Courier\">npm audit</font> is not exploitable in this deployment (PostCSS runs only at build time, no user input reaches CSS stringification).",
        "<b>Data integrity.</b> 10 MB image cap enforced client-side in <font face=\"Courier\">src/lib/upload.ts</font>. CSV rows with all-zero metrics filtered server-side with a skipped-rows count returned to the client. Missing values are still silently excluded from each variable's group computation without a per-variable missing-count surface - open and contribution-friendly.",
        "<b>Access and security.</b> UUID-based project access: anyone with a project URL has full destructive access. This is the design for single-operator self-host. Multi-tenant deployments need a fork with proper auth.",
        "<b>Scale.</b> Vercel Hobby practical batch ceiling 150-200 creatives per run. Bootstrap CI compute not yet benchmarked under cold start at Pro scale. Bootstrap resampling is uniform, not impression-weighted (production OLS uses WLS instead).",
        "<b>Product surface.</b> No snapshot-browsing UI yet (the data layer is in place; UI deferred until first real-operator feedback shapes the design). No temporal handling for seasonality, fatigue, or algorithm shifts. Dashboard relies on colour gradients for accessibility-sensitive cues.",
    ]))

    # 12. Open questions
    fl.extend(section(s, "12. Open questions", [
        "Decisions deferred until there is evidence to resolve them.",
    ]))
    fl.extend(bullets(s, [
        "<b>Pro UI translation vs persona description correction.</b> See section 3. Resolved by first real-user test of Pro mode.",
        "<b>Paid media vs organic social.</b> Current functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema.",
        "<b>First real-data engagement.</b> How to source the first real 100-plus creative dataset for production OLS validation. Options: wait for someone to clone the repo and offer it, actively recruit performance marketers willing to share anonymised data, or simulate from public benchmarks (probably worse than waiting). Open to suggestions from anyone who has done this kind of recruitment.",
        "<b>Methodology review channel.</b> Whether to publish a short call-for-review post (LinkedIn, Substack, etc.) targeting people with applied-stats backgrounds, or rely on the README + GitHub Discussions to surface reviewers organically.",
    ]))

    # 13. How to engage
    fl.extend(section(s, "13. How to engage", [
        "This document and the underlying tool are public. Engagement is welcome on any of the following channels.",
    ]))
    fl.extend(bullets(s, [
        "Self-host or read the code - see <font face=\"Courier\">README.md</font>.",
        "Methodology critique - open a GitHub Discussion on the repo, or file an issue with the <font face=\"Courier\">methodology</font> label.",
        "Bug reports and reliability issues - GitHub issue with the <font face=\"Courier\">bug</font> label.",
        "Contribution - see <font face=\"Courier\">CONTRIBUTING.md</font>. Engineering hygiene items in the roadmap section 6.1 are all welcome.",
        "Sharing anonymised datasets for production OLS validation - open a GitHub Discussion or use GitHub's Private Vulnerability Reporting channel for anything that needs to stay confidential.",
    ]))

    doc.build(fl)
    print(f"OK  {out}")


# ============================================================
#  Document 2: methodology.pdf (with TOC)
# ============================================================

def build_methodology():
    s = make_styles()
    out = os.path.join(DOCS, "methodology.pdf")
    doc = TocDoc(out, doc_title="Methodology Paper")
    fl = []

    fl.extend(title_page(
        s, "Methodology", "Variable extraction, group-by analysis, and the planned regression path"
    ))

    # Table of contents
    fl.append(Paragraph("Contents", s["h1"]))
    toc = TableOfContents()
    toc.levelStyles = [s["toc1"], s["toc2"]]
    fl.append(toc)
    fl.append(PageBreak())

    # 1. Overview
    fl.extend(section(s, "1. Overview", [
        "The Creative Media Analyzer turns a folder of ad images plus a performance CSV into a structured comparison of which creative patterns correlate with each performance metric. The pipeline is:",
    ]))
    fl.extend(bullets(s, [
        "<b>Ingest.</b> Images uploaded to Supabase Storage, performance rows parsed from CSV with auto-detected column mapping.",
        "<b>Match.</b> Six-method cascade linking each image to a performance row (exact filename, filename minus extension, embedded platform ID, prefix, contains, fuzzy Levenshtein).",
        "<b>Extract.</b> Claude Haiku 4.5 vision call with forced tool_use produces a structured variable record per image, conforming to a project-versioned JSON schema.",
        "<b>Analyze.</b> Lite path runs descriptive group-by statistics with sample-size confidence. Pro path adds the regression layer (designed in this paper; mocked in the demo; production backend pending real-data validation).",
        "<b>Surface.</b> Dashboard with metric switcher, trust score, variable explorer, ranked creative gallery, and insights panel.",
    ]))

    # 2. Variable extraction
    fl.extend(section(s, "2. Variable extraction", [
        "<b>Schema construction.</b> The extraction API builds an Anthropic Tool object dynamically from the project's <font face=\"Courier\">variable_schemas</font> row. Each variable definition declares a name, type (boolean, enum, integer, string), an optional enum list, and a description. The Tool's input_schema is assembled at runtime and the request uses <font face=\"Courier\">tool_choice: { type: \"tool\", name: \"extract_creative_variables\" }</font> to force structured output.",
        "<b>Why tool_use.</b> Free-text image captions cannot be grouped or compared. Tool_use commits the model to a schema the rest of the pipeline can rely on. The cost is rigidity: a value outside the enum is rejected. The benefit is that the database, the matcher, the dashboard, and the future regression all share a single contract.",
        "<b>Schema design.</b> Two tiers ship today.",
    ]))
    fl.extend(bullets(s, [
        "<b>Universal variables (24).</b> Twelve boolean (product_visible, human_present, face_visible, text_overlay, logo_visible, brand_colours_used, headline_present, cta_present, offer_present, price_shown, urgency_cue, social_proof). Eight enum (creative_format, aspect_ratio, colour_palette, contrast, text_density, visual_clutter, message_angle, funnel_stage). One integer (number_of_people). Three string (primary_visual_subject, cta_text, primary_hook). Strings are extracted for completeness but excluded from analysis as high-cardinality fields.",
        "<b>Category templates (10).</b> Each loads a small set of vertical-specific variables. Ecommerce adds product_category, discount_percentage, free_shipping_mentioned, product_count, lifestyle_vs_studio, user_generated_content. SaaS adds screenshot, feature_highlighted, demo_or_free_trial, social_proof_type, persona_targeted. Comparable sets exist for fintech, food_delivery, gaming, dating, education, health_fitness, travel, real_estate. A generic fallback covers categories without a dedicated template.",
    ]))
    fl.extend(section(s, "Brand context injection", [
        "Each extraction call is prefaced with a system string assembled from the project's setup row:",
        Paragraph(
            "Brand: {brand}, Category: {category}, Platform: {platform}, KPI: {kpi}, Goal: {goal}, Audience: {audience}",
            s["mono"],
        ),
        "This is the v1 implementation of the planned knowledge-base layer. It is enough for the model to disambiguate genre signals (skincare warmth versus fintech minimalism, for instance) but does not yet learn from previous campaigns.",
    ], level=2))

    # 3. Lite methodology
    fl.extend(section(s, "3. Lite methodology (production)", [
        "All methods in this section are live in production for any dataset under 100 creatives. Source: <font face=\"Courier\">src/lib/analytics.ts</font>.",
    ]))

    fl.extend(section(s, "3.1 Method - volume-weighted aggregation", [
        "<b>Question.</b> What is the metric value for a group of creatives sharing a variable value?",
        "<b>Approach.</b> Sum raw counters across the group, then compute the metric from the sums - not an average of per-creative rates.",
    ], level=2))
    fl.append(Paragraph(
        "CTR_group = (sum(clicks) / sum(impressions)) * 100<br/>"
        "CPC_group = sum(spend) / sum(clicks)<br/>"
        "CPA_group = sum(spend) / sum(conversions)<br/>"
        "CVR_group = (sum(conversions) / sum(clicks)) * 100<br/>"
        "ROAS_group = sum(revenue) / sum(spend)",
        s["mono"],
    ))
    fl.append(Paragraph(
        "<b>Rationale.</b> A creative with 100,000 impressions and 200 clicks should not be weighted equally with one that had 500 impressions and 50 clicks. Summing raw values weights by volume implicitly. The alternative (mean of per-creative CTRs) inflates the influence of low-volume outliers.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Assumption.</b> Each creative's raw counters are correctly attributed - that the CSV row genuinely covers the period of interest and includes all relevant impressions/clicks/spend. Multi-row creatives (the same image running in three ad sets, producing three CSV rows) violate this; the current solution is documented in the instructions page rather than enforced in code.",
        s["body"],
    ))

    fl.extend(section(s, "3.2 Method - percentage delta vs overall", [
        "<b>Question.</b> Is this group's metric better or worse than the dataset average?",
        "<b>Approach.</b>",
    ], level=2))
    fl.append(Paragraph(
        "delta = ((group_metric - overall_metric) / overall_metric) * 100",
        s["mono"],
    ))
    fl.append(Paragraph(
        "<b>Rationale.</b> Marketers think in percentage uplift, not absolute differences. A +20% CTR delta is immediately interpretable; an absolute delta of 0.4 percentage points is not.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Where this breaks.</b> No standard error. A +20% delta from a group of three creatives is treated identically to a +20% delta from thirty. The confidence label (next section) is the partial mitigation; a proper standard error on the delta is regression territory.",
        s["body"],
    ))

    fl.extend(section(s, "3.3 Method - sample-size confidence labels", [
        "<b>Question.</b> How seriously should the reader take this row?",
        "<b>Approach.</b> A four-level discrete label based on group size n:",
    ], level=2))
    fl.append(small_table(s, [
        ["n", "Label", "Treatment"],
        ["less than 3", "insufficient", "Excluded from charts; shown with placeholder values in the variable table for transparency"],
        ["3-4", "low", "Treat as hypothesis only"],
        ["5-9", "medium", "Directional"],
        ["10 or more", "high", "Reliable for decision-making"],
    ], col_widths=[1.4 * inch, 1.4 * inch, 3.6 * inch]))
    fl.append(Spacer(1, 8))
    fl.append(Paragraph(
        "<b>Rationale.</b> A discrete label is more honestly read by non-statisticians than a continuous p-value. The thresholds are conservative rules of thumb rather than calibrated against a specific power calculation.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Known weakness.</b> The label ignores impression volume. Three creatives each delivering 100,000 impressions are labelled \"low\" while ten creatives each delivering 100 impressions are labelled \"high\". The former arguably has more statistical power. A future iteration may weight by impressions or move to a continuous confidence score.",
        s["body"],
    ))

    fl.extend(section(s, "3.4 Method - composite trust score", [
        "<b>Question.</b> How much should the reader trust the dashboard before reading any single number?",
        "<b>Approach.</b> A floor-gated composite of five 0-100 sub-scores, rounded to a single 0-100 dataset-level value. Three of the sub-scores are floor conditions; the other two contribute proportionally on top.",
    ], level=2))
    fl.append(small_table(s, [
        ["Sub-score", "Role", "Formula"],
        ["Creative count", "floor", "min(100, n / 50 * 100)"],
        ["Mapping quality", "floor", "confirmed_mappings / total * 100"],
        ["Data completeness", "floor", "creatives_with_impressions_and_spend / total * 100"],
        ["Volume (impressions)", "upper (0.5)", "min(100, log10(impressions) / 6 * 100)"],
        ["Bucket balance", "upper (0.5)", "(total_groups - n_under_3) / total_groups * 100"],
    ], col_widths=[1.7 * inch, 1.1 * inch, 3.5 * inch]))
    fl.append(Spacer(1, 8))
    fl.append(Paragraph(
        "floor_score = min(creative_count, mapping_quality, data_completeness)<br/>"
        "upper_score = volume_score * 0.5 + bucket_balance * 0.5<br/>"
        "trust_score = round(floor_score * (upper_score / 100))",
        s["mono"],
    ))
    fl.append(Paragraph(
        "Levels: 80-100 Excellent, 60-79 Good, 40-59 Fair, under 40 Poor.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Rationale.</b> This is a heuristic, not a statistical measure. Its job is to set the prior of trust before the user reads the per-row numbers. The floor-gating closes a failure mode the earlier weighted-average composite had: a low mapping rate could be averaged away into a misleadingly good overall score. With the floor design, the worst floor sub-score caps the headline number, and the user always sees the constraint.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Removed sub-score.</b> An earlier revision had a sixth sub-score derived from <font face=\"Courier\">extraction_results.confidence</font>. The Anthropic tool_use API does not return a self-confidence value, so that column was never populated; the sub-score was effectively constant. The column and the sub-score were both removed on 2026-05-15.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Limit of the design.</b> The score does not detect adversarial or systematically biased data. A dataset where one campaign accounts for 90% of spend can still score Excellent on every sub-score, despite being practically a single-creative analysis.",
        s["body"],
    ))

    # 4. Pro methodology
    fl.extend(section(s, "4. Pro methodology (designed; demo-only at present)", [
        "<b>Honest status.</b> The Pro dashboard ships in the interactive demo with mocked statistics. The mocked numbers are generated by <font face=\"Courier\">src/lib/demo-data.ts</font> from the actual group-by deltas plus seeded PRNG noise, so they look realistic and internally consistent across the demo, but they are not the output of a real regression. The real backend is designed below and will be built against the first 100-plus creative real dataset.",
        "<b>Why mock rather than implement upfront.</b> Decisions about regularization, interaction terms, and weighting are difficult to make in the abstract. They depend on the empirical structure of the first real dataset (multicollinearity in the predictors, fitting behavior, residual patterns). Synthesizing those choices on fake data risks shipping a model that does not survive contact with real distributions.",
    ]))

    fl.extend(section(s, "4.1 Designed model - multiple linear regression", [
        "<b>Form.</b>",
    ], level=2))
    fl.append(Paragraph(
        "Y_i = b0 + b1 * X_1i + b2 * X_2i + ... + bk * X_ki + e_i",
        s["mono"],
    ))
    fl.append(Paragraph(
        "Y is the per-creative metric (CTR, CPC, CPA, CVR, or ROAS). Predictors are the extracted variables, encoded as follows: booleans as binary dummies, enums as one-hot with one reference category dropped, integers as continuous, strings excluded.",
        s["body"],
    ))

    fl.extend(section(s, "4.2 Interaction terms", [
        "Plain main-effects regressions miss the patterns marketers most want to surface (\"does human-in-frame interact with urgency cue?\"). Three interaction families are flagged in the design:",
    ], level=2))
    fl.extend(bullets(s, [
        "Boolean times Boolean (for example human_present times urgency_cue).",
        "Boolean times Enum (for example cta_present times message_angle).",
        "Boolean times Continuous (for example human_present times number_of_people).",
    ]))
    fl.append(Paragraph(
        "Selection strategy: start main-effects-only, then add interactions among the top 5-10 main effects by t-statistic. Compare adjusted R-squared and AIC/BIC. LASSO is the fallback if predictor count blows up past 50 after dummy encoding.",
        s["body"],
    ))

    fl.extend(section(s, "4.3 Weighted least squares", [
        "Impression-weighted regression is the planned default rather than vanilla OLS. A creative with 100,000 impressions yields a CTR estimate that is roughly 10x more precise than one with 1,000 impressions. The weight is impression count or sqrt(impressions) - the choice is sensitive to outliers and will be tuned empirically on real data.",
    ], level=2))

    fl.extend(section(s, "4.4 Outputs surfaced", [
        "Mocked in the demo today and planned for the production implementation:",
    ], level=2))
    fl.extend(bullets(s, [
        "Per-coefficient: beta, standard error, t-statistic, p-value, 95% confidence interval, standardized beta, significance flag at p &lt; 0.05.",
        "Model-level: R-squared, adjusted R-squared, model F-test p-value, maximum VIF (multicollinearity check).",
        "Interaction matrices: small heatmap grids showing the metric across paired variable values, with cell counts.",
        "Insights panel: technical phrasing referencing beta and p in copy (\"face_visible shows the largest standardized coefficient on CTR, beta = +0.34, p &lt; 0.001\").",
    ]))

    fl.extend(section(s, "4.5 Client-side simple OLS (live and real)", [
        "One small piece of real regression code is live today: the scatter chart fits a single-predictor OLS line client-side using the standard normal equations. Source: <font face=\"Courier\">src/components/dashboard/charts/regression-chart.tsx</font>. It computes slope, intercept, and R-squared on the visible scatter (x = log10 impressions, y = chosen metric) and draws a fitted line plus an R-squared label. This is a visualization aid, not an inferential output. The Pro dashboard's main regression table is mocked; this single-predictor line is real.",
    ], level=2))

    # 5. Boundary
    fl.extend(section(s, "5. The Lite/Pro boundary", [
        "<b>Rule.</b> 100 creatives. Hard threshold set in <font face=\"Courier\">src/app/api/dashboard/route.ts</font>, line 237 (<font face=\"Courier\">regressionReady: creativeData.length &gt;= 100</font>).",
        "<b>Justification.</b> The rule of thumb for stable OLS estimates is 5-10 observations per predictor. With approximately 25 active candidate predictors (about 18 enabled variables after one-hot encoding adds dummies), the floor is 100. This is conservative; at the lower end (about 100 observations, about 25 predictors) regularization or interaction restraint becomes important, and standard errors widen.",
        "<b>What changes at the boundary.</b>",
    ]))
    fl.extend(bullets(s, [
        "Lite dashboard adds the regression-table panel and the interaction-matrix panel.",
        "The variable explorer gains four new chart types (scatter, regression, distribution, heatmap) beyond the bar chart.",
        "The mapping page upgrades from flat table to match cards with confidence and method badges, plus separate sections for suggested and unmatched.",
        "The variables page upgrades from a toggle list to a four-tier schema builder including AI suggestions and a custom variable form.",
        "The insights panel switches from plain-English cards to technical cards that reference coefficients and p-values inline.",
    ]))

    # 6. Limitations
    fl.extend(section(s, "6. Limitations", [
        "Mandatory section. The honest version of this tool's claims, in one place. See <font face=\"Courier\">LIMITATIONS.md</font> in the repository for a longer, code-grounded version including operational gaps.",
    ]))
    fl.extend(bullets(s, [
        "<b>No formal hypothesis testing in Lite production.</b> Lite output is descriptive. Bootstrap 95% confidence intervals are computed on every delta, but they're displayed as visual whiskers rather than fed into a significance test.",
        "<b>Limited multiple-comparison correction.</b> The Pro regression table applies Benjamini-Hochberg FDR to exploratory variables, and the Lite variable performance table now sorts exploratory rows by noise-adjusted effect size (|delta| times sqrt(n)) by default. The Lite group-by deltas themselves remain uncorrected point estimates with CIs; family-wise comparison rate is unaddressed in Lite by design.",
        "<b>No interaction effects in Lite production.</b> Each variable is analyzed independently in Lite. Pairs that matter together are invisible until Pro mode ships with real regression.",
        "<b>Confidence label ignores impression volume.</b> n=3 creatives delivering 300,000 impressions each are labelled \"low\". n=10 creatives delivering 1,000 impressions each are labelled \"high\". The former has more statistical power. On the roadmap to fix.",
        "<b>Missing values are silently excluded.</b> A creative with a null variable is dropped from that variable's group. If missingness correlates with something (for example, cta_text is null when there is no CTA), the resulting groups are biased.",
        "<b>No temporal handling.</b> All data is treated as a single cross-section. Seasonal effects, fatigue, and platform algorithm changes are unmodeled. Planned for v3 once real multi-snapshot data is available.",
        "<b>Correlation, not causation.</b> Every dashboard output is correlational. The tool is built to generate informed hypotheses for the next brief, not to prove that any variable causes performance changes.",
        "<b>Scale ceiling.</b> Streaming AI extraction over Vercel Hobby is practical up to roughly 150-200 creatives per run. Above that, batching and resumability become necessary.",
        "<b>Pro statistics in the demo are mocked.</b> The numbers in the regression table in the demo are deterministic noise added to the group-by deltas. They are designed to look right, not to be right. The methodology paper is the canonical reference for what those numbers will be once the production backend ships.",
        "<b>Bootstrap CI is not impression-weighted.</b> Resampling is uniform across creatives. A statistically rigorous volume-weighted bootstrap would resample with probability proportional to impressions. Acceptable approximation in current scope; the Pro production OLS will use WLS instead.",
    ]))

    # 7. References
    fl.extend(section(s, "7. References", [
        "<b>In-repo.</b> <font face=\"Courier\">ANALYSIS_METHODOLOGY.md</font> in the project root contains the canonical version of this paper - longer technical specification of the methods above, including detailed formulas, weighted least squares notes, and a complete trust-score breakdown. The PDF is the portfolio-facing condensation of that document.",
        "<b>External.</b> Standard OLS treatment (any econometrics textbook). Rule-of-thumb of 5-10 observations per predictor is widely cited in regression introductions; the specific threshold for this project was chosen as a conservative floor rather than derived from a power calculation.",
    ]))

    # 8. Open questions for review
    fl.extend(section(s, "8. Open questions for review", [
        "These are the genuine methodological uncertainties. Answers will shape the production OLS backend when real data arrives. If you have informed opinions on any of these, open a GitHub discussion on the repo or file an issue.",
    ]))
    fl.extend(bullets(s, [
        "<b>Sample size threshold.</b> Is 100 creatives sufficient for OLS with ~25 predictors plus interactions? Should the threshold increase, or should regularisation kick in earlier?",
        "<b>Weighting.</b> Should the tool weight by impressions (WLS) in the group-by analysis as well, not just regression? Currently all creatives are treated equally in Lite.",
        "<b>Multiple comparisons.</b> For the current group-by approach, should the tool apply a Bonferroni correction or FDR control to the delta rankings, even without formal p-values?",
        "<b>Variable selection.</b> With 24 universal plus 4-6 category variables, plus one-hot encoding, the model could have 60-plus predictors. What regularisation approach makes most sense?",
        "<b>Temporal effects.</b> If the operator uploads a new CSV each month, should the tool model time as a fixed effect or treat each upload as a separate cross-section?",
        "<b>Clustering.</b> Creatives within the same campaign or ad set may share characteristics. Clustered standard errors or a mixed-effects model?",
        "<b>Non-linear effects.</b> For integer variables like <font face=\"Courier\">number_of_people</font>, should the tool include polynomial terms or treat them as categorical?",
        "<b>Practical significance.</b> What minimum effect size (in the metric's units, e.g. +0.2% CTR) should the tool flag as \"actionable\" vs \"statistically significant but negligible\"?",
    ]))

    # First pass + multi-build for TOC
    doc.multiBuild(fl)
    print(f"OK  {out}")


# ============================================================
#  Document 3: roadmap.pdf
# ============================================================

def build_roadmap():
    s = make_styles()
    out = os.path.join(DOCS, "roadmap.pdf")
    doc = FooteredDoc(out, doc_title="Roadmap")
    fl = []

    fl.extend(title_page(
        s, "Roadmap (v2.1)", "Open-source repositioning: current state, what's shipped, what's blocked on what"
    ))

    # 1. Purpose
    fl.extend(section(s, "1. Purpose of this document", [
        "This is the single forward-looking source of truth for the project. Every item the team has discussed but deferred lives here, organised by <i>what's blocking it from shipping now</i>. The structure exists to make the answer to \"what should I work on next?\" obvious.",
        "Three companion documents remain canonical for their respective scopes:",
    ]))
    fl.extend(bullets(s, [
        "<font face=\"Courier\">methodology.pdf</font> / <font face=\"Courier\">ANALYSIS_METHODOLOGY.md</font> - how the math works",
        "<font face=\"Courier\">PRD_v2.md</font> - what the product is and for whom",
        "<font face=\"Courier\">LIMITATIONS.md</font> - honest accounting of what the tool cannot do (design choices, methodological limits, stack constraints)",
    ]))
    fl.append(Paragraph(
        "This roadmap does not duplicate them. It points to them where relevant.",
        s["body"],
    ))

    # 2. Current state
    fl.extend(section(s, "2. Current state", [
        "<b>Deployment.</b> Production at <font face=\"Courier\">media-analyzer-theta.vercel.app</font>. Root URL redirects to <font face=\"Courier\">/demo</font>. Real-app pages reachable by direct URL for the operator. Portfolio embedding via iframe from <font face=\"Courier\">portfolio-website-zeta-one-76.vercel.app/analyser</font>.",
        "<b>Architecture.</b>",
    ]))
    fl.extend(bullets(s, [
        "Next.js 16.2.6 (App Router, Turbopack) on Vercel Hobby",
        "TypeScript 5.9.3, React 19.2.6, Tailwind 4",
        "Supabase Postgres (eu-west-2) with 9 tables and a creatives storage bucket",
        "Claude Haiku 4.5 (<font face=\"Courier\">claude-haiku-4-5-20251001</font>) via Anthropic SDK with forced tool_use",
        "Streaming NDJSON over Node.js runtime",
        "GitHub Actions CI gating every PR to main (tsc, eslint, next build)",
    ]))
    fl.append(Paragraph(
        "<b>Codebase health (as of this writing).</b> TypeScript clean. ESLint clean (zero errors, zero warnings). All findings from feature audit and code hygiene audit either shipped or deliberately deferred with documentation. CI workflow gating against regressions.",
        s["body"],
    ))

    # 3. What's now shipped
    fl.extend(section(s, "3. What's now shipped (post-v1)", [
        "Items that landed since the roadmap v1 was written, in rough chronological order.",
        "<b>Review fixes (REVIEW_FIXES.md, six items).</b>",
    ]))
    fl.extend(bullets(s, [
        "Fix 1 - Model stability indicator (green/yellow/red traffic light for N/predictor ratio in Pro mode)",
        "Fix 3 - Pre-registration of hypothesis variables (database-backed, real app + demo)",
        "Fix 4 - Gated trust score (floor sub-scores cannot be averaged into a misleadingly good composite); since reduced to 5 sub-scores after <font face=\"Courier\">confidence</font> column was dropped",
        "Fix 5 - \"Patterns to investigate\" framing replaces \"Top findings\"; noise-adjusted ranking on both insights panel and variable performance table",
        "Fix 6 - Bootstrap 95% confidence intervals on every Lite delta, displayed as error bars and numeric ranges",
        "Fix 2 - Deferred pending user test (see section 6.2)",
    ]))
    fl.append(Paragraph("<b>Post-audit work.</b>", s["body"]))
    fl.extend(bullets(s, [
        "Snapshot data layer: dashboard filters by <font face=\"Courier\">is_latest = true</font>, upload route flips flags correctly, re-uploads handled without mixing data",
        "\"Showing snapshot N of M\" indicator on dashboard",
        "Trust score formula updated in methodology paper and <font face=\"Courier\">ANALYSIS_METHODOLOGY.md</font> to match shipped code",
        "<font face=\"Courier\">LIMITATIONS.md</font> expanded with audit-surfaced operational gaps",
        "Confidence column investigation documented in <font face=\"Courier\">POST_AUDIT_COMPLETION.md</font> appendix; column subsequently dropped in PR #16",
    ]))
    fl.append(Paragraph(
        "<b>Audit cycle 1 (feature/correctness).</b> Two reviews - external (chat-based, documentation-only) and internal (Claude Code, code-grounded). Findings consolidated in <font face=\"Courier\">AUDIT_FINDINGS.md</font> and addressed via <font face=\"Courier\">POST_AUDIT_INSTRUCTIONS.md</font>.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Audit cycle 2 (code hygiene).</b> First hygiene audit. Findings in <font face=\"Courier\">CODE_HYGIENE_FINDINGS_2026-05-15.md</font>. Cleanup PRs:",
        s["body"],
    ))
    fl.extend(bullets(s, [
        "PR #16: app-shell deletion, README model name, <font face=\"Courier\">notes</font> column drop, unused exports, magic-number extraction, env-var assertion fix, eslint config - 8 findings addressed",
        "PR #17: React 19 effect refactor (<font face=\"Courier\">useSyncExternalStore</font> for localStorage contexts), patch bumps, Prettier toolchain, editor config, GitHub Actions CI workflow - 5 findings addressed",
    ]))
    fl.append(Paragraph(
        "<b>Open-source repositioning</b> (PR #20). LICENSE (MIT), README, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT files. <font face=\"Courier\">.env.example</font>, <font face=\"Courier\">docs/self-hosting.md</font>, schema export. Deploy-to-Vercel button. PRD, LIMITATIONS, Methodology, and this roadmap reframed for open-source / public-iteration posture. Build journey audit files moved to <font face=\"Courier\">docs/build-journey/</font>.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Audit cycle 3 (post-repositioning self-audit, PRs #21-23).</b> Comprehensive review against the open-source repo state; fixes shipped without waiting for real test data.",
        s["body"],
    ))
    fl.extend(bullets(s, [
        "PR #21: Anthropic model ID correction, Supabase storage dedup, auth warning fix, initial Vitest suite - 4 findings",
        "PR #22: <font face=\"Courier\">withRetry</font> (2 attempts, exponential backoff) and <font face=\"Courier\">pMap</font> concurrency pool (5 workers default, configurable via <font face=\"Courier\">ANALYSIS_CONCURRENCY</font>) on the Anthropic extraction path; streaming handler wrapped in try-catch-finally with a <font face=\"Courier\">stream_error</font> event; CSV row cap (<font face=\"Courier\">MAX_ROWS = 10_000</font>, returns 413); concurrency guard on <font face=\"Courier\">/api/analysis</font> POST (409 if an active run within the last 15 min exists); auto-cleanup of runs stuck in <font face=\"Courier\">running</font> for more than 15 min on dashboard load; dashboard metric query-param validation; stale-closure fix in <font face=\"Courier\">analysis/page.tsx</font>; <font face=\"Courier\">npm test</font> step added to CI workflow; module-scope pricing constants; <font face=\"Courier\">.env.example</font> extended with optional <font face=\"Courier\">ANALYSIS_MODEL</font> and <font face=\"Courier\">ANALYSIS_CONCURRENCY</font> - 9 fixes",
        "PR #23: xorshift32 PRNG extracted to shared <font face=\"Courier\">src/lib/rng.ts</font> and threaded as optional <font face=\"Courier\">seed</font> through bootstrap CIs (deterministic tests; production unchanged); 10 MB image upload cap enforced in <font face=\"Courier\">src/lib/upload.ts</font>; all-zero-metric CSV rows filtered server-side with <font face=\"Courier\">skippedRows</font> count in the response; <font face=\"Courier\">LIMITATIONS.md</font> updated to mark 4 more items as resolved - 4 fixes",
    ]))

    # 4. Build journey
    fl.extend(section(s, "4. Build journey (preserved from v1)", [
        "This section is historical and unchanged from the v1 roadmap. It documents how the project was built, not where it's going. The forward-looking content is in sections 5 onward.",
    ]))
    fl.extend(bullets(s, [
        "<b>Streamlit prototype (April 22-23, 2026).</b> Five commits. Single-page Streamlit app proving Claude vision with tool_use could replace manual creative tagging. Preserved in <font face=\"Courier\">legacy/</font> as reference.",
        "<b>Next.js shell and Supabase foundation (May 11).</b> Pivot to Next.js 16 App Router with sidebar-based nine-step stepper. Supabase project, nine-table schema with snapshot model on <font face=\"Courier\">performance_rows</font>.",
        "<b>Wizard steps 1-8 (May 11-12).</b> Eight PRs in roughly 24 hours, one per step.",
        "<b>Interactive demo (May 13).</b> <font face=\"Courier\">/demo</font> route with deterministically-generated fake creatives, componentized dashboard, Pro/Lite mode split, inline SVG chart types.",
        "<b>Access control lockdown (May 13).</b> Root redirects to demo; real-app pages reachable by direct URL only.",
        "<b>Portfolio documentation set (May 13).</b> PRD, methodology, roadmap PDFs written and embedded on portfolio site.",
        "<b>Review and audit cycles (May 14-16).</b> Two audits, six review fixes, two cleanup PRs. State documented in this roadmap.",
    ]))

    # 5. What's next overview
    fl.extend(section(s, "5. What's next - overview", [
        "Pending work falls into four categories distinguished by <i>what's blocking it</i>. The categories matter because they imply different conditions for unblocking:",
    ]))
    fl.extend(bullets(s, [
        "<b>Engineering hygiene</b> - ship when convenient. No external dependency.",
        "<b>Waiting for the first real user</b> - gated on a real performance marketer using the tool and providing feedback.",
        "<b>Waiting for real data at scale</b> - gated on the first 100-plus creative real dataset arriving.",
        "<b>Multi-tenant fork territory</b> - only matters if someone takes the codebase beyond single-operator self-host into a multi-user product. Documented for completeness; none of these ship on this repo.",
    ]))
    fl.append(Paragraph(
        "A documentation maintenance task is also pending and is described at the end.",
        s["body"],
    ))

    # 6.1 Engineering hygiene
    fl.extend(section(s, "6.1 Engineering hygiene (ship when convenient)", [
        "No external dependency. These are quality-of-life improvements the team can tackle whenever there's time.",
        "<b>Major package bumps.</b> Three packages are multiple major versions behind:",
    ], level=2))
    fl.extend(bullets(s, [
        "<font face=\"Courier\">@types/node</font> 20 - 25 (Node 22 LTS now widespread)",
        "<font face=\"Courier\">eslint</font> 9 - 10",
        "<font face=\"Courier\">typescript</font> 5 - 6",
    ]))
    fl.append(Paragraph(
        "Each needs its own scoped PR with breaking-change review. Do not batch.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Mass Prettier reformat.</b> Prettier toolchain is installed (PR #17) but the codebase hasn't been reformatted. Running <font face=\"Courier\">npm run format</font> will produce a large diff. Worth doing as a standalone PR with no other changes mixed in.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>React 19 rule semantics follow-up.</b> The <font face=\"Courier\">react-hooks/set-state-in-effect</font> rule is new in React 19. Several <font face=\"Courier\">eslint-disable-next-line</font> comments were added in PR #17 where the effect pattern was correct but the rule could not detect that. When the rule stabilizes, revisit those sites.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>M3 empty catch blocks.</b> Five <font face=\"Courier\">try { ... } catch (e) {}</font> blocks across <font face=\"Courier\">analysis/page.tsx</font>, <font face=\"Courier\">settings/page.tsx</font>, and <font face=\"Courier\">variables/page.tsx</font>. All have inline comments documenting the silent-fail pattern as intentional. Not a finding to fix; flagged here only so future audits know they've been considered.",
        s["body"],
    ))

    # 6.2 First real user
    fl.extend(section(s, "6.2 Waiting for the first real user", [
        "These items are gated on a real operator using the tool with a real dataset at scale. Building them on assumptions before that conversation risks shipping the wrong design.",
    ], level=2))
    fl.extend(bullets(s, [
        "<b>Full snapshot UI.</b> Data-layer shipped; UI deferred. When real, the user will have re-uploaded CSVs and will want to see history. The minimum extension is a \"Recent uploads\" list on the settings page. Bigger extensions - switching the current snapshot, comparing two snapshots, deleting old ones - depend on what the user actually asks for.",
        "<b>Pro UI translation OR persona description correction.</b> Persona in PRD says \"comfortable in ad platforms but not Python or R.\" Pro insights panel references coefficients and p-values inline. The user-test conversation resolves this: if they read coefficients comfortably, the persona description is wrong (update PRD); if they don't, the Pro UI needs plain-English translation.",
        "<b>AI insights narration design.</b> Depends on the outcome above. If translation is the path, this is where the narration patterns get implemented.",
        "<b>Bootstrap CI performance benchmark.</b> Bootstrap is computationally trivial on Lite-scale datasets but has not been measured on a real 120-plus creative dataset on Vercel Hobby. Benchmark with real data when available.",
    ]))

    # 6.3 Real data at scale
    fl.extend(section(s, "6.3 Waiting for real data at scale", [
        "These items are gated on the first 100-plus creative real dataset arriving. Methodological choices depend on the empirical structure of real ad-performance data, not synthesized data.",
    ], level=2))
    fl.extend(bullets(s, [
        "<b>Production OLS backend.</b> Pro coefficient table remains mocked. Real backend builds against the first real dataset, with empirical decisions on regularization, impression weighting (count vs sqrt), and interaction selection threshold.",
        "<b>Personal knowledge-base layer.</b> Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes get injected into extraction prompts so repeated campaigns inherit context. Designing this well needs to see what real campaign continuity looks like.",
        "<b>Longitudinal / temporal analysis (v3 direction).</b> Cross-snapshot analysis - creative fatigue, seasonality, pre/post brand campaigns, platform algorithm shifts. Gated on the first real user accumulating 3-plus snapshots over a 60-day window.",
    ]))

    # 6.4 Multi-tenant fork territory
    fl.extend(section(s, "6.4 Multi-tenant fork territory", [
        "These only matter if someone wants to take the codebase beyond single-operator self-host into a multi-user product. Documented for completeness; none of these ship on this repo. If you fork to build a multi-tenant version, this is what you'd need to add.",
    ], level=2))
    fl.extend(bullets(s, [
        "<b>Authentication and authorisation.</b> Currently UUID-based access. Anyone with a project URL has full destructive permissions. A multi-tenant version needs proper auth (Supabase Auth, RLS policies, role-based permissions).",
        "<b>Multi-user collaboration.</b> Shared workspaces, comments, audit trails, role-based access.",
        "<b>Video creatives.</b> Frame extraction, motion variables, audio extraction. Hybrid pathway with marketer-input variables for things AI cannot see (talent identity, music choice, production type). Probably v3 or later if anyone tackles it.",
        "<b>Real-time platform API integration.</b> Replaces CSV uploads with direct Meta/Google API integration. Requires credential management beyond current scope.",
        "<b>Advanced modelling.</b> Mixed-effects models for campaign-nested data. Bayesian regression for small-sample uncertainty. Tree-based methods (random forests, gradient boosting) with SHAP for interpretability. Only worth building if real data justifies the complexity.",
        "<b>Operational hardening.</b> The single-operator baseline (retry on transient Anthropic failures, concurrency guard, stuck-run cleanup, 10 MB image cap, CSV all-zero-row rejection) shipped in PRs #21-23 - see section 3. What remains here is the multi-tenant baseline: per-tenant rate limits, request quotas, audit logging of extraction runs, billing-grade cost telemetry per project, and tenant-scoped concurrency pools rather than the current process-global pool.",
        "<b>Resumable extraction.</b> Current practical batch ceiling is ~150-200 creatives per run on Vercel Hobby. Batching and resumable runs become necessary above that.",
        "<b>Accessibility audit.</b> Current dashboard relies on colour heavily (traffic-light indicators, sub-score bars). A multi-tenant product for diverse audiences needs a proper accessibility pass. Worth doing on this repo too if anyone wants to contribute it; the colour-only cues are a real issue regardless of tenancy.",
    ]))

    # 7. Documentation maintenance
    fl.extend(section(s, "7. Documentation maintenance", [
        "<b>Regenerate the PDFs.</b> The methodology, PRD, and roadmap markdown sources have been updated multiple times across the recent work cycles. The script <font face=\"Courier\">scripts/build_portfolio_docs.py</font> regenerates them. Run after any source markdown change that affects published content. This document (roadmap v2.1) is the latest run.",
    ]))

    # 8. Canonical references
    fl.extend(section(s, "8. Pointers to canonical references", [
        "For specific topics, the source-of-truth document is:",
    ]))
    fl.extend(bullets(s, [
        "<b>What the tool does</b> - <font face=\"Courier\">PRD_v2.md</font>",
        "<b>How the math works</b> - <font face=\"Courier\">methodology.pdf</font> / <font face=\"Courier\">ANALYSIS_METHODOLOGY.md</font>",
        "<b>What the tool can't do</b> - <font face=\"Courier\">LIMITATIONS.md</font>",
        "<b>How to self-host</b> - <font face=\"Courier\">docs/self-hosting.md</font>",
        "<b>How to contribute</b> - <font face=\"Courier\">CONTRIBUTING.md</font>",
        "<b>How fixes were specified</b> - <font face=\"Courier\">docs/build-journey/REVIEW_FIXES.md</font>",
        "<b>Findings from feature audit</b> - <font face=\"Courier\">docs/build-journey/AUDIT_FINDINGS.md</font>",
        "<b>Post-audit work performed</b> - <font face=\"Courier\">docs/build-journey/POST_AUDIT_COMPLETION.md</font>",
        "<b>Confidence column investigation</b> - <font face=\"Courier\">docs/build-journey/POST_AUDIT_COMPLETION.md</font> (appendix)",
        "<b>Findings from code hygiene audit</b> - <font face=\"Courier\">docs/build-journey/CODE_HYGIENE_FINDINGS_YYYY-MM-DD.md</font> (latest dated file)",
        "<b>How to run audits</b> - <font face=\"Courier\">docs/build-journey/AUDIT_INSTRUCTIONS.md</font>, <font face=\"Courier\">docs/build-journey/CODE_HYGIENE_AUDIT.md</font>",
        "<b>Original build journey</b> - section 4 above",
    ]))

    # 9. Open strategic questions
    fl.extend(section(s, "9. Open strategic questions", [
        "Decisions deferred until there is evidence to resolve them, not until \"later.\" Listed so future-Theo (and any contributor reading) does not forget they are open.",
    ]))
    fl.extend(bullets(s, [
        "<b>First real-data engagement.</b> How to source the first real 100-plus creative dataset for production OLS validation. Options: wait for someone to clone the repo and offer it, actively recruit performance marketers willing to share anonymised data, or simulate from public benchmarks (probably worse than waiting). Open to suggestions.",
        "<b>Methodology review channel.</b> Whether to publish a short call-for-review post targeting people with applied-stats backgrounds, or rely on the README + GitHub Discussions to surface reviewers organically.",
        "<b>Paid media vs organic social.</b> Current functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema. Both remain open.",
        "<b>Hybrid manual-input variables for video and image.</b> Custom variables exist but route through Claude vision. A future architecture extension would let users mark a variable as human-tagged (filled in by the marketer rather than extracted by AI). Useful for video where vision extraction is unreliable, and for image variables AI cannot see (talent identity, designer, internal A/B labels). Not committed.",
    ]))

    # 10. Questions seeking input
    fl.extend(section(s, "10. Questions seeking input", [
        "Items where feedback from anyone reading the doc would help.",
    ]))
    fl.extend(bullets(s, [
        "<b>Personal knowledge-base layer.</b> Preferred scope and timing relative to production regression backend.",
        "<b>Pro vs Lite naming.</b> Whether the split should keep this naming if someone forks for a commercial product, or rename to something less paid-SaaS-coded.",
        "<b>Legacy folder.</b> Whether the <font face=\"Courier\">legacy/</font> folder (Streamlit prototype) should be removed before the next public-facing iteration or retained as build-journey context. Currently retained.",
        "<b>Roadmap cadence.</b> Whether to publish dated milestone posts on the portfolio site or in GitHub Discussions tracking what shipped each week. Useful for build-in-public visibility, possible time sink. Open to opinions.",
    ]))

    doc.build(fl)
    print(f"OK  {out}")


# ============================================================
#  Main
# ============================================================

if __name__ == "__main__":
    build_prd()
    build_methodology()
    build_roadmap()
