import React from "react";
import Template7Core from "../template7/Template7Core.jsx";

const TABS = [
  "Overview",
  "Sentiment Analysis",
  "Themes & Topics",
  "Media Coverage",
  "Key Stories",
];

export default function Template7(props) {
  return <Template7Core dashboardId="media_measurement" TABS={TABS} {...props} />;
}
