import { h } from "./framework.js"
import { AppShell } from "./components/AppShell.js"
import { BoardView } from "./components/BoardView.js"
import { CardDetail } from "./components/CardDetail.js"
import { DashboardView } from "./components/DashboardView.js"
import { SettingsView } from "./components/SettingsView.js"

const themeAccent = {
  warm: "#b85c38",
  forest: "#2f6b50",
  ocean: "#236a8f"
}

// Counts cards for the dashboard summary at the top of the page.
function totalCards(boards) {
  return boards.reduce((sum, board) => {
    return sum + board.columns.reduce((columnSum, column) => columnSum + column.cards.length, 0)
  }, 0)
}

function favoriteBoards(boards) {
  return boards.filter((board) => board.favorite).length
}

// Finds the active board from the current route param.
function findBoard(boards, boardId) {
  return boards.find((board) => board.id === boardId) || null
}

// Finds the active card for the side detail panel.
function findCard(board, cardId) {
  if (!board) {
    return null
  }

  for (const column of board.columns) {
    const card = column.cards.find((item) => item.id === cardId)

    if (card) {
      return card
    }
  }

  return null
}

// Keeps board updates focused so card actions do not rewrite unrelated boards.
function withUpdatedBoard(state, boardId, updateBoard) {
  return {
    ...state,
    boards: state.boards.map((board) => (board.id === boardId ? updateBoard(board) : board))
  }
}

