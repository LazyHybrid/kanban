import { defineComponent, h } from "../framework.js"
import { CardForm } from "./CardForm.js"

// Applies the URL query filter to each column's card list.
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

// Main board page demonstrating delegated events, forms, and URL-driven detail routes.
export const BoardView = defineComponent(({ board, metrics, navigate, onAddCard, onAddRemoteTemplate, onBulkAdd, onDeleteCard, onMoveCard, onToggleFavorite, performance, preferences, query, remote }) => {
  return h(
    "section",
    {
      className: "board-view stack",
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
              navigate({
                path: `/boards/${board.id}/cards/${ctx.delegateTarget.dataset.cardId}`,
                query: {
                  q: query
                }
              })
            }
          }
        ]
      }
    },
    h(
      "header",
      { className: "panel board-header stack" },
      h(
        "div",
        { className: "board-header__top" },
        h(
          "div",
          { className: "stack stack--tight" },
          h("p", { className: "eyebrow" }, "Board"),
          h("h2", {}, board.name),
          h("p", { className: "board-header__note" }, "This page uses shared state, URL filters, parent-level delegated events, form submissions, and a route-driven detail panel.")
        ),
        h(
          "button",
          {
            className: "button button--ghost",
            on: {
              click: () => onToggleFavorite(board.id)
            }
          },
          board.favorite ? "Unfavorite board" : "Favorite board"
        )
      ),
      h(
        "div",
        { className: "button-row" },
        h(
          "button",
          {
            className: "button",
            on: {
              click: () => onBulkAdd(board.id, board.columns[0].id, 24)
            }
          },
          "Add 24 cards in one batch"
        ),
        h(
          "button",
          {
            className: "button button--ghost",
            disabled: remote.status !== "ready",
            on: {
              click: () => onAddRemoteTemplate(board.id, board.columns[0].id)
            }
          },
          "Add remote template"
        )
      ),
      h(
        "div",
        { className: "metrics-grid" },
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Filter"), h("strong", {}, query || "none")),
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Renders"), h("strong", {}, String(metrics.renderCount))),
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Last bulk"), h("strong", {}, performance.lastBulkCount ? `${performance.lastBulkCount} cards / ${performance.renderDelta || 1} render` : "Not run yet")),
        h("div", { className: "metric-card" }, h("span", { className: "metric-card__label" }, "Default assignee"), h("strong", {}, preferences.preferredAssignee))
      )
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
                      },
                      style: {
                        borderColor: board.favorite ? "rgba(184, 92, 56, 0.5)" : "#d4c3a8"
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
            defaultAssignee: preferences.preferredAssignee,
            onAdd: onAddCard
          })
        )
      })
    )
  )
})