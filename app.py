import base64
import streamlit as st
import pandas as pd
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# ---- Variable schema -----------------------------------------------------
# Claude is forced (via tool_choice) to return a JSON object matching this
# shape. Edit fields here and the whole pipeline follows.
EXTRACTION_TOOL = {
    "name": "extract_creative_variables",
    "description": "Extract structured creative variables from an ad image.",
    "input_schema": {
        "type": "object",
        "properties": {
            "subject_placement": {"type": "string", "enum": [
                "top-left", "top-center", "top-right",
                "middle-left", "center", "middle-right",
                "bottom-left", "bottom-center", "bottom-right",
                "no_clear_subject"]},
            "visual_complexity": {"type": "integer", "minimum": 1, "maximum": 5},
            "negative_space_ratio": {"type": "string", "enum": ["low", "medium", "high"]},

            "dominant_color_hex": {"type": "string"},
            "color_temperature": {"type": "string", "enum": ["warm", "neutral", "cool"]},
            "saturation": {"type": "string", "enum": ["low", "medium", "high"]},
            "brightness": {"type": "string", "enum": ["dark", "medium", "bright"]},
            "contrast": {"type": "string", "enum": ["low", "medium", "high"]},

            "people_present": {"type": "boolean"},
            "people_count": {"type": "integer"},
            "gaze_direction": {"type": "string", "enum": ["camera", "away", "other_subject", "n/a"]},
            "expression": {"type": "string", "enum": ["happy", "sad", "angry", "fear", "surprise", "disgust", "neutral", "n/a"]},

            "setting": {"type": "string", "enum": ["indoor", "outdoor", "ambiguous", "studio", "digital_composite"]},
            "setting_category": {"type": "string", "enum": ["home", "office", "street", "nature", "studio", "retail", "other"]},

            "text_present": {"type": "boolean"},
            "text_word_count": {"type": "integer"},
            "cta_present": {"type": "boolean"},
            "cta_type": {"type": "string", "enum": ["urgency", "benefit", "question", "command", "social_proof", "none", "n/a"]},

            "logo_present": {"type": "boolean"},
            "logo_prominence": {"type": "string", "enum": ["small", "medium", "large", "none"]},
            "product_visible": {"type": "boolean"},
            "product_prominence": {"type": "string", "enum": ["small", "medium", "large", "none"]},

            "dominant_emotional_tone": {"type": "string", "enum": ["joyful", "calm", "serious", "urgent", "nostalgic", "aspirational", "playful", "mysterious", "other"]},
            "emotional_intensity": {"type": "integer", "minimum": 1, "maximum": 5},
            "energy_level": {"type": "string", "enum": ["calm", "moderate", "dynamic"]},

            "polish_level": {"type": "string", "enum": ["low", "medium", "high"]},
            "stock_feel": {"type": "string", "enum": ["bespoke", "mixed", "stocky"]},
            "memorability_heuristic": {"type": "integer", "minimum": 1, "maximum": 5},

            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "notes": {"type": "string"},
        },
        "required": [
            "subject_placement", "visual_complexity", "negative_space_ratio",
            "dominant_color_hex", "color_temperature", "saturation", "brightness", "contrast",
            "people_present", "people_count", "gaze_direction", "expression",
            "setting", "setting_category",
            "text_present", "text_word_count", "cta_present", "cta_type",
            "logo_present", "logo_prominence", "product_visible", "product_prominence",
            "dominant_emotional_tone", "emotional_intensity", "energy_level",
            "polish_level", "stock_feel", "memorability_heuristic",
            "confidence", "notes",
        ],
    },
}

SYSTEM_PROMPT = (
    "You are a creative analyst for a marketing team. "
    "For the image provided, extract the variables defined in the tool schema. "
    "Be specific and literal; if uncertain, pick the closest enum and lower "
    "the confidence score. Never invent categories. Respect enums exactly. "
    "Base judgements on the actual pixels, not assumptions about the brand."
)

# ---- UI ------------------------------------------------------------------
st.set_page_config(page_title="Media Analyzer", layout="wide")
st.title("Media Analyzer — Variable Extraction")
st.caption("Upload a creative. Claude returns a structured variable sheet.")

with st.sidebar:
    st.header("Brand context")
    brand = st.text_input("Brand", value="Betterhalf")
    goal = st.text_input("Goal", value="App install")
    audience = st.text_input("Audience", value="Urban Indian singles, 25-34")
    tone = st.text_input("Tone", value="Playful, warm")

uploaded = st.file_uploader("Pick an image", type=["png", "jpg", "jpeg"])

if uploaded is not None:
    image_bytes = uploaded.read()

    col_img, col_out = st.columns([1, 2])
    with col_img:
        st.image(image_bytes, caption=uploaded.name, use_container_width=True)
        run = st.button("Extract variables", type="primary")

    if run:
        with st.spinner("Calling Claude..."):
            client = Anthropic()
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
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image", "source": {
                                "type": "base64",
                                "media_type": uploaded.type,
                                "data": b64,
                            }},
                            {"type": "text", "text": user_text},
                        ],
                    }
                ],
            )
            tool_use = next(b for b in response.content if b.type == "tool_use")
            variables = tool_use.input

        with col_out:
            st.subheader("Extracted variables")
            df = pd.DataFrame(
                [(k, v) for k, v in variables.items()],
                columns=["variable", "value"],
            )
            st.dataframe(df, use_container_width=True, hide_index=True)
            with st.expander("Raw JSON"):
                st.json(variables)