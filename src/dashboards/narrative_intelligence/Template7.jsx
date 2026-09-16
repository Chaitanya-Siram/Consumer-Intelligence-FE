import React from "react";
import Template7Core from "../template7/Template7Core.jsx";

const TABS = [
  "Overview",
  "Sentiment",
  "Coverage",
  "Channels & Publications",
  "Message Consistency",
];

export default function Template7(props) {
  return <Template7Core dashboardId="narrative_intelligence" TABS={TABS} {...props} />;
}
