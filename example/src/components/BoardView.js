import { defineComponent, h } from "../framework.js"
import { CardForm } from "./CardForm.js"

// Applies the quick search box to each column's card list.
function filteredCards(cards, query) {
  if (!query) {
    return cards
  }

  const normalizedQuery = query.toLowerCase()

  return cards.filter((card) => {
    return [card.title, card.assignee, card.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  })
}

export const BoardView = defineComponent(({ board, navigate, onAddCard, onDeleteCard, onMoveCard, query }) => {
  return h(
    "section",
    {
      className: "board-view",
      // The parent board container handles card actions through delegation.
      delegate: {
        click: [
          {
            selector: "[data-action='delete-card']",
            stopPropagation: true,
            handler: (_, ctx) => {
              const { boardId, columnId, cardId } = ctx.delegateTarget.dataset
              onDeleteCard(boardId, columnId, cardId)
            }
          },
          {
            selector: "[data-action='move-left']",
            stopPropagation: true,
            handler: (_, ctx) => {
              const { boardId, columnId, cardId } = ctx.delegateTarget.dataset
              onMoveCard(boardId, columnId, cardId, -1)
            }
          },
          {
            selector: "[data-action='move-right']",
            stopPropagation: true,
            handler: (_, ctx) => {
              const { boardId, columnId, cardId } = ctx.delegateTarget.dataset
              onMoveCard(boardId, columnId, cardId, 1)
            }
          },
          {
            selector: ".kanban-card",
            handler: (_, ctx) => {
              // Opening a card updates the URL so the detail view is route-driven.
              navigate(`/boards/${board.id}/cards/${ctx.delegateTarget.dataset.cardId}`)
            }
          }
        ]
      }
    },
    h(
      "header",
      { className: "panel board-header" },
      h("div", {}, h("p", { className: "eyebrow" }, "Board"), h("h2", {}, board.name)),
      h("p", { className: "board-header__note" }, "Cards open through a route, while move and delete actions are delegated from the parent board container.")
    ),
    h(
      "div",
      { className: "column-grid" },
      board.columns.map((column, columnIndex) => {
        const visibleCards = filteredCards(column.cards, query)

        return h(
          "section",
          { className: "column" },
          h(
            "div",
            { className: "column__header" },
            h("h3", {}, column.title),
            h("span", { className: "pill" }, String(visibleCards.length))
          ),
          h(
            "div",
            { className: "card-stack" },
            // The column renders only the cards that match the current filter.
            visibleCards.length > 0
              ? visibleCards.map((card) =>
                  h(
                    "article",
                    {
                      className: "kanban-card",
                      dataset: {
                        cardId: card.id
                      }
                    },
                    h("h4", {}, card.title),
                    h("p", {}, card.description || "No description"),
                    h(
                      "div",
                      { className: "kanban-card__footer" },
                      h("span", { className: "tag" }, card.assignee || "Unassigned"),
                      h(
                        "div",
                        { className: "kanban-card__actions" },
                        columnIndex > 0
                          ? h(
                              "button",
                              {
                                type: "button",
                                className: "mini-button",
                                dataset: {
                                  action: "move-left",
                                  boardId: board.id,
                                  columnId: column.id,
                                  cardId: card.id
                                }
                              },
                              "←"
                            )
                          : null,
                        columnIndex < board.columns.length - 1
                          ? h(
                              "button",
                              {
                                type: "button",
                                className: "mini-button",
                                dataset: {
                                  action: "move-right",
                                  boardId: board.id,
                                  columnId: column.id,
                                  cardId: card.id
                                }
                              },
                              "→"
                            )
                          : null,
                        h(
                          "button",
                          {
                            type: "button",
                            className: "mini-button mini-button--danger",
                            dataset: {
                              action: "delete-card",
                              boardId: board.id,
                              columnId: column.id,
                              cardId: card.id
                            }
                          },
                          "Delete"
                        )
                      )
                    )
                  )
                )
              : h("p", { className: "column__empty" }, query ? "No cards match the filter." : "No cards yet.")
          ),
          h(CardForm, {
            boardId: board.id,
            columnId: column.id,
            onAdd: onAddCard
          })
        )
      })
    )
  )
})