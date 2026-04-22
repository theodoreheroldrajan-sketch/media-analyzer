import os
import base64
import streamlit as st
from anthropic import Anthropic
from dotenv import load_dotenv

# Load ANTHROPIC_API_KEY from the local .env file
load_dotenv()

st.title("Media Analyzer — Hello LLM")
st.caption("Upload an image. I'll ask Claude to describe it in one sentence.")

uploaded = st.file_uploader("Pick an image", type=["png", "jpg", "jpeg"])

if uploaded is not None:
    image_bytes = uploaded.read()
    st.image(image_bytes, caption=uploaded.name, use_container_width=True)

    if st.button("Describe"):
        with st.spinner("Calling Claude..."):
            client = Anthropic()  # reads ANTHROPIC_API_KEY from env
            b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

            response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=300,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": uploaded.type,
                                    "data": b64,
                                },
                            },
                            {
                                "type": "text",
                                "text": "Describe this image in one sentence.",
                            },
                        ],
                    }
                ],
            )
            st.success(response.content[0].text)
