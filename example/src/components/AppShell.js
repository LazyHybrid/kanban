import { defineComponent, h } from "../framework.js"

// Shared page shell for the example app: header, quick stats, and top navigation.
export const AppShell = defineComponent(({ activeBoard, boardCount, cardCount, children, navigate, query, setQuery }) => {
  return h(
    "div",
    { className: "shell" },
    h(
      "header",
      { className: "hero" },
      h(
        "div",
        { className: "hero__copy" },
        h("p", { className: "eyebrow" }, "Learning example"),
        h("h1", {}, "Mini Kanban on a tiny framework"),
        h(
          "p",
          { className: "hero__text" },
          "This app is small on purpose. Read the framework source, then watch how the example composes state, routing, components, and events."
        )
      ),
      h(
        "div",
        { className: "hero__stats" },
        // These small stats make shared state changes easy to see while learning.
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Boards"), h("strong", {}, String(boardCount))),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Cards"), h("strong", {}, String(cardCount))),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Current"), h("strong", {}, activeBoard ? activeBoard.name : "Dashboard"))
      )
    ),
    h(
      "nav",
      { className: "topbar" },
      h(
        "a",
        {
          href: "#/",
          className: "topbar__link",
          on: {
            click: {
              preventDefault: true,
              handler: () => navigate("/")
            }
          }
        },
        "Dashboard"
      ),
      h("input", {
        className: "search",
        type: "search",
        placeholder: "Filter cards by title or assignee",
        value: query,
        on: {
          // The search box updates shared state so every column reacts together.
          input: (event) => setQuery(event.currentTarget.value)
        }
      })
    ),
    h("main", { className: "content" }, children)
  )
})