# FrogDB

A colorful, fictional frog field guide and browser-local collection manager. Includes **35 named frogs**, individual AI-generated portraits, searchable profiles, and admin screens.

## Run locally

Requires Node.js 20 or newer. No package installation or build step.

```powershell
node server.js
```

Open http://127.0.0.1:4173. The server listens only on your computer.

## Pages

- `#/` — public field guide, search, habitat filters, size/name sorting.
- `#/frog/fern-brow` — individual frog profile and attributes.
- `#/admin` — collection management, status filters, deletion with confirmation, JSON export/import.
- `#/admin/new` — add a frog, choose a portrait, save as draft or published.
- `#/admin/edit/fern-brow` — edit an existing frog.

Only published records appear in the public catalog. New frogs default to draft. All starter frogs are published.

## Demo storage

This is deliberately a **browser demo**, not an authenticated administration service. Edits live in localStorage under `frogdb.records.v1`. They persist across refreshes on the same browser and origin. Visitors on other devices receive the starter data, not your edits. Changing localhost ports or moving to GitHub Pages creates a separate storage origin. Export JSON to move records between them. Import validates the complete file before replacing anything and asks for confirmation.

No passwords, API keys, analytics, database, or backend services. Do not use this admin UI to store sensitive information. If storage is unavailable or full, the app reports save failure rather than pretending it saved.

## Publish on GitHub Pages

The files are ready for static hosting. In repository Settings → Pages, choose **Deploy from a branch**, then **main** and **/(root)**. No build workflow is required. The intended address after enabling Pages is https://mergetel.github.io/frogdb/. Committing these files alone does not enable hosting.

All asset links are relative and navigation uses hash routes, so project subpaths work without rewrites.

## Code map

- `index.html`: semantic shell and navigation.
- `styles.css`: responsive layouts and design tokens.
- `app.js`: public routes, admin forms, filtering, safe rendering and data tools.
- `data.js`: 35 starter frogs and portrait labels.
- `store.js`: validation and storage adapter.
- `frog-detail-0.png` through `frog-detail-8.png`: 2-by-2 portrait sheets for hero and profile images (627 pixels per frog). Only the displayed sheet is requested.
- `frog-atlas.png`: 7-column, 5-row image atlas. Portrait index is row-major, from 0 to 34.
- `server.js`: dependency-free local preview server.
- `store.test.js`: data integrity and persistence tests.

Run tests with:

```powershell
node --test store.test.js
```

## Screenery testing

Start the local server and capture the catalog, a profile, `#/admin`, and `#/admin/new`. Use the public catalog for deterministic initial screenshots. Local edits affect screenshots in that same browser; use a fresh browser profile or restore a saved JSON backup for repeatable tests. Screenery installation, repository binding, and CI publishing are separate setup steps, not included in this website commit.

## Content and images

Species names, attributes and observations are invented. Some names may resemble actual taxa; none of the copy should be treated as a scientific reference. Portraits were generated with the built-in image generation tool, then revised to vary body shapes, proportions and poses. See `IMAGE-PROMPTS.md` for the final prompt specification. Fonts are Fraunces and DM Sans, requested from Google Fonts with local fallback fonts if unavailable.

The repository's existing LICENSE remains authoritative and unchanged.
