# legacy/

**Archival only — not part of the current build.**

This folder contains the Streamlit prototype that preceded the current Next.js implementation. It is preserved for build-journey context (see `roadmap.pdf` §2.1) and is not imported or executed by any code under `src/`.

## Contents

- `app.py` — single-file Streamlit prototype. Upload images, hit an Anthropic call, render the extracted variables in a table. Done in two evenings (April 22–23, 2026).
- `requirements.txt` — Python dependencies for the prototype.

## What this proved

Forced `tool_use` with Claude vision produces consistent structured output across diverse images. Cost per image was small enough that batches of 50–100 were feasible. The bet was sound; the shell wasn't.

## What this exposed

Streamlit is the wrong shell for a multi-step workflow. The product needed a wizard, persistent state, and proper async progress. The Next.js application in `src/` is what shipped.

## Do not run

This prototype has no maintained state, no Supabase persistence, and no production-shape error handling. The dependencies listed in `requirements.txt` are pinned to versions current in April 2026; no guarantee they still install. If you want to inspect the prototype's approach, read `app.py` directly.
