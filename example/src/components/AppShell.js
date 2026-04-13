import { defineComponent, h } from "../framework.js"

// Shared page shell for the example app: header, navigation, and route-aware search.
export const AppShell = defineComponent(({ activeBoard, boardCount, cardCount, children, currentPage, favoriteCount, navigate, query, remoteStatus, searchEnabled, setQuery, theme, themeAccent }) => {
  return h(
    "div",
    {
      className: "shell",
      dataset: {
        theme
      },
      style: {
        borderTop: `6px solid ${themeAccent}`
      }
    },
    h(
      "header",
      { className: "hero" },
      h(
        "div",
        { className: "hero__copy" },
        h("p", { className: "eyebrow" }, "Submission example"),
        h("h1", {}, "Dot JS Kanban board"),
        h(
          "p",
          { className: "hero__text" },
          "This example demonstrates shared state, URL-driven pages, delegated events, batched rendering, and HTTP-loaded data with no external frontend libraries."
        )
      ),
      h(
        "div",
        { className: "hero__stats" },
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Boards"), h("strong", {}, String(boardCount))),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Cards"), h("strong", {}, String(cardCount))),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Favorites"), h("strong", {}, String(favoriteCount))),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Page"), h("strong", {}, activeBoard ? activeBoard.name : currentPage)),
        h("div", { className: "stat" }, h("span", { className: "stat__label" }, "Remote"), h("strong", {}, remoteStatus))
      )
    ),
    h(
      "nav",
      { className: "topbar" },
      h(
        "div",
        { className: "nav-links" },
        h(
          "a",
          {
            href: "#/",
            className: currentPage === "home" ? "topbar__link topbar__link--active" : "topbar__link",
            on: {
              click: {
                preventDefault: true,
                handler: () => navigate("/")
              }
            }
          },
          "Dashboard"
        ),
        h(
          "a",
          {
            href: "#/settings",
            className: currentPage === "settings" ? "topbar__link topbar__link--active" : "topbar__link",
            on: {
              click: {
                preventDefault: true,
                handler: () => navigate("/settings")
              }
            }
          },
          "Settings"
        )
      ),
      h(
        "div",
        { className: "topbar__tools" },
        h("input", {
          className: "search",
          type: "search",
          placeholder: searchEnabled ? "Filter cards by title or assignee" : "Open a board to filter cards",
          value: query,
          disabled: !searchEnabled,
          on: {
            // The search box updates the URL query so board filters are shareable.
            input: (event) => setQuery(event.currentTarget.value)
          }
        })
      )
    ),
    h("main", { className: "content" }, children)
  )
})