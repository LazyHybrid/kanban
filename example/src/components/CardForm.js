import { defineComponent, h } from "../framework.js"

export const CardForm = defineComponent(({ boardId, columnId, onAdd }) => {
  return h(
    "form",
    {
      className: "card-form",
      on: {
        submit: {
          preventDefault: true,
          handler: (event) => {
            const formData = new FormData(event.currentTarget)
            const title = formData.get("title").trim()
            const assignee = formData.get("assignee").trim()
            const description = formData.get("description").trim()

            if (!title) {
              return
            }

            onAdd({
              boardId,
              columnId,
              title,
              assignee,
              description
            })

            event.currentTarget.reset()
          }
        }
      }
    },
    h("input", { name: "title", placeholder: "New card title", required: true }),
    h("input", { name: "assignee", placeholder: "Assignee" }),
    h("textarea", { name: "description", placeholder: "Short description", rows: "3" }),
    h("button", { className: "button button--ghost", type: "submit" }, "Add card")
  )
})