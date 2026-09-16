// Guided-tour steps for the Workflow screen. Each step points at a live element
// (by CSS selector) and explains what the user does there. `onEnter` lets a
// step prepare the screen (e.g. select the Data node so its panel is visible).
//
// A step whose target cannot be found renders as a centred card, so the tour
// never breaks when an element is hidden (e.g. tabs before the first save).

export function buildWorkflowTourSteps({ hasProject, focusDataNode, closePanel }) {
  const steps = [
    {
      id: "welcome",
      title: "Build a workflow in five stages",
      body:
        "This short tour walks you through the Workflow screen: adding nodes, filling in the required fields, saving, and running the tagging agent. You can skip at any time.",
      onEnter: closePanel,
    },
    {
      id: "palette",
      target: ".wfside__list",
      placement: "right",
      title: "Modules palette",
      body:
        "These are the five building blocks. Drag one onto the canvas to add it. A workflow always runs in this order: Data → Analysis → Review → Assembly → Output.",
      tip: "Drop a module right after its previous stage and it is connected for you.",
    },
    {
      id: "data",
      target: ".wfnode--data",
      placement: "right",
      title: "Data node — where articles come from",
      body:
        "Every workflow starts with a Data node. Click a node to open its settings on the right. Choose File Upload (CSV / Excel) or REST API (live news from your providers).",
      onEnter: focusDataNode,
    },
    {
      id: "panel",
      target: ".wfpanel",
      placement: "left",
      title: "Required Data fields",
      body:
        "In REST API mode enter a Boolean Query. Then add exactly one Brand Keyword and at least one Message Keyword (press Enter after each). Either a file or an active Data Provider is required.",
    },
    {
      id: "analysis",
      target: ".wfmod--analysis",
      placement: "right",
      title: "Analysis node — run a lens",
      body:
        "Drag Analysis onto the canvas. Pick an Intelligence Lens, an LLM Model and at least one Competitor Keyword. Add one Analysis node per lens; each lens can be used once.",
      onEnter: closePanel,
    },
    {
      id: "review",
      target: ".wfmod--review",
      placement: "right",
      title: "Review node — analyst checkpoint",
      body:
        "Articles below the Flag threshold go to an analyst; articles above the Auto-approve level pass straight through. Nothing here is required — the defaults work well.",
    },
    {
      id: "assembly",
      target: ".wfmod--assembly",
      placement: "right",
      title: "Assembly node — dashboard builder",
      body:
        "Client Name is required. Choose a Dashboard Layout and tick the charts to include on the Dashboard Charts tab.",
    },
    {
      id: "output",
      target: ".wfmod--output",
      placement: "right",
      title: "Output node — publish the dashboard",
      body:
        "Project Name and Project Description are both required. Saving creates the project with these details, and the name becomes the title in the header.",
    },
    {
      id: "edges",
      target: ".react-flow__pane",
      placement: "center",
      title: "Connecting nodes",
      body:
        "To draw an edge, drag from the small handle on a node's right side to the handle on the next node's left side. Edges out of order turn red and block saving. Select an edge and press Delete to remove it.",
    },
    {
      id: "instructions",
      target: "#project-instructions-btn",
      placement: "right",
      title: "Monitoring Instructions",
      body:
        "Optional notes for the tagging agent's Media Monitoring sections — which topics to prioritise or how to group coverage. Stored with the project when you save.",
    },
    {
      id: "controls",
      target: ".react-flow__controls",
      placement: "right",
      title: "Canvas controls",
      body:
        "Zoom, fit view, lock the canvas, and Auto format layout — which arranges the nodes into tidy columns.",
    },
    {
      id: "assistant",
      target: ".wfassist",
      placement: "top",
      title: "Workflow Assistant",
      body:
        "Prefer typing? Describe the workflow you want and the assistant builds the whole graph for you. Review the result, then save.",
    },
    {
      id: "save",
      target: ".wfbtn--flowing-save",
      placement: "bottom",
      title: "Save Workflow",
      body:
        "Validates the graph, creates the project and session, and stores the workflow without processing anything. Missing fields are highlighted in red on each node.",
    },
    {
      id: "run",
      target: ".wfbtn--flowing-run",
      placement: "bottom",
      title: "Save & Run Tagging Agent",
      body:
        "Saves any changes, opens the Review page and starts the tagging agent, which tags every article using your lenses and keywords.",
    },
  ];

  if (hasProject) {
    steps.push({
      id: "tabs",
      target: ".wftop__tabs, .canvas-tabbar",
      placement: "bottom",
      title: "Configure · Review · Output",
      body:
        "Configure is this canvas. Review opens the tagged-article table; Output opens the generated dashboards. Both need a saved workflow with no unsaved changes.",
    });
  }

  steps.push({
    id: "done",
    title: "You're ready",
    body:
      "Data in, five connected stages, and a dashboard out. Open the Tutorial menu again any time to replay this tour or watch the narrated video.",
  });

  return steps;
}
