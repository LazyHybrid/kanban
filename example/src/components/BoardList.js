import { defineComponent, h } from "../framework.js"

// Simple dashboard view that links into each board route.
export const BoardList = defineComponent(({ boards, navigate }) => {
  return h(
    "section",
    { className: "panel" },
    h("h2", {}, "Boards"),
    h(
      "div",
      { className: "board-grid" },
      // Each tile is a small reusable summary of a board.
      boards.map((board) =>
        h(
          "article",
          { className: "board-tile" },
          h("h3", {}, board.name),
          h("p", {}, `${board.columns.length} columns`),
          h(
            "button",
            {
              className: "button",
              on: {
                click: () => navigate(`/boards/${board.id}`)
              }
            },
            "Open board"
          )
        )
      )
    )
  )
})