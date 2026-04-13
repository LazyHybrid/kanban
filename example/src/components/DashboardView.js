import { defineComponent, h } from "../framework.js"
import { BoardList } from "./BoardList.js"

// Dashboard page combining board navigation, remote data, and performance validation.
export const DashboardView = defineComponent(({ boards, metrics, navigate, onToggleFavorite, performance, preferences, remote }) => {
  return h(
    "div",
    { className: "dashboard-grid" },
    h(BoardList, {
      boards,
      navigate,
      onToggleFavorite
    }),
    h(
      "section",
      { className: "panel stack" },
      h("h2", {}, "Remote team feed"),
      remote.status === "loading" ? h("p", {}, "Loading remote guidance through the framework HTTP client...") : null,
      remote.status === "error" ? h("p", { className: "status status--error" }, remote.error) : null,
      remote.status === "ready" && preferences.showRemoteTips
        ? h(
            "div",
            { className: "stack" },
            h("p", { className: "status" }, `Loaded ${remote.tips.length} tips and ${remote.templates.length} templates on ${remote.loadedAt}.`),
            h(
              "ul",
              { className: "list" },
              remote.tips.map((tip) =>
                h(
                  "li",
                  { className: "list__item" },
                  h("strong", {}, tip.title),
                  h("p", {}, tip.body)
                )
              )
            )
          )
        : null,
      remote.status === "ready" && !preferences.showRemoteTips
        ? h("p", {}, "Remote tips are loaded but hidden by the settings page.")
        : null
    ),
    h(
      "section",
      { className: "panel stack" },
      h("h2", {}, "Performance validation"),
      h("p", {}, "Dot JS batches store updates and schedules one render per frame. The board view exposes a bulk-add action that validates the behavior."),
      h(
        "div",
        { className: "metrics-grid" },
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Renders"), h("strong", {}, String(metrics.renderCount))),
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Last render"), h("strong", {}, `${metrics.lastRenderMs} ms`)),
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Average"), h("strong", {}, `${metrics.averageRenderMs} ms`))
      ),
      performance.lastBulkCount > 0
        ? h("p", { className: "status" }, `Last bulk add inserted ${performance.lastBulkCount} cards and consumed ${performance.renderDelta || 1} render.`)
        : h("p", {}, "Run the bulk-add action inside a board to capture a benchmark result.")
    ),
    h(
      "section",
      { className: "panel stack" },
      h("h2", {}, "Example extensions"),
      h("p", {}, "This example already extends the original learning build with favorite boards, a settings page, remote templates, and performance validation."),
      h(
        "ol",
        { className: "list" },
        h("li", { className: "list__item" }, "Toggle a favorite board on the dashboard and reopen it on the board page."),
        h("li", { className: "list__item" }, "Open settings and change the theme or default assignee."),
        h("li", { className: "list__item" }, "Load a board and add a remote template card through HTTP-loaded data.")
      ),
      h(
        "button",
        {
          className: "button",
          on: {
            click: () => navigate("/settings")
          }
        },
        "Open settings"
      )
    )
  )
})