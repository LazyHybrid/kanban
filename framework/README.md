# Dot JS Framework

Dot JS is a small convention-driven frontend framework built from scratch with plain JavaScript. It focuses on the project requirements in this repository: declarative DOM creation, reusable components, shared state, URL-driven routing, render-time events, HTTP requests, and one explicit performance feature.

The framework lives in `framework/` and the example Kanban application lives in `example/`.

## Architecture

Dot JS has five core parts:

1. `h()` creates virtual nodes.
2. `defineComponent()` defines reusable function components.
3. `createStore()` manages shared application state and persistence.
4. `createRouter()` keeps the UI synchronized with the URL.
5. `createApp()` mounts the app and schedules batched renders.

The implementation is intentionally small, but the usage is opinionated. Apps are expected to follow the same flow:

1. Create one root store in `main.js`.
2. Create one route table in `main.js`.
3. Define page and feature components in `components/`.
4. Keep route decisions in `app.js`.
5. Load remote data through the framework HTTP client.

That convention is what makes this a framework instead of a bag of utilities.

## Design Principles

- Keep the public API small enough that every exported feature is easy to explain.
- Register events when elements are rendered, not later with scattered DOM code.
- Keep shared state centralized so different pages and components stay synchronized.
- Let the URL describe important UI state such as the current page, selected card, and board filter.
- Prefer one clear convention over multiple competing patterns.
- Batch renders into one animation frame so repeated updates do not cause unnecessary rerenders.

## Installation

This project uses only browser APIs and plain JavaScript.

1. Clone the repository.
2. Start a static server from the repo root.

```bash
python3 -m http.server 4173
```

3. Open the example app in the browser.

```text
http://localhost:4173/example/
```

## Getting Started

The smallest Dot JS app needs a store, a router, a render function, and a root element.

```js
import { createApp, createRouter, createStore, defineComponent, h } from "./framework.js"

const store = createStore({ count: 0 }, { persistKey: "counter-demo" })

const router = createRouter([
  { path: "/", name: "home" }
])

const Counter = defineComponent(({ count, increment }) => {
  return h(
    "button",
    {
      on: {
        click: increment
      }
    },
    `Clicked ${count} times`
  )
})

function renderApp({ store }) {
  const state = store.getState()

  return h(Counter, {
    count: state.count,
    increment: () => {
      store.update((current) => ({
        ...current,
        count: current.count + 1
      }))
    }
  })
}

createApp({
  root: document.querySelector("#app"),
  store,
  router,
  render: renderApp
})
```

## Framework Convention

Dot JS expects applications to use this structure:

```text
example/
  index.html
  src/
    main.js        # app bootstrap
    app.js         # route-to-view composition
    framework.js   # local re-export of framework API
    components/    # reusable components
    data/          # local seed state
  data/            # remote JSON files used through HTTP
```

This keeps the bootstrap path, shared state, and route ownership predictable for reviewers and future contributors.

## Features

### Elements And Nesting

Use `h(type, props, ...children)` to create elements and nest content.

```js
h(
  "section",
  { className: "panel" },
  h("h2", {}, "Board"),
  h("p", {}, "Nested elements are plain child arguments.")
)
```

### Reusable Components

Use `defineComponent()` for reusable units.

```js
const Badge = defineComponent(({ tone, label }) => {
  return h(
    "span",
    {
      className: "badge",
      style: {
        borderColor: tone
      }
    },
    label
  )
})
```

### State Management

`createStore()` provides shared state, subscriptions, persistence, and batched updates.

```js
const store = createStore({ boards: [] }, { persistKey: "kanban-state" })

store.update((state) => ({
  ...state,
  boards: [...state.boards, newBoard]
}))

store.batch(() => {
  store.update((state) => addCard(state, firstCard))
  store.update((state) => addCard(state, secondCard))
})
```

The `batch()` method is the main performance feature in Dot JS. Multiple updates inside one batch trigger a single notification and one scheduled rerender.

### Routing

`createRouter()` maps the current hash URL to a route object. The route object includes both dynamic params and query values.

```js
const router = createRouter([
  { path: "/", name: "home" },
  { path: "/boards/:boardId", name: "board" },
  { path: "/boards/:boardId/cards/:cardId", name: "card" }
])

router.navigate({
  path: "/boards/product-roadmap",
  query: { q: "api" }
})
```

### Event Handling

Direct events are declared during render with the `on` prop.

```js
h("form", {
  on: {
    submit: {
      preventDefault: true,
      handler: (event) => {
        console.log("submitted", event.currentTarget)
      }
    }
  }
})
```

Delegated events are declared during render with the `delegate` prop.

```js
h("section", {
  delegate: {
    click: [
      {
        selector: "[data-action='remove']",
        stopPropagation: true,
        handler: (_, ctx) => {
          console.log("remove", ctx.delegateTarget.dataset.id)
        }
      }
    ]
  }
})
```

This is different from handing app authors raw `addEventListener()` calls everywhere. Dot JS expects event configuration to stay in the render tree.

### Attributes And Styles

Dot JS supports normal attributes, dataset values, and style objects.

```js
h("button", {
  className: "button",
  attrs: {
    "aria-label": "Save board"
  },
  dataset: {
    boardId: "product-roadmap"
  },
  style: {
    borderColor: "tomato"
  }
})
```

### Forms And User Input

Forms are handled through render-time events.

```js
h("input", {
  value: state.query,
  on: {
    input: (event) => setQuery(event.currentTarget.value)
  }
})
```

### HTTP Requests

Use `createHttpClient()` to keep remote requests consistent.

```js
const http = createHttpClient()
const response = await http.get("./data/remote-work.json")

store.update((state) => ({
  ...state,
  remote: {
    status: "ready",
    templates: response.data.templates
  }
}))
```

## Performance Decision And Validation

Dot JS improves performance by combining two decisions:

1. Store updates can be wrapped in `store.batch()`.
2. Renders are scheduled with one animation frame callback in `createApp()`.

This means repeated updates do not cause one full rerender per update.

### Validation in the example app

The Kanban example includes a bulk action button that adds many cards in one batch. The UI exposes:

- current render count
- last render duration
- average render duration
- the number of renders consumed by the most recent bulk action

Expected outcome:

- a normal single-card action increments the render counter by one
- a bulk add action still consumes one render because the store updates are batched

## Best Practices

- Keep one root store per application.
- Use route params and query values for shareable UI state.
- Keep mutation logic in app actions, not spread across components.
- Prefer delegated events for repeated dynamic children such as card lists.
- Persist only useful application state, not temporary render details.
- Use the HTTP client for remote data so loading and error handling stay consistent.
- Keep components focused: shell, page, and feature components should each have one clear role.
- Follow the project convention so future features land in predictable places.

## How The Example Uses The Framework

The example app demonstrates:

- shared board state persisted between sessions
- favorites and settings shared across pages
- URL-driven board routes, card detail routes, and search filters
- declarative forms for cards and settings
- delegated board actions for move and delete buttons
- HTTP-loaded templates and team guidance from a remote JSON file
- batched bulk updates with render metrics

## Extending The Example

The example already includes features added on top of the original learning version:

- board favorites
- a settings page with persistent preferences
- remote templates loaded over HTTP
- batched bulk card creation with render metrics

A reviewer or teammate can keep extending it with the same conventions. Good next additions are labels, due dates, archived cards, and per-board themes.