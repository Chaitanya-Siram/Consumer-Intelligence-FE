// Narration script for the Workflow screen walkthrough video (target ≈ 2½ min).
//
// Each scene has a short on-screen caption and a list of steps. Every step is
// one spoken segment (macOS text-to-speech) paired with an action key that the
// recorder performs while that segment plays. Keep `text` short and warm; it is
// read aloud. Action keys are implemented in record-workflow-tutorial.mjs.

export const SCENES = [
  {
    id: "intro",
    caption: "The Workflow screen",
    steps: [
      { key: "idle", text: "Welcome to the Workflow screen, where you design how a media analysis project runs, from raw articles to a finished dashboard." },
      { key: "hoverPalette", text: "On the left is the Modules palette with five building blocks: Data, Analysis, Review, Assembly, and Output. You drag them onto the canvas in that order." },
      { key: "hoverActions", text: "In the header, Save Workflow stores your design, and Save and Run Tagging Agent starts the processing." },
    ],
  },
  {
    id: "data",
    caption: "Data node",
    steps: [
      { key: "openDataNode", text: "Every workflow starts with a Data node. Click it to open its settings on the right." },
      { key: "clickRestApi", text: "Choose File Upload for a spreadsheet of articles, or REST API to pull live news from your connected providers." },
      { key: "typeQuery", text: "Enter a Boolean search query." },
      { key: "typeBrand", text: "Add exactly one brand keyword." },
      { key: "typeMessageKeywords", text: "Then add at least one message keyword. These are the themes you want tracked." },
    ],
  },
  {
    id: "analysis",
    caption: "Analysis node",
    steps: [
      { key: "dropAnalysis", text: "Now drag an Analysis module onto the canvas. It connects to the Data node for you." },
      { key: "selectLens", text: "Pick an Intelligence Lens, such as Media Measurement," },
      { key: "selectLlm", text: "the language model that performs the tagging," },
      { key: "typeCompetitors", text: "and the competitor brands you measure against. Add one Analysis node for each lens you need." },
    ],
  },
  {
    id: "review",
    caption: "Review node",
    steps: [
      { key: "dropReview", text: "Next, drop a Review node. This is the analyst checkpoint." },
      { key: "setThresholds", text: "Articles below the flag threshold go to an analyst, and articles above the auto-approve level pass straight through. The defaults work well." },
    ],
  },
  {
    id: "assembly",
    caption: "Assembly node",
    steps: [
      { key: "dropAssembly", text: "The Assembly node builds the dashboard." },
      { key: "typeClientName", text: "Enter the client name, which is required," },
      { key: "selectLayoutAndChart", text: "choose a layout, and tick the charts you want to include." },
    ],
  },
  {
    id: "output",
    caption: "Output node",
    steps: [
      { key: "dropOutput", text: "Finally, drop an Output node to complete the chain." },
      { key: "typeProject", text: "Give the project a name and a description. Both are required, because saving creates the project with these details." },
    ],
  },
  {
    id: "save",
    caption: "Save Workflow",
    steps: [
      { key: "deselectAndFormat", text: "Edges must follow the pipeline order, or they turn red. Any missing field is highlighted when you save, and the auto-format button tidies the layout." },
      { key: "clickSave", text: "Click Save Workflow. The project and session are created, and the Configure, Review, and Output tabs appear." },
    ],
  },
  {
    id: "run",
    caption: "Save & Run Tagging Agent",
    steps: [
      { key: "clickRun", text: "When you're ready, click Save and Run Tagging Agent. The Review page opens and the agent starts tagging your articles." },
      { key: "idle", text: "And that's it: data in, five connected stages, and a dashboard out." },
    ],
  },
];
