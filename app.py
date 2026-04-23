import os
import base64
import pandas as pd
import streamlit as st
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
try:
    if "ANTHROPIC_API_KEY" in st.secrets:
        os.environ["ANTHROPIC_API_KEY"] = st.secrets["ANTHROPIC_API_KEY"]
except Exception:
    pass

# Claude Sonnet 4.6 pricing (per million tokens)
INPUT_COST_PER_MTOK = 3.0
OUTPUT_COST_PER_MTOK = 15.0

EXTRACTION_TOOL = {
    "name": "extract_creative_variables",
    "description": "Extract structured creative variables from an ad image.",
    "input_schema": {
        "type": "object",
        "properties": {
            "subject_placement": {"type": "string", "enum": ["top-left","top-center","top-right","middle-left","center","middle-right","bottom-left","bottom-center","bottom-right","no_clear_subject"]},
            "visual_complexity": {"type": "integer", "minimum": 1, "maximum": 5},
            "negative_space_ratio": {"type": "string", "enum": ["low","medium","high"]},
            "dominant_color_hex": {"type": "string"},
            "color_temperature": {"type": "string", "enum": ["warm","neutral","cool"]},
            "saturation": {"type": "string", "enum": ["low","medium","high"]},
            "brightness": {"type": "string", "enum": ["dark","medium","bright"]},
            "contrast": {"type": "string", "enum": ["low","medium","high"]},
            "people_present": {"type": "boolean"},
            "people_count": {"type": "integer", "minimum": 0},
            "gaze_direction": {"type": "string", "enum": ["camera","away","other_subject","n/a"]},
            "expression": {"type": "string", "enum": ["happy","sad","angry","fear","surprise","disgust","neutral","n/a"]},
            "setting": {"type": "string", "enum": ["indoor","outdoor","ambiguous","studio","digital_composite"]},
            "setting_category": {"type": "string", "enum": ["home","office","street","nature","studio","retail","other"]},
            "text_present": {"type": "boolean"},
            "text_word_count": {"type": "integer", "minimum": 0},
            "cta_present": {"type": "boolean"},
            "cta_type": {"type": "string", "enum": ["urgency","benefit","question","command","social_proof","none","n/a"]},
            "logo_present": {"type": "boolean"},
            "logo_prominence": {"type": "string", "enum": ["small","medium","large","none"]},
            "product_visible": {"type": "boolean"},
            "product_prominence": {"type": "string", "enum": ["small","medium","large","none"]},
            "dominant_emotional_tone": {"type": "string", "enum": ["joyful","calm","serious","urgent","nostalgic","aspirational","playful","mysterious","other"]},
            "emotional_intensity": {"type": "integer", "minimum": 1, "maximum": 5},
            "energy_level": {"type": "string", "enum": ["calm","moderate","dynamic"]},
            "polish_level": {"type": "string", "enum": ["low","medium","high"]},
            "stock_feel": {"type": "string", "enum": ["bespoke","mixed","stocky"]},
            "memorability_heuristic": {"type": "integer", "minimum": 1, "maximum": 5},
            "confidence": {"type": "number", "minimum": 0.0, "maximum": 1.0},
            "notes": {"type": "string"},
        },
        "required": ["subject_placement","visual_complexity","negative_space_ratio","dominant_color_hex","color_temperature","saturation","brightness","contrast","people_present","people_count","gaze_direction","expression","setting","setting_category","text_present","text_word_count","cta_present","cta_type","logo_present","logo_prominence","product_visible","product_prominence","dominant_emotional_tone","emotional_intensity","energy_level","polish_level","stock_feel","memorability_heuristic","confidence","notes"],
    },
}

SYSTEM_PROMPT = (
    "You are a creative analyst for a marketing team. "
    "For the image provided, extract the variables defined in the tool schema. "
    "Be specific and literal; if uncertain, pick the closest enum and lower "
    "the confidence score. Never invent categories. Respect enums exactly. "
    "Base judgements on the actual pixels, not assumptions about the brand."
)


