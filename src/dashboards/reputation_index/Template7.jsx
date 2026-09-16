import React from "react";
import Template7Core from "../template7/Template7Core.jsx";

const TABS = [
  "Overview",
  "Trust & Sentiment",
  "Pillar Analysis",
  "Risk & Sensitivity",
  "Media Coverage",
];

export default function Template7(props) {
  return <Template7Core dashboardId="reputation_index" TABS={TABS} {...props} />;
}
