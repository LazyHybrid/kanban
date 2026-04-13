// Normalizes nested child arrays so components can return mixed structures safely.
function flattenChildren(children) {
  return children.flatMap((child) => {
    if (Array.isArray(child)) {
      return flattenChildren(child)
    }

    return child === null || child === undefined || child === false ? [] : [child]
  })
}

// Creates a plain deep copy for the small store implementation.
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

// Creates the object shape the renderer understands.
export function h(type, props = {}, ...children) {
  return {
    type,
    props,
    children: flattenChildren(children)
  }
}

// Keeps components as plain functions while making the intent explicit.
export function defineComponent(renderFn) {
  return function component(props, ctx) {
    return renderFn(props, ctx)
  }
}

// Shared app state with subscriptions and optional localStorage persistence.
export function createStore(initialState, options = {}) {
  const { persistKey } = options
  const listeners = new Set()
  let state = clone(initialState)

  if (persistKey) {
    const saved = localStorage.getItem(persistKey)

    if (saved) {
      try {
        state = JSON.parse(saved)
      } catch {
        state = clone(initialState)
      }
    }
  }

  // Persists state after every update so reloads keep the latest board data.
  function persist() {
    if (!persistKey) {
      return
    }

    localStorage.setItem(persistKey, JSON.stringify(state))
  }

  // Notifies the app to rerender after the store changes.
  function notify() {
    persist()
    listeners.forEach((listener) => listener(state))
  }

  return {
    getState() {
      return state
    },
    setState(nextState) {
      state = nextState
      notify()
    },
    update(updater) {
      state = updater(state)
      notify()
    },
    reset() {
      state = clone(initialState)
      notify()
    },
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }
  }
}

// Reads the current hash so the example can route without a backend server.
function getCurrentPath() {
  return window.location.hash.replace(/^#/, "") || "/"
}

// Matches simple routes like /boards/:boardId and extracts params.
function matchPath(pattern, path) {
  const patternParts = pattern.split("/").filter(Boolean)
  const pathParts = path.split("/").filter(Boolean)

  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params = {}

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
      continue
    }

    if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

// Small hash router that rerenders the app when the URL changes.
export function createRouter(routes) {
  const listeners = new Set()
  let currentRoute = resolveRoute(getCurrentPath())

  // Finds the first matching route and falls back to a not-found view.
  function resolveRoute(path) {
    for (const route of routes) {
      const params = matchPath(route.path, path)

      if (params) {
        return {
          ...route,
          url: path,
          params
        }
      }
    }

    return {
      name: "not-found",
      path: "*",
      url: path,
      params: {}
    }
  }

  // Updates the cached route and informs subscribers.
  function notify() {
    currentRoute = resolveRoute(getCurrentPath())
    listeners.forEach((listener) => listener(currentRoute))
  }

  return {
    getRoute() {
      return currentRoute
    },
    navigate(path) {
      if (getCurrentPath() === path) {
        notify()
        return
      }

      window.location.hash = path
    },
    start() {
      window.addEventListener("hashchange", notify)
      notify()

      return () => {
        window.removeEventListener("hashchange", notify)
      }
    },
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }
  }
}

// Runs event helpers before calling the final handler.
function applyEventSpec(event, spec, ctx) {
  if (typeof spec === "function") {
    spec(event, ctx)
    return
  }

  if (spec.preventDefault) {
    event.preventDefault()
  }

  if (spec.stopPropagation) {
    event.stopPropagation()
  }

  spec.handler(event, ctx)
}

// Maps framework props to real DOM attributes, styles, and events.
function applyProps(element, props, ctx) {
  Object.entries(props).forEach(([key, value]) => {
    if (key === "children" || value === null || value === undefined) {
      return
    }

    if (key === "className") {
      element.setAttribute("class", value)
      return
    }

    if (key === "style" && typeof value === "object") {
      Object.assign(element.style, value)
      return
    }

    if (key === "dataset" && typeof value === "object") {
      Object.entries(value).forEach(([datasetKey, datasetValue]) => {
        element.dataset[datasetKey] = datasetValue
      })
      return
    }

    // Direct events are attached when the element is created.
    if (key === "on" && typeof value === "object") {
      Object.entries(value).forEach(([eventName, spec]) => {
        element.addEventListener(eventName, (event) => {
          applyEventSpec(event, spec, {
            ...ctx,
            currentTarget: element
          })
        })
      })
      return
    }

    // Delegated events let one parent manage clicks for many child elements.
    if (key === "delegate" && typeof value === "object") {
      Object.entries(value).forEach(([eventName, specs]) => {
        element.addEventListener(eventName, (event) => {
          const origin = event.target instanceof Element ? event.target : event.target.parentElement

          if (!origin) {
            return
          }

          for (const spec of specs) {
            const matched = origin.closest(spec.selector)

            if (!matched || !element.contains(matched)) {
              continue
            }

            applyEventSpec(event, spec, {
              ...ctx,
              currentTarget: element,
              delegateTarget: matched
            })
            break
          }
        })
      })
      return
    }

    if (key === "value") {
      element.value = value
      return
    }

    if (key === "checked") {
      element.checked = value
      return
    }

    if (typeof value === "boolean") {
      if (value) {
        element.setAttribute(key, "")
      }
      return
    }

    element.setAttribute(key, value)
  })
}

// Turns a virtual node tree into real DOM nodes.
function createDomNode(node, ctx) {
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(String(node))
  }

    // Function components are resolved before creating DOM.
  if (typeof node.type === "function") {
    return createDomNode(node.type({ ...node.props, children: node.children }, ctx), ctx)
  }

  const element = document.createElement(node.type)
  applyProps(element, node.props || {}, ctx)

  node.children.forEach((child) => {
    element.appendChild(createDomNode(child, ctx))
  })

  return element
}

// Wires the store and router to a single render function.
export function createApp({ root, store, router, render }) {
  function rerender() {
    // This tiny example replaces the full tree on each update for simplicity.
    const view = render({
      store,
      route: router.getRoute(),
      navigate: router.navigate
    })

    root.replaceChildren(createDomNode(view, {
      store,
      route: router.getRoute(),
      navigate: router.navigate
    }))
  }

  const stopRouter = router.start()
  const unsubStore = store.subscribe(rerender)
  const unsubRoute = router.subscribe(rerender)

  rerender()

  return {
    destroy() {
      stopRouter()
      unsubStore()
      unsubRoute()
      root.replaceChildren()
    }
  }
}