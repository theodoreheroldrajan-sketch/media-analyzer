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
DOC_DATE = "2026-05-13"
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
        s, "Product Requirements", "An AI-assisted creative analytics tool for performance marketers"
    ))

    # 1. Problem statement
    fl.extend(section(s, "1. Problem statement", [
        "Performance marketers running paid campaigns on Meta and Google generate dozens to hundreds of creative variants per quarter. The platforms report metrics at the creative level (impressions, clicks, spend, conversions, revenue) but offer no structured analysis of <i>why</i> certain creatives outperform others. Practitioners fall back on manual eyeballing, ad-hoc spreadsheets, or inconsistent tagging conventions that decay over time.",
        "The result is decision-making by anecdote. A marketer might believe \"warm colors work for our brand\" because the last hero ad happened to feature them, when the real driver was an unrelated copy hook. Without structured variable extraction and a sample-size-aware comparison, post-campaign learnings are unreliable and rarely transfer to the next brief.",
        "Existing platforms address fragments of this problem: agency tools tag creatives manually (expensive and inconsistent), MMM software focuses on channel-level rather than creative-level signal, and generic LLM image taggers extract free-text descriptions that cannot be grouped or compared. None close the loop from image to structured variable to performance to ranked insight in a single workflow.",
    ]))

    # 2. Target user
    fl.extend(section(s, "2. Target user", [
        "<b>Primary persona</b> - In-house performance marketers at consumer brands managing GBP 50,000-plus monthly paid spend on Meta and Google, with 50 or more creative variants per quarter. They are comfortable in ad platform dashboards but not in Python or R. They want to know which creative patterns to brief next, supported by evidence stronger than gut feel.",
        "<b>Secondary persona</b> - Agency planners running paid media for several mid-sized clients. Same problem shape, larger total dataset, less continuity between campaigns.",
        "<b>Lighthouse user</b> - A high-volume DTC advertiser running approximately GBP 150,000 per month in spend across roughly 200 creatives. This scale is the canonical Pro-mode case: enough data for proper modeling, technical enough to read coefficients and p-values.",
    ]))

    # 3. Value proposition / differentiation
    fl.extend(section(s, "3. Value proposition and differentiation", [
        "<b>What is commodity.</b> Vision-based extraction of structured variables from images is now a near-commodity capability available through any major LLM provider with tool-use. The tool depends on this commodity (Claude Haiku 4.5 with forced tool_use) but does not claim it as differentiation.",
        "<b>What is differentiated.</b>",
    ]))
    fl.extend(bullets(s, [
        "<b>Schema rigor.</b> A fixed set of 24 universal variables (format, visual, color, text, brand, CTA, strategy) plus 4-6 category-specific variables drawn from one of ten brand-vertical templates. Variables are typed (boolean, enum, integer, string) so they can be grouped, compared, and eventually regressed. The schema is project-versioned: a re-run extracts under the same definitions.",
        "<b>Lite versus Pro methodology split.</b> Two analysis paths gated on dataset size. Under 100 creatives runs descriptive group-by analysis with explicit sample-size confidence labels. At 100 or more creatives, the tool surfaces multiple-regression outputs (coefficients, p-values, interaction matrices). The split is honest about what each path can and cannot infer.",
        "<b>Trust score.</b> A composite 0-100 quality indicator shown above every dashboard. It blends creative count, impression volume, mapping coverage, data completeness, extraction confidence, and bucket balance. Marketers see the floor on how seriously to take the numbers before they read them.",
        "<b>Planned personal-knowledge-base layer.</b> The brand context passed into extraction (brand, category, KPI, audience, campaign goal) is the seed for a markdown-based knowledge store the operator maintains over time. Repeated campaigns inherit context rather than starting from zero.",
    ]))

    # 4. Scope
    fl.extend(section(s, "4. Scope (v1)", [
        "<b>In scope.</b>",
    ]))
    fl.extend(bullets(s, [
        "Static image creatives (PNG or JPEG), one file per variant.",
        "CSV exports from Meta Ads Manager and Google Ads. Auto-detected column mapping for the standard headers; the upload module accepts variants on filename, ad_id, ad_name, impressions, clicks, spend, conversions, revenue, date, campaign, ad set, platform, placement.",
        "Six-method matching cascade linking creatives to performance rows (exact, normalised, embedded platform ID, prefix, contains, fuzzy Levenshtein).",
        "Structured variable extraction via Claude Haiku 4.5 with tool_use forcing.",
        "Group-by analysis for any chosen metric (CTR, CPC, CPA, CVR, ROAS).",
        "Dashboard with trust score, key metrics, variable explorer, sortable performance table, ranked creative gallery, and an insights panel.",
        "CSV exports of variables, performance, and a combined view.",
        "Interactive demo with sample data so portfolio visitors can explore without API budget exposure.",
    ]))
    fl.extend([
        Paragraph("<b>Out of scope (v1).</b>", s["body"]),
    ])
    fl.extend(bullets(s, [
        "Video and dynamic creatives.",
        "Real-time platform API integrations (Meta or Google) - CSV uploads only.",
        "Multi-user collaboration, comments, or shared workspaces.",
        "Causal claims. The tool is correlational by design and labels outputs as directional hypotheses.",
    ]))

    # 5. Lite vs Pro
    fl.extend(section(s, "5. Lite versus Pro", [
        "The application splits its dashboard on a hard threshold of 100 creatives. The threshold is set in <font face=\"Courier\">src/app/api/dashboard/route.ts</font> and is justified in the methodology paper as the conservative floor for an OLS model with roughly 25 predictors.",
    ]))
    fl.append(small_table(s, [
        ["Aspect", "Lite (under 100)", "Pro (100 or more)"],
        ["Primary user", "Solo marketer, small ad set, founder", "In-house growth team, agency planner"],
        ["Statistical method", "Group-by descriptive", "Group-by plus multiple regression"],
        ["Visualizations", "Bar chart", "Bar, scatter, regression, distribution, heatmap"],
        ["Mapping UI", "Flat confirmed table", "Match cards with confidence and method badges; suggested and unmatched sections"],
        ["Variables UI", "Toggle list", "Four-tier: Universal, Category, AI suggestions, Custom builder"],
        ["Insights tone", "Plain English", "Coefficient and p-value referenced inline"],
    ], col_widths=[1.4 * inch, 2.4 * inch, 2.7 * inch]))
    fl.append(Spacer(1, 8))
    fl.append(Paragraph(
        "Implementation note. The Pro UI ships in the interactive demo with mocked statistics so the experience is portfolio-visible. The production regression backend is designed in the methodology paper but is not yet wired - it will be built against the first real 100-plus creative dataset rather than synthesized in advance.",
        s["callout"],
    ))

    # 6. Key features
    fl.extend(section(s, "6. Key features (shipped)", [
        "Nine-step wizard: Home, Setup, Instructions, Upload, Mapping, Variables, Analysis, Dashboard, Settings.",
    ]))
    fl.extend(bullets(s, [
        "Image upload to Supabase Storage with PNG/JPEG validation and 10 MB cap per file.",
        "CSV parser (PapaParse) with auto-detected column mapping across Meta and Google export conventions.",
        "Six-method matching cascade with confidence scoring per match and a manual override flow for the unmatched.",
        "Variable schema builder: 24 universal definitions, 10 category templates, custom variables in Pro.",
        "Streaming AI extraction over Node.js runtime via NDJSON (Edge runtime is incompatible with the Anthropic SDK).",
        "Live cost tracking per image, priced at the Haiku 4.5 rate of USD 0.80 per million input tokens and USD 4.00 per million output tokens.",
        "Dashboard: metric switcher, trust score gauge, variable explorer (bar in Lite; bar plus four more chart types in Pro), sortable variable performance table, ranked creative gallery, insights panel.",
        "Three CSV exports: variables, performance, and a combined view.",
        "Project delete with cascade across all nine database tables and the storage bucket.",
        "Comprehensive instructions page with Meta and Google export step-by-step guides, sample CSV previews, common pitfalls, and a pre-upload checklist.",
    ]))

    # 7. Success criteria
    fl.extend(section(s, "7. Success criteria", [
        "<b>Functional.</b> A user starting with a folder of 50 creative images and a fresh Meta CSV export can complete the full pipeline (setup through dashboard) in under 10 minutes. The trust score reaches Good or better. At least three variable-value pairs return a delta with at least Medium confidence.",
        "<b>Decision quality.</b> The output passes the \"would a marketer change their next brief?\" test - that is, the ranked insights surface at least one pattern the user did not already know, or refute one they wrongly believed.",
        "<b>Trust.</b> The user can articulate, after reading the dashboard, both what the data shows and what it does not show. Sample-size labels, the regression-unlock indicator, and the trust score together make the limits legible.",
    ]))

    # 8. Non-goals
    fl.extend(section(s, "8. Non-goals", [
        "These are deliberate omissions, not future work.",
    ]))
    fl.extend(bullets(s, [
        "<b>No causal claims.</b> Group-by deltas are descriptive. Regression coefficients (when shipped) are conditional associations. The tool produces hypotheses, not causes.",
        "<b>No real-time platform integration.</b> CSV uploads are the contract. Real-time APIs change too often and require credential management out of scope for v1.",
        "<b>No multi-user collaboration.</b> Designed for a single operator. Shared workspaces are a separate product surface.",
        "<b>No video creatives.</b> Frame extraction, motion tagging, and audio variables are a different problem and v2 territory.",
        "<b>No machine learning beyond OLS.</b> v1 stays in the regime where outputs are interpretable line by line. Random forests and gradient boosting are listed as future extensions only.",
    ]))

    # 9. Future direction
    fl.extend(section(s, "9. Future direction (post-v1)", [
        "<b>Production regression backend.</b> Move the mocked Pro statistics out of <font face=\"Courier\">demo-data.ts</font> and into a real server-side OLS pipeline. Gate on the first 100-plus creative real dataset to validate the design end-to-end before generalizing.",
        "<b>AI insight narration.</b> Replace the current placeholder insights panel with Claude-generated explanations grounded in the actual coefficients and deltas.",
        "<b>Personal knowledge-base layer.</b> Markdown notes (Obsidian-compatible) the operator maintains per brand. The notes get injected into extraction prompts so repeated campaigns inherit context.",
        "<b>Additional platforms.</b> TikTok and LinkedIn CSV formats. Demand-driven.",
        "<b>Optional advanced modeling.</b> Mixed-effects models for campaign-nested data and Bayesian regression for small-sample uncertainty - explored only if real datasets justify them.",
    ]))

    # Appendix: confirm with Theo
    fl.extend(section(s, "Appendix: Confirm with Theo", [
        "Items not determinable from the repository code and history. To be filled in before publishing.",
    ]))
    fl.extend(bullets(s, [
        "Primary persona positioning - is the Betterhalf.ai-style customer (GBP 150,000-plus monthly spend) the explicit primary persona, or one lighthouse example within a broader target?",
        "Naming and pricing strategy for Lite versus Pro - subscription tiers, single price, internal only?",
        "Personal knowledge-base layer - intended scope (markdown-only? embedded retrieval?), and rough timeline.",
        "Strategic direction - paid-media focus only, or expand to organic and social creatives?",
        "Should the live deployment URL be promoted publicly, or kept private for portfolio sharing only?",
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
        "All methods in this section are live in production for any dataset under 100 creatives. Source: <font face=\"Courier\">src/lib/analytics.ts</font> (266 lines).",
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
        ["less than 3", "insufficient", "Row hidden from dashboard"],
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
        "<b>Approach.</b> A weighted average of six 0-100 sub-scores, rounded to a single 0-100 dataset-level value.",
    ], level=2))
    fl.append(small_table(s, [
        ["Sub-score", "Weight", "Formula"],
        ["Creative count", "0.20", "min(100, n / 50 * 100)"],
        ["Volume (impressions)", "0.15", "min(100, log10(impressions) / 6 * 100)"],
        ["Mapping quality", "0.20", "confirmed_mappings / total * 100"],
        ["Data completeness", "0.15", "creatives_with_impressions_and_spend / total * 100"],
        ["Extraction confidence", "0.15", "avg_extraction_confidence * 100"],
        ["Bucket balance", "0.15", "(total_groups - n_under_3) / total_groups * 100"],
    ], col_widths=[1.7 * inch, 0.7 * inch, 3.9 * inch]))
    fl.append(Spacer(1, 8))
    fl.append(Paragraph(
        "Levels: 80-100 Excellent, 60-79 Good, 40-59 Fair, under 40 Poor.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Rationale.</b> This is a heuristic, not a statistical measure. Its job is to set the prior of trust before the user reads the per-row numbers. The six components are chosen for legibility - a marketer can look at the bars and know whether to keep adding data before drawing conclusions.",
        s["body"],
    ))
    fl.append(Paragraph(
        "<b>Limit of the design.</b> The score does not detect adversarial or systematically biased data. A dataset where one campaign accounts for 90% of spend will score Excellent on every sub-score, despite being practically a single-creative analysis.",
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
        "Mandatory section. The honest version of this tool's claims, in one place.",
    ]))
    fl.extend(bullets(s, [
        "<b>No hypothesis testing in production.</b> Lite output is descriptive. Group A's CTR being 20% higher than Group B's is a number, not a test result.",
        "<b>No multiple-comparison correction.</b> With 24-plus universal variables, several with multiple enum values, the dashboard makes dozens of implicit comparisons. Some of the \"top findings\" by absolute delta are noise.",
        "<b>No interaction effects in production.</b> Each variable is analyzed independently in Lite. Pairs that matter together are invisible.",
        "<b>No confidence intervals on Lite deltas.</b> A point estimate is offered without error bars. The sample-size label is the only nod to uncertainty.",
        "<b>Confidence label ignores impression volume.</b> n=3 creatives delivering 300,000 impressions each are labelled \"low\". n=10 creatives delivering 1,000 impressions each are labelled \"high\". The former has more statistical power. This is on the roadmap to fix.",
        "<b>Missing values are silently excluded.</b> A creative with a null variable is dropped from that variable's group. If missingness correlates with something (for example, cta_text is null when there is no CTA), the resulting groups are biased.",
        "<b>No temporal handling.</b> All data is treated as a single cross-section. Seasonal effects, fatigue, and platform algorithm changes are unmodeled.",
        "<b>Correlation, not causation.</b> Every dashboard output is correlational. The tool is built to generate informed hypotheses for the next brief, not to prove that any variable causes performance changes.",
        "<b>Scale ceiling.</b> Streaming AI extraction over Vercel Hobby is practical up to roughly 150-200 creatives per run. Above that, batching and resumability become necessary.",
        "<b>Pro statistics in the demo are mocked.</b> The numbers in the regression table in the demo are deterministic noise added to the group-by deltas. They are designed to look right, not to be right. The methodology paper is the canonical reference for what those numbers will be once the production backend ships.",
    ]))

    # 7. References
    fl.extend(section(s, "7. References", [
        "<b>In-repo.</b> <font face=\"Courier\">ANALYSIS_METHODOLOGY.md</font> in the project root contains a longer technical specification of the methods above, including detailed formulas, weighted least squares notes, and a complete trust-score breakdown. The current paper is the portfolio-facing condensation of that document.",
        "<b>External.</b> Standard OLS treatment (any econometrics textbook). Rule-of-thumb of 5-10 observations per predictor: widely cited in regression introductions; the specific threshold for this project was chosen as a conservative floor rather than derived from a power calculation.",
        "<b>Consult.</b> An external reviewer (a quantitative researcher with regression-modeling background) reviewed the methodology brief and produced a companion HTML document during the project. Cite to be confirmed - see appendix.",
    ]))

    # Confirm appendix
    fl.extend(section(s, "Appendix: Confirm with Theo", [
        "Items not determinable from the repository.",
    ]))
    fl.extend(bullets(s, [
        "Name and affiliation of the external statistical reviewer; preferred citation form.",
        "Whether the consultant's <font face=\"Courier\">regression_companion.html</font> companion document should be reproduced in an appendix or cited only by title.",
        "Power-calculation rigor for the 100-creative threshold - was a specific assumed effect size, alpha, or beta used, or was the threshold left as a conservative rule of thumb?",
        "Whether the Pro mocked-statistics design (deterministic noise on group-by deltas) was reviewed by the consultant or is internal design only.",
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
        s, "Roadmap", "Current state, build journey, and what's next"
    ))

    # 1. Current state
    fl.extend(section(s, "1. Current state", [
        "Deployed at <font face=\"Courier\">https://media-analyzer-theta.vercel.app</font>. The root URL redirects to <font face=\"Courier\">/demo</font> to keep portfolio visitors out of the production app's API budget. Real-app pages remain reachable by direct URL (<font face=\"Courier\">/setup</font>, <font face=\"Courier\">/dashboard</font>, and the other wizard steps) for the operator only.",
        "<b>Architecture.</b>",
    ]))
    fl.extend(bullets(s, [
        "Next.js 16.2.6 (App Router, Turbopack) on Vercel Hobby.",
        "TypeScript 5, React 19.2.4, Tailwind 4.",
        "Supabase Postgres (eu-west-2) with nine tables and a creatives storage bucket. Database types generated from the schema and committed.",
        "Claude Haiku 4.5 (model id <font face=\"Courier\">claude-haiku-4-5-20241022</font>) via the Anthropic SDK, called with forced tool_use over Node.js runtime (Edge runtime is incompatible with the SDK).",
        "Streaming NDJSON for extraction progress, bypassing Vercel's 10-second function timeout.",
    ]))
    fl.append(Paragraph(
        "Environment requirements: <font face=\"Courier\">NEXT_PUBLIC_SUPABASE_URL</font>, <font face=\"Courier\">NEXT_PUBLIC_SUPABASE_ANON_KEY</font> (and a service role key for server routes), and <font face=\"Courier\">ANTHROPIC_API_KEY</font>. All three are set in Vercel for production, preview, and development.",
        s["body"],
    ))

    # 2. Build journey
    fl.extend(section(s, "2. Build journey", [
        "Reconstructed from 50 commits across roughly three weeks. The journey, not the destination, is the point of this section.",
    ]))

    fl.extend(section(s, "2.1 Streamlit prototype (April 22-23)", [
        "Five commits. The bet was that Claude vision with tool_use could replace manual creative tagging entirely. The prototype was a single-page Streamlit app: upload images, hit an Anthropic call, render the extracted variables in a table. Done in two evenings.",
        "<b>What this proved.</b> Forced tool_use produces consistent structured output across diverse images. Cost per image was small enough that batches of 50-100 were feasible.",
        "<b>What this exposed.</b> Streamlit is the wrong shell for a multi-step workflow. The product needed a wizard, persistent state, and proper async progress. The Streamlit version is preserved in <font face=\"Courier\">legacy/</font> as a reference but is no longer the deployed surface.",
    ], level=2))

    fl.extend(section(s, "2.2 Next.js shell and Supabase foundation (May 11)", [
        "Three PRs in one evening. Pivoted to Next.js 16 App Router with a sidebar-based nine-step stepper. Created the Supabase project, designed the nine-table schema with a snapshot model on <font face=\"Courier\">performance_rows</font> (an <font face=\"Courier\">is_latest</font> flag instead of destructive overwrites). Imported the design system from a Claude Design export.",
        "<b>The snapshot decision.</b> Marketers re-export CSVs constantly. Hard-overwriting older performance rows would erase history and re-running mapping would be expensive. The snapshot model means each upload creates a new <font face=\"Courier\">performance_upload</font> row with its own batch of <font face=\"Courier\">performance_rows</font>; the previous batch's rows are flipped to <font face=\"Courier\">is_latest = false</font>. Cheap, reversible, audit-friendly.",
    ], level=2))

    fl.extend(section(s, "2.3 Wizard steps 1-8 (May 11-12)", [
        "Eight PRs in roughly 24 hours, one per step. Setup form wiring, image plus CSV uploads, the six-method matching cascade, variable schema builder with category templates, AI extraction with streaming, dashboard with trust score and group-by analytics, settings with CSV export and project delete, polish (error boundary, sidebar completion tracking).",
        "<b>Notable inflection - Edge runtime fail.</b> The extraction route was initially deployed on Vercel Edge for the streaming. It failed at deploy time: the Anthropic SDK imports node:fs and node:path which Edge does not provide. The fix was to drop back to Node.js runtime; the streaming approach (ReadableStream piping NDJSON chunks) works there too and is what shipped.",
        "<b>Notable inflection - lazy Supabase client.</b> Supabase client instantiation at module top-level broke Next.js build because environment variables are not available at build time. Refactor to a <font face=\"Courier\">getSupabase()</font> function pattern made the build pass.",
    ], level=2))

    fl.extend(section(s, "2.4 Interactive demo (May 13)", [
        "Two PRs in the morning. The first added a self-contained demo at <font face=\"Courier\">/demo</font> with 40 deterministically-generated fake creatives (\"GlowLab\", a fictional DTC skincare brand) and an enhanced, componentized dashboard. The second split the dashboard into Pro and Lite paths, added 120-creative Pro fake data, and built the five chart types (bar, scatter, regression scatter, distribution, heatmap) as inline SVG without any chart library.",
        "<b>Why mock the Pro stats.</b> A real OLS backend can be implemented once, against real data, with empirical decisions about regularization and interactions. Synthesizing those decisions on fake data risked shipping a model that did not survive contact with real distributions. The demo shows the experience; the production code path stops at group-by for now.",
        "<b>Same-day instructions overhaul.</b> The instructions page was rewritten to include step-by-step Meta Ads Manager and Google Ads export guides, sample CSV previews, common pitfalls (granularity, encoding, multi-row creatives), and a pre-upload checklist. This is the gatekeeping document - a portfolio visitor reading it understands the data preparation work involved and decides whether to request a real demo.",
    ], level=2))

    fl.extend(section(s, "2.5 Access control lockdown (May 13 evening)", [
        "Root <font face=\"Courier\">/</font> changed from a marketing landing page to a redirect to <font face=\"Courier\">/demo</font>. Real-app pages still resolve at their original URLs but are not discoverable from anywhere user-facing. This protects the operator's Supabase storage and Anthropic API budget from accidental usage by portfolio visitors. The trade-off is that the real app is now discoverable by URL guessing only; this is acceptable for a portfolio piece run as a single-operator tool.",
    ], level=2))

    # 3. What's done
    fl.extend(section(s, "3. What's done (production)", [
        "Concrete capabilities currently shipped:",
    ]))
    fl.extend(bullets(s, [
        "Image upload (PNG/JPEG, 10 MB cap) to Supabase Storage with thumbnail-grid preview.",
        "CSV parser with auto-detected column mapping; supports Meta Ads Manager and Google Ads exports out of the box.",
        "Six-method matching cascade with confidence scoring (exact, normalised, embedded platform ID, prefix, contains, fuzzy Levenshtein).",
        "Variable schema builder: 24 universal definitions plus 4-6 from any of 10 category templates, plus custom variables in Pro.",
        "AI extraction pipeline: Claude Haiku 4.5 with forced tool_use, streaming NDJSON over Node.js runtime, per-image cost tracking at the published Haiku rates.",
        "Dashboard: metric switcher (CTR/CPC/CPA/CVR/ROAS), trust score with six sub-score bars, variable explorer (bar chart in Lite, plus four more chart types in Pro), sortable variable performance table, ranked creative gallery, insights panel.",
        "Three CSV export types (variables-only, performance-only, combined).",
        "Project delete with cascade across nine tables and the storage bucket.",
        "Interactive demo at <font face=\"Courier\">/demo</font> with Pro/Lite mode chooser, 40 or 120 fake creatives, full Pro UI with mocked regression statistics.",
        "Comprehensive instructions page (Meta export, Google export, naming convention, sample CSVs, common pitfalls, pre-upload checklist).",
    ]))

    # 4. What's planned
    fl.extend(section(s, "4. What's planned next", [
        "Priority order. Timelines are deliberately vague (\"post-v1\") rather than dated, because each depends on access to a real 100-plus creative dataset.",
    ]))
    fl.extend(bullets(s, [
        "<b>Production OLS regression backend.</b> Move the mocked Pro statistics out of <font face=\"Courier\">demo-data.ts</font> and into a real server-side regression pipeline. Gate on first real 100-plus creative dataset to make empirical choices about weighting, interactions, and regularization.",
        "<b>AI insights narration.</b> Replace placeholder insights panel with Claude-generated explanations grounded in the actual coefficients and deltas. Requires the production regression to land first so the narration has real numbers to reference.",
        "<b>Personal knowledge-base layer.</b> Markdown notes (Obsidian-compatible) the operator maintains per brand. Notes are injected into the extraction prompt so repeated campaigns inherit context. Confirm with Theo - exact scope and storage model to be decided.",
        "<b>Volume-weighted confidence labels.</b> Replace the discrete n-threshold confidence label with a continuous score that incorporates impression volume so high-volume small-n groups are not penalized.",
        "<b>Multi-row creative aggregation.</b> Detect and aggregate when one creative appears in multiple CSV rows (same image, multiple ad sets) at parse time rather than relying on the operator to dedupe.",
        "<b>Additional platforms.</b> TikTok and LinkedIn CSV column mappings.",
    ]))

    # 5. Limitations
    fl.extend(section(s, "5. Limitations", [
        "Mandatory section. The honest list of what does not work yet.",
    ]))
    fl.extend(bullets(s, [
        "Static image creatives only. Video and dynamic creatives are not supported.",
        "Single-user. No auth, no shared workspaces, no comments.",
        "Vercel Hobby tier. Practical batch ceiling around 150-200 creatives per extraction run; above that, batching and resumable runs become necessary.",
        "CSV uploads only. No real-time Meta or Google API integration.",
        "Pro statistics in the dashboard are mocked. Real OLS backend is not yet built.",
        "Root URL redirects all visitors to the demo. Operator must bookmark real-app URLs for personal use.",
        "Demo data is fictional with deliberate correlations. The Pro mode regression table values, while internally consistent, are not the output of a real regression.",
        "Group-by analysis is descriptive only. No p-values, no confidence intervals on deltas, no multiple-comparison correction.",
        "No temporal handling. Date ranges from the CSV are read but seasonality is not modeled.",
        "Mapping ceiling. The fuzzy Levenshtein method handles minor filename variation but not creatives renamed entirely between export and upload.",
    ]))

    # 6. Parked / future
    fl.extend(section(s, "6. Parked and future", [
        "Items deferred without a timeline. Whether they ship depends on real-world demand.",
    ]))
    fl.extend(bullets(s, [
        "Obsidian-style personal knowledge base for cross-campaign context.",
        "Video creative support (frame extraction, motion variables, audio).",
        "Real-time Meta/Google API integration (replaces CSV uploads).",
        "Mixed-effects models for campaign-nested data.",
        "Bayesian regression for small-sample uncertainty quantification.",
        "Multi-user collaboration and shared workspaces.",
        "Saved \"views\" - persisted dashboard filter and metric configurations.",
    ]))

    # 7. Open strategic questions
    fl.extend(section(s, "7. Open strategic questions", [
        "Decisions not yet made. Listed so the document represents the project honestly rather than retrofitting a finished narrative.",
    ]))
    fl.extend(bullets(s, [
        "<b>Productize or keep as a personal tool.</b> The architecture supports either. Productization needs auth, billing, and a support story. Personal-tool use needs only the current shape.",
        "<b>Paid media versus social.</b> The shipped functionality is paid-ads-shaped. Organic social would need a different metric set (saves, shares, comment sentiment) and probably a different schema. Both are open.",
        "<b>Pricing model.</b> If productized: subscription tiered on Lite/Pro? Single price? Per-creative usage?",
        "<b>Lighthouse customer or open beta.</b> The Betterhalf.ai-style customer (high spend, technical team) is the lighthouse for Pro validation. The open question is whether to widen access before that validation is done, or after.",
    ]))

    # 8. Confirm
    fl.extend(section(s, "Appendix: Confirm with Theo", [
        "Items not determinable from the repository.",
    ]))
    fl.extend(bullets(s, [
        "Whether the deployed URL should be promoted publicly or kept for portfolio-share-only.",
        "Personal knowledge-base layer - intended scope and rough priority versus the production regression backend.",
        "Whether the Pro/Lite split should be carried over to a future subscription model, and what naming/pricing would look like.",
        "Whether to commit the next 100-plus creative dataset path (Betterhalf.ai or otherwise) as the explicit gating event for the regression backend, or leave it open.",
        "Whether the Streamlit <font face=\"Courier\">legacy/</font> folder should be removed before the next public-facing iteration or kept for the build-journey narrative.",
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
