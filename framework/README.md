# Mini Framework

This folder contains a small learning-focused frontend framework.

## Core ideas

The framework is intentionally opinionated and small:

- UI is declared with `h(type, props, ...children)`.
- Components are plain functions wrapped with `defineComponent()`.
- State lives in a shared store created with `createStore()`.
- Routing is handled with a small hash router from `createRouter()`.
- The whole app is mounted with `createApp()`.

## Public API

### `h(type, props, ...children)`

Creates a virtual node description.

```js
h("button", { className: "primary" }, "Save")
```

### `defineComponent(renderFn)`

Wraps a render function so it can be used as a component.

```js
const Badge = defineComponent(({ label }) => h("span", { className: "badge" }, label))
```

### `createStore(initialState, options)`

Creates shared state with subscriptions and optional persistence.

```js
const store = createStore({ count: 0 }, { persistKey: "demo-state" })
store.update((state) => ({ ...state, count: state.count + 1 }))
```

### `createRouter(routes)`

Creates a hash-based router.

```js
const router = createRouter([
  { path: "/", name: "home" },
  { path: "/boards/:boardId", name: "board" }
])
```

### `createApp({ root, store, router, render })`

Mounts the application and rerenders when the store or route changes.

## Event model

Direct events are declared during render with the `on` prop:

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

Delegated events are declared on a parent element with the `delegate` prop:

```js
h("section", {
  delegate: {
    click: [
      {
        selector: "[data-action='remove']",
        handler: (event, ctx) => {
          console.log("remove", ctx.delegateTarget.dataset.id)
        }
      }
    ]
  }
})
```

## Limitations

- The renderer is intentionally simple and rerenders the whole app.
- There is no virtual DOM diffing.
- There are no effects, hooks, or async helpers yet.

Those are good next steps once the core ideas make sense.