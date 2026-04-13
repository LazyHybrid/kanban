import { createApp, createRouter, createStore } from "./framework.js"
import { seedState } from "./data/seed.js"
import { renderApp } from "./app.js"

// Creates one shared store for the whole example and keeps it across page reloads.
const store = createStore(seedState, {
  persistKey: "mini-kanban-state"
})

// Hash routes keep the demo easy to run on any simple static server.
const router = createRouter([
  { path: "/", name: "home" },
  { path: "/boards/:boardId", name: "board" },
  { path: "/boards/:boardId/cards/:cardId", name: "card" }
])

const root = document.querySelector("#app")

// Boots the app by connecting the root element, store, router, and render function.
createApp({
  root,
  store,
  router,
  render: renderApp
})