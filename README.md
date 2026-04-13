# dot-js frontend-framework

This repository contains the required submission structure:

- `framework/`: the Dot JS frontend framework and its markdown documentation.
- `example/`: a Kanban board that uses the framework features directly.

The framework is written from scratch with plain JavaScript and browser APIs only.

## Included features

- Declarative element creation with `h()`
- Reusable function components with `defineComponent()`
- Shared state with subscriptions, persistence, and batching
- Hash routing with params and query values
- Render-time direct events and delegated events
- Attributes, dataset values, and style objects
- HTTP requests through a small framework client
- Batched render scheduling with validation metrics in the example app

## Run it

From the repo root, start a static server:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/example/`

## Read this first

1. `framework/README.md`
2. `framework/src/index.js`
3. `example/src/main.js`
4. `example/src/app.js`

## What the example demonstrates

- state persisted between sessions
- state shared across dashboard, board, card detail, and settings pages
- URL-driven board selection, card detail, and search filtering
- forms for cards and settings
- delegated move and delete actions at the board container level
- HTTP-loaded remote templates and team guidance
- a measurable bulk-update performance flow using `store.batch()`
