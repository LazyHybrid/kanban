function flattenChildren(children) {
  return children.flatMap((child) => {
    if (Array.isArray(child)) {
      return flattenChildren(child)
    }

    return child === null || child === undefined || child === false ? [] : [child]
  })
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function h(type, props = {}, ...children) {
  return {
    type,
    props,
    children: flattenChildren(children)
  }
}

export function defineComponent(renderFn) {
  return function component(props, ctx) {
    return renderFn(props, ctx)
  }
}

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

  function persist() {
    if (!persistKey) {
      return
    }

    localStorage.setItem(persistKey, JSON.stringify(state))
  }

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

function getCurrentPath() {
  return window.location.hash.replace(/^#/, "") || "/"
}

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

export function createRouter(routes) {
  const listeners = new Set()
  let currentRoute = resolveRoute(getCurrentPath())

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

function createDomNode(node, ctx) {
  if (typeof node === "string" || typeof node === "number") {
    return document.createTextNode(String(node))
  }

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

export function createApp({ root, store, router, render }) {
  function rerender() {
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