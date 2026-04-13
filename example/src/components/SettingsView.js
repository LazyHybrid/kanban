import { defineComponent, h } from "../framework.js"

// Settings page proving shared state and form handling across routes.
export const SettingsView = defineComponent(({ onReset, onSave, preferences, remoteStatus }) => {
  return h(
    "section",
    { className: "panel stack" },
    h("h2", {}, "Settings"),
    h("p", {}, "Changes here are persisted in shared state and reflected across the dashboard and board pages."),
    h(
      "form",
      {
        className: "settings-form",
        on: {
          submit: {
            preventDefault: true,
            handler: (event) => {
              const formData = new FormData(event.currentTarget)

              onSave({
                theme: formData.get("theme"),
                preferredAssignee: formData.get("preferredAssignee").trim() || "Dot Team",
                showRemoteTips: formData.get("showRemoteTips") === "on"
              })
            }
          }
        }
      },
      h(
        "label",
        { className: "field" },
        h("span", { className: "field__label" }, "Theme"),
        h(
          "select",
          {
            name: "theme",
            value: preferences.theme
          },
          h("option", { value: "warm" }, "Warm"),
          h("option", { value: "forest" }, "Forest"),
          h("option", { value: "ocean" }, "Ocean")
        )
      ),
      h(
        "label",
        { className: "field" },
        h("span", { className: "field__label" }, "Preferred assignee"),
        h("input", {
          name: "preferredAssignee",
          placeholder: "Dot Team",
          value: preferences.preferredAssignee
        })
      ),
      h(
        "label",
        { className: "checkbox" },
        h("input", {
          type: "checkbox",
          name: "showRemoteTips",
          checked: preferences.showRemoteTips
        }),
        h("span", {}, "Show remote HTTP tips on the dashboard")
      ),
      h("p", { className: "status" }, `Remote data status: ${remoteStatus}`),
      h(
        "div",
        { className: "button-row" },
        h("button", { className: "button", type: "submit" }, "Save settings"),
        h(
          "button",
          {
            className: "button button--ghost",
            type: "button",
            on: {
              click: onReset
            }
          },
          "Reset local data"
        )
      )
    )
  )
})