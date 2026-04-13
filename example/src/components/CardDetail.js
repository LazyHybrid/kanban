import { defineComponent, h } from "../framework.js"

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