// Seed data gives the example a usable board immediately after first load.
export const seedState = {
  boards: [
    {
      id: "product-roadmap",
      name: "Product Roadmap",
      favorite: true,
      // Columns are nested inside each board in this simple submission data model.
      columns: [
        {
          id: "todo",
          title: "To Do",
          cards: [
            {
              id: "card-1",
              title: "Design release notes page",
              description: "Add a lightweight marketing page for the next release.",
              assignee: "Mika"
            },
            {
              id: "card-2",
              title: "Document routing API",
              description: "Write a short guide for route params and navigation.",
              assignee: "Aino"
            }
          ]
        },
        {
          id: "doing",
          title: "Doing",
          cards: [
            {
              id: "card-3",
              title: "Build shared store",
              description: "Keep board counts and card details synchronized.",
              assignee: "Noah"
            }
          ]
        },
        {
          id: "done",
          title: "Done",
          cards: [
            {
              id: "card-4",
              title: "Create h() helper",
              description: "Element creation is working in the learning build.",
              assignee: "Sara"
            }
          ]
        }
      ]
    },
    {
      id: "team-ops",
      name: "Team Ops",
      favorite: false,
      columns: [
        {
          id: "backlog",
          title: "Backlog",
          cards: [
            {
              id: "card-5",
              title: "Set up review checklist",
              description: "Prepare the final walkthrough for the project demo.",
              assignee: "Rosa"
            }
          ]
        },
        {
          id: "active",
          title: "Active",
          cards: []
        },
        {
          id: "closed",
          title: "Closed",
          cards: []
        }
      ]
    }
  ],
  preferences: {
    theme: "warm",
    preferredAssignee: "Dot Team",
    showRemoteTips: true
  },
  remote: {
    status: "idle",
    error: "",
    templates: [],
    tips: [],
    loadedAt: ""
  },
  performance: {
    lastBulkCount: 0,
    lastBenchmarkStartRenderCount: 0
  }
}