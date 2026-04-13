// Normalizes nested child arrays so components can return mixed structures safely.
function flattenChildren(children) {
  return children.flatMap((child) => {
    if (Array.isArray(child)) {
      return flattenChildren(child)
    }

    return child === null || child === undefined || child === false || child === true ? [] : [child]
  })
}

// Creates a plain deep copy for the store implementation.
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

// Shared app state with subscriptions, batching, and optional localStorage persistence.
export function createStore(initialState, options = {}) {
  const { persistKey } = options
  const listeners = new Set()
  let state = clone(initialState)
  let batchDepth = 0
  let pendingNotify = false

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

  // Persists state after updates so reloads keep the latest app data.
  function persist() {
    if (!persistKey) {
      return
    }

    localStorage.setItem(persistKey, JSON.stringify(state))
  }

  // Flushes one notification after single updates or a completed batch.
  function flush() {
    pendingNotify = false
    persist()
    listeners.forEach((listener) => listener(state))
  }

  function notify() {
    if (batchDepth > 0) {
      pendingNotify = true
      return
    }

    flush()
  }

  const api = {
    getState() {
      return state
    },
    setState(nextState) {
      state = nextState
      notify()
    },
    patch(partialState) {
      state = {
        ...state,
        ...partialState
      }
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
    batch(callback) {
      batchDepth += 1

      try {
        return callback(api)
      } finally {
        batchDepth -= 1

        if (batchDepth === 0 && pendingNotify) {
          flush()
        }
      }
    },
    subscribe(listener) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }
  }

  return api
}

function parseQuery(queryString) {
  const params = {}
  const searchParams = new URLSearchParams(queryString)

  searchParams.forEach((value, key) => {
    params[key] = value
  })

  return params
}

function serializeQuery(query = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return
    }

    searchParams.set(key, String(value))
  })

  const result = searchParams.toString()
  return result ? `?${result}` : ""
}

