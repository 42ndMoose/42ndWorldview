# 42ndWorldview

42ndWorldview is a static GitHub Pages engine for building a portable, canonical psychology called **42ndPsychology**.

The point is to let you dump worldview text, keep one editable JSON profile, and generate copy/paste prompts for LLM workflows without extra formatting friction.

## What the engine does

- Gives you an editable **Profile JSON Workspace** with live validation and state updates.
- Generates an **LLM JSON Primer** that explicitly instructs models to return JSON only.
- Supports profile JSON import/export plus side-by-side profile diffing.

- Maintains a **Logic Box** that compiles canonical terms and rules into a compact prompt chunk.
- Maintains an **Interpreter JSON** that stores the same worldview in machine-readable structure.
- Implements a **proposal intake gate** so new words or rules do not go straight into core.
- Lets logic exist in graded states: `core`, `provisional`, `contested`, `weak`, `rejected`.
- Provides a **staging area** for ideas worth keeping around without poisoning the core.
- Provides a **scenario runner prompt** builder so you can paste the worldview plus a scenario into any LLM.
- Provides a **diff workspace** so you can compare the current logic box against a pasted candidate revision.
- Supports **local persistence** through `localStorage` and **file import/export** through JSON.

## Core concept

The logic box is the portable compression layer. It should be short enough to preserve context budget, but exact enough that the LLM keeps using the same worldview rather than drifting into generic filler.

The interpreter JSON is the editable state. It is not the thing you paste into the LLM unless you want the raw structure. The logic box is the thing you paste.

## Term intake policy

Incoming concepts are checked for:

- existing duplicates
- synonym overlap
- ambiguity
- overloading
- compound labels
- reducibility to existing canonical terms
- actual value added to precision, compression, contradiction handling, predictive power, or scenario coverage

The intake gate classifies terms as:

- primitive
- derived
- alias
- compound
- ambiguous
- rejected

## Rule handling policy

Rules are not treated as only true or false.

A rule can be:

- core
- provisional
- contested
- weak
- rejected

Inferior logic should not always be deleted right away. The engine is built around the idea that weak logic may still contain signal that can be narrowed, split, translated, or sandboxed.


## Fast workflow (text dump -> JSON -> compare)

1. Paste/edit your profile directly in the **Profile JSON Workspace**.
2. Paste any scenario/ramble into the **Scenario Runner Prompt** input.
3. Copy the **LLM JSON Primer** to force the model to return JSON only (no prose, no markdown fences).
4. Paste the LLM JSON response into the **Paste LLM JSON Response Here (Profile Workspace)** box (it updates live when valid).
5. Import another profile JSON in **Profile Compare (JSON)** and view the diff.


### What happens after pasting LLM JSON?

- If your pasted JSON has the same `terms` and `rules` as the current profile, the Logic Box will look the same (no strengthening happened yet).
- The Logic Box only changes when canonical `terms`/`rules` change, especially items in `core` state.
- `staging` can store reference outputs (like scenario analysis). Those are notes unless converted into actual term/rule proposals.

4. Paste the LLM JSON response back into the profile workspace (it updates live when valid).
5. Import another profile JSON in **Profile Compare (JSON)** and view the diff.

## Running it locally

Just open `index.html` in a browser.

## Publishing on GitHub Pages

1. Create a repo named `42ndWorldview`.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md`.
3. In the repo settings, turn on GitHub Pages for the main branch root.
4. Open the generated Pages URL.

## Limitations

This is a **static engine**. It does not push commits to GitHub by itself. Anything you do in the UI persists only in your browser unless you export the state file and commit it to the repo yourself.

That is normal for GitHub Pages. The engine is still useful because it gives you:

- deterministic structure
- portable prompt compilation
- visual diffing
- staged refinement
- save/load of worldview state

## Recommended repo files to add later

Once you start using it heavily, add:

- `state/current.json` for the committed worldview state
- `logic-box/current.txt` for the canonical exported prompt chunk
- `examples/` for scenario test cases
- `notes/` for human commentary that should not enter core directly

## Suggested workflow

1. Edit or intake terms/rules in the UI.
2. Rebuild the logic box.
3. Copy the scenario prompt into an LLM.
4. Evaluate whether the response reveals a missing rule, better compression, or contradiction.
5. Paste candidate revisions into the diff workspace.
6. Export the improved state JSON.
7. Commit that state back into the repo.

## Philosophy of the engine

The goal is to move toward a worldview that is:

- smaller without getting dumber
- clearer without getting flatter
- stable without getting rigid
- adaptive without becoming mush

That is the whole point of 42ndPsychology.
