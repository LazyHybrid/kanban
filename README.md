# dot-js frontend-framework

This repo now contains a small learning version of the project:

- `framework/`: a tiny frontend framework built from scratch with plain JavaScript.
- `example/`: a small Kanban board that uses the framework.

This is intentionally basic. It is meant to help you and your teammate learn the architecture before trying to satisfy every requirement from the full brief.

## What is included

- Declarative element creation with `h()`
- Reusable function components with `defineComponent()`
- A small app runner with `createApp()`
- Shared state with subscriptions and `localStorage` persistence
- Hash-based routing
- Render-time event handlers
- Parent-level delegated events

## Run it

From the repo root, start a static server:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/example/`

## What to read first

1. `framework/README.md`
2. `framework/src/index.js`
3. `example/src/main.js`
4. `example/src/app.js`

## What this example does not try to do yet

- It does not implement a full diffing renderer.
- It does not implement a full HTTP layer.
- It does not try to pass the full project rubric.

It gives you a simple, understandable base to extend.
