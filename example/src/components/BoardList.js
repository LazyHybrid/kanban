import { defineComponent, h } from "../framework.js"

export const BoardList = defineComponent(({ boards, navigate }) => {
  return h(
    "section",
    { className: "panel" },
    h("h2", {}, "Boards"),
    h(
      "div",
      { className: "board-grid" },
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