// Reads the current hash so the example can route without a backend server.
function getCurrentLocation() {
  const raw = window.location.hash.replace(/^#/, "") || "/"
  const [pathname, queryString = ""] = raw.split("?")

  return {
    pathname: pathname || "/",
    query: parseQuery(queryString),
    url: raw
  }
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

function normalizeNavigationTarget(target) {
  if (typeof target === "string") {
    const [path, queryString = ""] = target.split("?")

    return {
      path: path || "/",
      query: parseQuery(queryString),
      replace: false
    }
  }

  return {
    path: target.path || "/",
    query: target.query || {},
    replace: Boolean(target.replace)
  }
}

// Small hash router that rerenders the app when the URL changes.
export function createRouter(routes) {
  const listeners = new Set()
  let currentRoute = resolveRoute(getCurrentLocation())

  // Finds the first matching route and falls back to a not-found view.
  function resolveRoute(location) {
    for (const route of routes) {
      const params = matchPath(route.path, location.pathname)

      if (params) {
        return {
          ...route,
          params,
          pathname: location.pathname,
          query: location.query,
          url: location.url
        }
      }
    }

    return {
      name: "not-found",
      path: "*",
      params: {},
      pathname: location.pathname,
      query: location.query,
      url: location.url
    }
  }

  // Updates the cached route and informs subscribers.
  function notify() {
    currentRoute = resolveRoute(getCurrentLocation())
    listeners.forEach((listener) => listener(currentRoute))
  }

  return {
    getRoute() {
      return currentRoute
    },
    navigate(target) {
      const normalized = normalizeNavigationTarget(target)
      const nextUrl = `${normalized.path}${serializeQuery(normalized.query)}`

      if (currentRoute.url === nextUrl) {
        notify()
        return
      }

      if (normalized.replace) {
        window.history.replaceState(null, "", `#${nextUrl}`)
        notify()
        return
      }

      window.location.hash = nextUrl
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

function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  return response.text()
}

// Small fetch wrapper that keeps HTTP usage consistent across apps.
export function createHttpClient({ baseUrl = "" } = {}) {
  async function request(path, options = {}) {
    const { json, headers = {}, ...rest } = options
    const url = baseUrl ? new URL(path, baseUrl).toString() : path
    const requestHeaders = {
      Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
      ...headers
    }

    const response = await fetch(url, {
      ...rest,
      headers: json ? { "Content-Type": "application/json", ...requestHeaders } : requestHeaders,
      body: json ? JSON.stringify(json) : rest.body
    })

    const data = await readResponseBody(response)

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      error.status = response.status
      error.data = data
      throw error
    }

    return {
      status: response.status,
      data,
      headers: response.headers
    }
  }

  return {
    request,
    get(path, options = {}) {
      return request(path, {
        ...options,
        method: "GET"
      })
    },
    post(path, json, options = {}) {
      return request(path, {
        ...options,
        json,
        method: "POST"
      })
    },
    put(path, json, options = {}) {
      return request(path, {
        ...options,
        json,
        method: "PUT"
      })
    },
    patch(path, json, options = {}) {
      return request(path, {
        ...options,
        json,
        method: "PATCH"
      })
    },
    delete(path, options = {}) {
      return request(path, {
        ...options,
        method: "DELETE"
      })
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

function applyStyles(element, styles) {
  Object.entries(styles).forEach(([styleKey, styleValue]) => {
    if (styleKey.startsWith("--")) {
      element.style.setProperty(styleKey, styleValue)
      return
    }

    element.style[styleKey] = styleValue
  })
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
      applyStyles(element, value)
      return
    }

    if (key === "attrs" && typeof value === "object") {
      Object.entries(value).forEach(([attrKey, attrValue]) => {
        element.setAttribute(attrKey, attrValue)
      })
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

  node.children.forEach((child) => {
    element.appendChild(createDomNode(child, ctx))
  })

  applyProps(element, node.props || {}, ctx)

  return element
}

function scheduleFrame(callback) {
  if (typeof window.requestAnimationFrame === "function") {
    return window.requestAnimationFrame(callback)
  }

  return window.setTimeout(callback, 16)
}

function cancelFrame(handle) {
  if (typeof window.cancelAnimationFrame === "function") {
    window.cancelAnimationFrame(handle)
    return
  }

  window.clearTimeout(handle)
}

// Wires the store and router to a single render function and batches renders per frame.
export function createApp({ root, store, router, render }) {
  let renderCount = 0
  let totalRenderMs = 0
  let lastRenderMs = 0
  let frameHandle = null
  let scheduled = false
  let destroyed = false

  function getMetrics() {
    return {
      renderCount,
      lastRenderMs: Number(lastRenderMs.toFixed(2)),
      averageRenderMs: Number((renderCount === 0 ? 0 : totalRenderMs / renderCount).toFixed(2)),
      isRenderScheduled: scheduled
    }
  }

  function runRender() {
    scheduled = false
    frameHandle = null
    renderCount += 1

    const start = performance.now()
    const route = router.getRoute()
    const metrics = getMetrics()
    const view = render({
      store,
      route,
      navigate: router.navigate,
      metrics
    })

    root.replaceChildren(createDomNode(view, {
      store,
      route,
      navigate: router.navigate,
      metrics
    }))

    lastRenderMs = performance.now() - start
    totalRenderMs += lastRenderMs
  }

  function scheduleRender() {
    if (destroyed || scheduled) {
      return
    }

    scheduled = true
    frameHandle = scheduleFrame(runRender)
  }

  const stopRouter = router.start()
  const unsubStore = store.subscribe(scheduleRender)
  const unsubRoute = router.subscribe(scheduleRender)

  scheduleRender()

  return {
    destroy() {
      destroyed = true

      if (frameHandle !== null) {
        cancelFrame(frameHandle)
      }

      stopRouter()
      unsubStore()
      unsubRoute()
      root.replaceChildren()
    },
    getMetrics
  }
}