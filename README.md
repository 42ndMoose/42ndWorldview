# 42ndWorldview

A minimal static app for worldview text-dump workflows.

## What it does now

- **Editable Profile JSON** with live state updates when JSON is valid.
- **Scenario textbox** for long-form ramble/context input.
- **JSON-only LLM primer** generated from your current profile + scenario.
- **Import/Export profile JSON** for portability.
- **Compare against another imported profile** with a semantic path diff.
- **Quick visualizer** for profile density stats.

## Core workflow

1. Paste or edit your profile JSON.
2. Paste any scenario text.
3. Copy the generated LLM primer.
4. Run it in your LLM.
5. Paste the LLM's strict JSON response back into Profile JSON.
6. Import another profile and compare when needed.

## Run

Open `index.html` in a browser.
