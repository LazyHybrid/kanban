import { createApp, createRouter, createStore } from "./framework.js"
import { seedState } from "./data/seed.js"
import { renderApp } from "./app.js"

const store = createStore(seedState, {
  persistKey: "mini-kanban-state"
})

const router = createRouter([
  { path: "/", name: "home" },
  { path: "/boards/:boardId", name: "board" },
  { path: "/boards/:boardId/cards/:cardId", name: "card" }
])

const root = document.querySelector("#app")

createApp({
  root,
  store,
  router,
  render: renderApp
})