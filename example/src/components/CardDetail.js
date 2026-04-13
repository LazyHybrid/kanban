import { defineComponent, h } from "../framework.js"

// Side panel that reflects the card currently selected by the URL.
export const CardDetail = defineComponent(({ board, card, close }) => {
  if (!board || !card) {
    return h(
      "aside",
      { className: "detail detail--empty" },
      h("h3", {}, "No card selected"),
      h("p", {}, "Pick a card from the board to inspect its details.")
    )
  }

  return h(
    "aside",
    { className: "detail" },
    // This stays read-only in the learning build so the route behavior is easier to follow.
    h("p", { className: "eyebrow" }, board.name),
    h("h3", {}, card.title),
    h("p", {}, card.description || "No description yet."),
    h("p", { className: "detail__meta" }, `Assignee: ${card.assignee || "Unassigned"}`),
    h(
      "button",
      {
        className: "button",
        on: {
          click: close
        }
      },
      "Close detail"
    )
  )
})