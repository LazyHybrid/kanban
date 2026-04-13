import { defineComponent, h } from "../framework.js"

// Dashboard view that links into each board route and toggles favorites.
export const BoardList = defineComponent(({ boards, navigate, onToggleFavorite }) => {
  return h(
    "section",
    { className: "panel stack" },
    h("h2", {}, "Boards"),
    h("p", {}, "Each board tile demonstrates reusable components, inline styles, route navigation, and render-time events."),
    h(
      "div",
      { className: "board-grid" },
      boards.map((board) =>
        h(
          "article",
          {
            className: "board-tile",
            style: {
              borderColor: board.favorite ? "#b85c38" : "rgba(212, 195, 168, 0.8)"
            }
          },
          h(
            "div",
            { className: "board-tile__header" },
            h("h3", {}, board.name),
            h(
              "button",
              {
                className: board.favorite ? "mini-button mini-button--favorite" : "mini-button",
                attrs: {
                  "aria-label": `Toggle favorite for ${board.name}`
                },
                on: {
                  click: {
                    stopPropagation: true,
                    handler: () => onToggleFavorite(board.id)
                  }
                }
              },
              board.favorite ? "★" : "☆"
            )
          ),
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