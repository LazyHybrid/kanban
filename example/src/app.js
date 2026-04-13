import { h } from "./framework.js"
import { AppShell } from "./components/AppShell.js"
import { BoardList } from "./components/BoardList.js"
import { BoardView } from "./components/BoardView.js"
import { CardDetail } from "./components/CardDetail.js"

// Counts cards for the small dashboard summary at the top of the page.
function totalCards(boards) {
  return boards.reduce((sum, board) => {
    return sum + board.columns.reduce((columnSum, column) => columnSum + column.cards.length, 0)
  }, 0)
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

// Generates simple demo ids for new cards.
function createCardId() {
  return `card-${Date.now()}`
}

export function renderApp({ store, route, navigate }) {
  const state = store.getState()
  const activeBoard = route.params.boardId ? findBoard(state.boards, route.params.boardId) : null
  const activeCard = route.params.cardId ? findCard(activeBoard, route.params.cardId) : null

  // These actions are passed into components so the UI stays declarative.
  const actions = {
    setQuery(query) {
      store.update((current) => ({
        ...current,
        query
      }))
    },
    addCard({ boardId, columnId, title, assignee, description }) {
      store.update((current) => {
        return withUpdatedBoard(current, boardId, (board) => ({
          ...board,
          columns: board.columns.map((column) => {
            if (column.id !== columnId) {
              return column
            }

            return {
              ...column,
              cards: [
                ...column.cards,
                {
                  id: createCardId(),
                  title,
                  assignee,
                  description
                }
              ]
            }
          })
        }))
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

      // If the open detail card was deleted, move the user back to the board route.
      if (route.params.cardId === cardId) {
        navigate(`/boards/${boardId}`)
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
    }
  }

  let pageContent

  // The current route decides which high-level screen the app renders.
  if (route.name === "home") {
    pageContent = h(BoardList, {
      boards: state.boards,
      navigate
    })
  } else if ((route.name === "board" || route.name === "card") && activeBoard) {
    pageContent = h(
      "div",
      { className: "workspace" },
      h(BoardView, {
        board: activeBoard,
        navigate,
        query: state.query,
        onAddCard: actions.addCard,
        onDeleteCard: actions.deleteCard,
        onMoveCard: actions.moveCard
      }),
      h(CardDetail, {
        board: activeBoard,
        card: activeCard,
        close: () => navigate(`/boards/${activeBoard.id}`)
      })
    )
  } else {
    pageContent = h(
      "section",
      { className: "panel" },
      h("h2", {}, "Route not found"),
      h("p", {}, "The current hash route does not match a board or dashboard view."),
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
      navigate,
      query: state.query,
      setQuery: actions.setQuery
    },
    pageContent
  )
}