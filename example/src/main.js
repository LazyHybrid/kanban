import { createApp, createHttpClient, createRouter, createStore } from "./framework.js"
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
  { path: "/boards/:boardId/cards/:cardId", name: "card" },
  { path: "/settings", name: "settings" }
])

// The HTTP client loads extra data into the example after boot.
const http = createHttpClient()
const root = document.querySelector("#app")

// Boots the app by connecting the root element, store, router, and render function.
const app = createApp({
  root,
  store,
  router,
  render: renderApp
})

async function loadRemoteData() {
  store.update((current) => ({
    ...current,
    remote: {
      ...current.remote,
      status: "loading",
      error: ""
    }
  }))

  try {
    const response = await http.get("./data/remote-work.json")

    store.update((current) => ({
      ...current,
      remote: {
        status: "ready",
        error: "",
        templates: response.data.templates,
        tips: response.data.tips,
        loadedAt: response.data.loadedAt
      }
    }))
  } catch (error) {
    store.update((current) => ({
      ...current,
      remote: {
        ...current.remote,
        status: "error",
        error: error.message
      }
    }))
  }
}

loadRemoteData()

// Exposes the runtime for manual verification during review.
window.dotKanban = {
  app,
  reloadRemoteData: loadRemoteData,
  router,
  store
}