// Creates consistent demo cards for manual actions and benchmarks.
function createCard({ title, description, assignee }) {
  return {
    id: `card-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    description,
    assignee
  }
}

function appendCardToColumn(board, columnId, card) {
  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id !== columnId) {
        return column
      }

      return {
        ...column,
        cards: [...column.cards, card]
      }
    })
  }
}

function currentBoardPath(route, activeBoard, activeCard) {
  if (!activeBoard) {
    return "/"
  }

  if (route.name === "card" && activeCard) {
    return `/boards/${activeBoard.id}/cards/${activeCard.id}`
  }

  return `/boards/${activeBoard.id}`
}

export function renderApp({ store, route, navigate, metrics }) {
  const state = store.getState()
  const activeBoard = route.params.boardId ? findBoard(state.boards, route.params.boardId) : null
  const activeCard = route.params.cardId ? findCard(activeBoard, route.params.cardId) : null
  const query = route.query.q || ""
  const renderDelta = state.performance.lastBenchmarkStartRenderCount
    ? metrics.renderCount - state.performance.lastBenchmarkStartRenderCount
    : 0

  // These actions are passed into components so the UI stays declarative.
  const actions = {
    setSearchQuery(nextQuery) {
      if (!activeBoard) {
        return
      }

      navigate({
        path: currentBoardPath(route, activeBoard, activeCard),
        query: {
          q: nextQuery
        },
        replace: true
      })
    },
    addCard({ boardId, columnId, title, assignee, description }) {
      const fallbackAssignee = assignee || state.preferences.preferredAssignee

      store.update((current) => {
        return withUpdatedBoard(current, boardId, (board) => {
          return appendCardToColumn(board, columnId, createCard({
            title,
            assignee: fallbackAssignee,
            description
          }))
        })
      })
    },
    deleteCard(boardId, columnId, cardId) {
      store.update((current) => {
        return withUpdatedBoard(current, boardId, (board) => ({
          ...board,
          columns: board.columns.map((column) => {
            if (column.id !== columnId) {
              return column
            }

            return {
              ...column,
              cards: column.cards.filter((card) => card.id !== cardId)
            }
          })
        }))
      })

      if (route.params.cardId === cardId) {
        navigate({
          path: `/boards/${boardId}`,
          query: route.query
        })
      }
    },
    moveCard(boardId, columnId, cardId, direction) {
      store.update((current) => {
        return withUpdatedBoard(current, boardId, (board) => {
          const sourceIndex = board.columns.findIndex((column) => column.id === columnId)
          const destinationIndex = sourceIndex + direction

          if (destinationIndex < 0 || destinationIndex >= board.columns.length) {
            return board
          }

          const sourceColumn = board.columns[sourceIndex]
          const card = sourceColumn.cards.find((item) => item.id === cardId)

          if (!card) {
            return board
          }

          return {
            ...board,
            columns: board.columns.map((column, index) => {
              if (index === sourceIndex) {
                return {
                  ...column,
                  cards: column.cards.filter((item) => item.id !== cardId)
                }
              }

              if (index === destinationIndex) {
                return {
                  ...column,
                  cards: [...column.cards, card]
                }
              }

              return column
            })
          }
        })
      })
    },
    toggleFavorite(boardId) {
      store.update((current) => {
        return withUpdatedBoard(current, boardId, (board) => ({
          ...board,
          favorite: !board.favorite
        }))
      })
    },
    saveSettings({ theme, preferredAssignee, showRemoteTips }) {
      store.update((current) => ({
        ...current,
        preferences: {
          theme,
          preferredAssignee,
          showRemoteTips
        }
      }))

      navigate("/")
    },
    resetExample() {
      store.reset()
      if (window.dotKanban?.reloadRemoteData) {
        window.dotKanban.reloadRemoteData()
      }
      navigate("/")
    },
    bulkAddCards(boardId, columnId, count) {
      store.batch(() => {
        for (let index = 0; index < count; index += 1) {
          store.update((current) => {
            return withUpdatedBoard(current, boardId, (board) => {
              return appendCardToColumn(board, columnId, createCard({
                title: `Benchmark card ${index + 1}`,
                description: "Created through store.batch() to validate batched rendering.",
                assignee: current.preferences.preferredAssignee
              }))
            })
          })
        }

        store.update((current) => ({
          ...current,
          performance: {
            lastBulkCount: count,
            lastBenchmarkStartRenderCount: metrics.renderCount
          }
        }))
      })
    },
    addRemoteTemplate(boardId, columnId) {
      const template = state.remote.templates[0]

      if (!template) {
        return
      }

      actions.addCard({
        boardId,
        columnId,
        title: template.title,
        description: template.description,
        assignee: template.assignee
      })
    }
  }

  let pageContent

  // The current route decides which high-level screen the app renders.
  if (route.name === "home") {
    pageContent = h(DashboardView, {
      boards: state.boards,
      metrics,
      navigate,
      onToggleFavorite: actions.toggleFavorite,
      performance: {
        ...state.performance,
        renderDelta
      },
      preferences: state.preferences,
      remote: state.remote
    })
  } else if ((route.name === "board" || route.name === "card") && activeBoard) {
    pageContent = h(
      "div",
      { className: "workspace" },
      h(BoardView, {
        board: activeBoard,
        metrics,
        navigate,
        onAddCard: actions.addCard,
        onAddRemoteTemplate: actions.addRemoteTemplate,
        onBulkAdd: actions.bulkAddCards,
        onDeleteCard: actions.deleteCard,
        onMoveCard: actions.moveCard,
        onToggleFavorite: actions.toggleFavorite,
        performance: {
          ...state.performance,
          renderDelta
        },
        preferences: state.preferences,
        query,
        remote: state.remote
      }),
      h(CardDetail, {
        board: activeBoard,
        card: activeCard,
        close: () => navigate({
          path: `/boards/${activeBoard.id}`,
          query: route.query
        })
      })
    )
  } else if (route.name === "settings") {
    pageContent = h(SettingsView, {
      onReset: actions.resetExample,
      onSave: actions.saveSettings,
      preferences: state.preferences,
      remoteStatus: state.remote.status
    })
  } else {
    pageContent = h(
      "section",
      { className: "panel" },
      h("h2", {}, "Route not found"),
      h("p", {}, "The current hash route does not match a board, card, or settings view."),
      h(
        "button",
        {
          className: "button",
          on: {
            click: () => navigate("/")
          }
        },
        "Back to dashboard"
      )
    )
  }

  return h(
    AppShell,
    {
      activeBoard,
      boardCount: state.boards.length,
      cardCount: totalCards(state.boards),
      currentPage: route.name,
      favoriteCount: favoriteBoards(state.boards),
      navigate,
      query,
      remoteStatus: state.remote.status,
      searchEnabled: route.name === "board" || route.name === "card",
      setQuery: actions.setSearchQuery,
      theme: state.preferences.theme,
      themeAccent: themeAccent[state.preferences.theme] || themeAccent.warm
    },
    pageContent
  )
}