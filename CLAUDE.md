# TeachingTools

A collection of small, standalone browser tools for online teaching, each living in its own top-level folder (`intro_app/`, `randomizer/`, `mermaid_viewer/`, `list_checker/`, `youtube_segment_viewer/`, `word_brainteasers/`). One exception: `icebreaker_classmate_guessing/` is a Jupyter notebook tool.

## Architecture
- Each tool is plain HTML/CSS/vanilla JS — no build step, no bundler, no framework, no `package.json`.
- No shared code between tools; each folder is self-contained (its own `index.html`/equivalent, `script.js` or `app.js`, `styles.css`).
- Tools run entirely client-side in the browser: no backend, no data upload, no tracking. Preserve this privacy guarantee — never add server calls or external analytics.
- Tools are published via GitHub Pages from this repo (see README.md links of the form `https://jasonl888.github.io/TeachingTools/<tool>/...`).

## Conventions
- Keep new tools consistent with existing ones: single folder, plain HTML/CSS/JS, a README section with an intent description, screenshot, and "Usage" steps.
- When adding a new tool, add a corresponding section to `README.md` (intent, screenshot, usage) following the existing pattern.
- Use `uv` for any Python work (per global instructions) — e.g. the icebreaker notebook tool.

## Local testing
No build/install needed for the HTML/JS tools. From a tool's folder, serve with `uv` (never call `python3`/`pip` directly, per global instructions):
```bash
uv run python -m http.server 8000
```
Then open `http://localhost:8000` in a browser.
