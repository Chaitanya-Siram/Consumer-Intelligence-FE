import React from "react";
import Template7Core from "../template7/Template7Core.jsx";

const TABS = [
  "Overview",
  "Coverage & Sentiment",
  "Share of Voice",
  "PR Impact",
  "Competitive",
];

export default function Template7(props) {
  return <Template7Core dashboardId="pr_impact" TABS={TABS} {...props} />;
}