def extract_variables(client, image_bytes, media_type, brand, goal, audience, tone):
    b64 = base64.standard_b64encode(image_bytes).decode("utf-8")
    user_text = (
        f"Context:\n- Brand: {brand}\n- Goal: {goal}\n"
        f"- Audience: {audience}\n- Tone: {tone}\n\n"
        "Analyze the image and call the extract_creative_variables tool."
    )
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=[EXTRACTION_TOOL],
        tool_choice={"type": "tool", "name": "extract_creative_variables"},
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                {"type": "text", "text": user_text},
            ],
        }],
    )
    tool_use = next(b for b in response.content if b.type == "tool_use")
    cost = (
        response.usage.input_tokens * INPUT_COST_PER_MTOK / 1_000_000
        + response.usage.output_tokens * OUTPUT_COST_PER_MTOK / 1_000_000
    )
    return tool_use.input, cost


st.set_page_config(page_title="Creative Media Analyzer", layout="wide")
st.title("Creative Media Analyzer")
st.caption("Upload ad creatives + a performance CSV. Claude extracts variables and joins them with your metrics.")

if "analyses" not in st.session_state:
    st.session_state.analyses = {}

with st.sidebar:
    st.header("Brand context")
    brand = st.text_input("Brand", value="Betterhalf")
    goal = st.text_input("Goal", value="App install")
    audience = st.text_input("Audience", value="Urban Indian singles, 25-34")
    tone = st.text_input("Tone", value="Playful, warm")
    st.divider()
    if st.button("Clear all analyses"):
        st.session_state.analyses = {}
        st.rerun()
    total_cost = sum(a["cost"] for a in st.session_state.analyses.values())
    st.metric("Total API cost", f"${total_cost:.4f}")
    st.metric("Creatives analyzed", len(st.session_state.analyses))

uploaded_images = st.file_uploader(
    "Upload ad creatives",
    type=["png", "jpg", "jpeg"],
    accept_multiple_files=True,
)

perf_file = st.file_uploader(
    "Upload performance CSV (must have a 'filename' column)",
    type=["csv"],
)

perf_df = None
if perf_file is not None:
    try:
        perf_df = pd.read_csv(perf_file)
        if "filename" not in perf_df.columns:
            st.error("CSV must include a 'filename' column matching your uploaded image filenames.")
            perf_df = None
        else:
            st.success(f"Loaded {len(perf_df)} performance rows.")
    except Exception as e:
        st.error(f"Could not read CSV: {e}")

if uploaded_images and st.button("Extract variables for all", type="primary"):
    client = Anthropic()
    to_process = [f for f in uploaded_images if f.name not in st.session_state.analyses]
    if not to_process:
        st.info("All uploaded files already analyzed. Use 'Clear all analyses' to re-run.")
    else:
        progress = st.progress(0.0, text=f"0 / {len(to_process)}")
        for i, f in enumerate(to_process):
            try:
                image_bytes = f.getvalue()
                variables, cost = extract_variables(client, image_bytes, f.type, brand, goal, audience, tone)
                st.session_state.analyses[f.name] = {
                    "image_bytes": image_bytes,
                    "media_type": f.type,
                    "variables": variables,
                    "cost": cost,
                }
            except Exception as e:
                st.error(f"{f.name}: {e}")
            progress.progress((i + 1) / len(to_process), text=f"{i + 1} / {len(to_process)}")
        st.success(f"Done. Analyzed {len(to_process)} creatives.")

if st.session_state.analyses:
    st.divider()
    st.subheader("Results")

    rows = []
    for fname, a in st.session_state.analyses.items():
        row = {"filename": fname, **a["variables"]}
        rows.append(row)
    vars_df = pd.DataFrame(rows)

    if perf_df is not None:
        combined = vars_df.merge(perf_df, on="filename", how="left")
    else:
        combined = vars_df

    st.download_button(
        "Download combined CSV",
        data=combined.to_csv(index=False).encode("utf-8"),
        file_name="creative_analysis.csv",
        mime="text/csv",
    )

    st.dataframe(combined, use_container_width=True, hide_index=True)

    st.subheader("Per-creative detail")
    for fname, a in st.session_state.analyses.items():
        with st.expander(fname):
            col_img, col_vars = st.columns([1, 2])
            with col_img:
                st.image(a["image_bytes"], use_container_width=True)
                st.caption(f"Cost: ${a['cost']:.4f}")
            with col_vars:
                var_df = pd.DataFrame(
                    [(k, v) for k, v in a["variables"].items()],
                    columns=["variable", "value"],
                )
                st.dataframe(var_df, use_container_width=True, hide_index=True)
                if perf_df is not None and fname in perf_df["filename"].values:
                    st.markdown("**Performance row:**")
                    st.dataframe(perf_df[perf_df["filename"] == fname], use_container_width=True, hide_index=True)