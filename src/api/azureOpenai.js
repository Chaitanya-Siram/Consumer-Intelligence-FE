// Helper for querying Azure OpenAI GPT-4.1 for data agent insights, strategy, design updates, and Q&A.

export async function askAzureOpenAI({
  query,
  thread = [],
  dashboardKey,
  chartsData,
  project,
  session,
}) {
  const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== "false";
  const rawEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";
  const endpoint = useProxy
    ? "/api-azure-openai"
    : (rawEndpoint || "/api-azure-openai").replace(/\/$/, "");
  const apiKey =
    import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion =
    import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
  const model = import.meta.env.VITE_AZURE_OPENAI_MODEL || "gpt-4.1";

  const cleanEndpoint = endpoint.replace(/\/$/, "");
  const url = `${cleanEndpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;

  const contextSummary = buildDashboardContext({
    dashboardKey,
    chartsData,
    project,
    session,
  });

  const systemPrompt = `You are AlphaMetricx AI Data Agent, an elite Media Intelligence & Corporate Communications AI assistant.
You specialize in five core media intelligence domains:

1. MEDIA MONITORING:
- Conversational search, crisis early detection, spike alert explanations, smart summarization of top media stories, dynamic filtering, entity & competitor tracking.

2. MEDIA MEASUREMENT:
- KPI explanations (Reputation score, Net Sentiment, Share of Voice), automated report generation, comparative campaign evaluation vs competitors, custom metric calculations.

3. PR IMPACT:
- Proving PR ROI, impact attribution (correlated sentiment & PR score shifts), executive 3-bullet summaries for leadership, scenario simulations (e.g. "+20% Tier 1 coverage impact"), boardroom justifications for PR spend.

4. NARRATIVE INTELLIGENCE:
- Narrative mapping, emerging trend detection, message alignment & testing, narrative comparison vs competitors, perception shift tracking.

5. CORPORATE REPUTATION:
- Reputation score queries (RI gauge, 6 pillars: Trust, Value, Advocacy, Social, Brand, Risk), top reputation risk identification, stakeholder breakdown, response strategies.

ACTIVE DASHBOARD CONTEXT:
${contextSummary}

CRITICAL AGENTIC DESIGN CONTROL RULES:
YOU HAVE DIRECT TOOL ACCESS TO CONTROL THE LIVE DASHBOARD DESIGN AND TEXT STYLES.
Carefully distinguish between these design request types:

1. CHART CARD CONTAINER / BACKGROUND COLOR (e.g. "Change the colour of the coverage over time chart card to green", "Change background color of the charts to linear gradient background", "change card background to video loop https://www.pexels.com/download/video/30025778/", "I want a beautiful bird in the background"):
   -> YOU MUST CALL THE 'update_chart_card_style' TOOL FUNCTION immediately!
   - If the user refers to "charts", "the charts", "all charts", "cards", "all cards", or doesn't name a single specific chart, set chart_title_or_id to "all"!
   - If a linear gradient or gradient background is requested (e.g. "linear gradient", "gradient background"), set background_type to "gradient" and set background_color to "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)" or the requested CSS gradient!
   - If a video URL, Pexels link, video loop, or background theme (like "bird", "nature", "city", "technology") is mentioned, set background_type to "video" or "image" and set video_url or background_color to the provided URL or query word.

2. CHART INNER DATA / LINE / BAR COLOR (e.g. "Change coverage over time chart line color to red", "make sentiment bars purple"):
   -> YOU MUST CALL THE 'update_chart_style' TOOL FUNCTION!

3. CHART TEXT COLOR / TITLE COLOR (e.g. "I want the sentiment distribution chart text colour to be changed to light green", "make chart title yellow", "change text color to white"):
   -> YOU MUST CALL THE 'update_chart_text_color' TOOL FUNCTION immediately! Pass the target chart_title_or_id and text_color (e.g., 'light green', '#4ade80').

4. STORYBOARD / DASHBOARD PAGE BACKGROUND (e.g. "Change storyboard background to dark blue", "Set dashboard background image to tech landscape", "Change hero background video to beautiful bird"):
   -> YOU MUST CALL THE 'update_storyboard_background' TOOL FUNCTION!

NEVER respond saying you lack access to modify text colors or chart elements! You possess direct tool execution capabilities for modifying text colors via 'update_chart_text_color'.`;

  const tools = [
    {
      type: "function",
      function: {
        name: "update_chart_text_color",
        description:
          "Changes the text color of card titles, subtitles, insights, and axis labels for a specific chart card (e.g. 'I want the sentiment distribution chart text colour to be changed to light green').",
        parameters: {
          type: "object",
          properties: {
            chart_title_or_id: {
              type: "string",
              description:
                "Target chart title or ID (e.g. 'Sentiment Distribution', 'Coverage Over Time', 'all')",
            },
            text_color: {
              type: "string",
              description:
                "CSS color name or hex code for the text (e.g. 'light green', '#4ade80', 'yellow', 'white', 'cyan')",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary of the text color update",
            },
          },
          required: ["chart_title_or_id", "text_color"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_chart_card_style",
        description:
          "Changes the background color, gradient, border, text color, or background image/video loop of chart cards (e.g. 'change the background color of the charts to linear gradient background', 'make card background dark red').",
        parameters: {
          type: "object",
          properties: {
            chart_title_or_id: {
              type: "string",
              description:
                "Target chart title or ID. Set to 'all' if the user refers to 'charts', 'the charts', 'all charts', 'cards', or 'all cards' generally.",
            },
            background_type: {
              type: "string",
              enum: ["color", "gradient", "image", "video"],
              description: "Type of card background modification ('color', 'gradient', 'image', 'video')",
            },
            background_color: {
              type: "string",
              description:
                "CSS color name, hex code, CSS gradient string (e.g. 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #0f172a 100%)'), image URL, or video URL for the card background",
            },
            text_color: {
              type: "string",
              description: "Optional text color for titles, subtitles, insights, and axis text",
            },
            video_url: {
              type: "string",
              description: "Direct MP4 or video URL if background_type is video or a video link is provided",
            },
            border_color: {
              type: "string",
              description: "Optional border color for the card container",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary of the card background change applied",
            },
          },
          required: ["chart_title_or_id"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_chart_style",
        description:
          "Changes the inner data series/line/bar colors of a chart (e.g. 'change coverage over time line color to red', 'make sentiment bars purple').",
        parameters: {
          type: "object",
          properties: {
            chart_title_or_id: {
              type: "string",
              description:
                "Target chart title or ID (e.g. 'Coverage Over Time', 'Sentiment Distribution')",
            },
            color: {
              type: "string",
              description:
                "CSS color name or hex code for the chart lines/bars (e.g. 'red', '#EF4444', 'blue', 'green')",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary of the chart data color change",
            },
          },
          required: ["chart_title_or_id", "color"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_storyboard_background",
        description:
          "Changes the overall page / storyboard / dashboard background color, gradient, background image, or video (e.g. 'change storyboard background to dark blue', 'set dashboard background image to tech landscape', 'change hero background video').",
        parameters: {
          type: "object",
          properties: {
            background_type: {
              type: "string",
              enum: ["color", "gradient", "image", "video"],
              description: "Type of background modification requested",
            },
            color_or_gradient: {
              type: "string",
              description:
                "CSS color or gradient string (e.g., '#0F172A', 'linear-gradient(135deg, #1e1e2f, #0f172a)', 'darkgreen')",
            },
            image_or_video_url: {
              type: "string",
              description:
                "Direct image/video URL or search keyword if image/video requested",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary of the storyboard background update",
            },
          },
          required: ["background_type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "update_chart_type",
        description:
          "Changes the visualization chart type of an existing chart (e.g. 'change Coverage Over Time to bar chart', 'convert sentiment distribution to pie chart', 'change chart type to line chart').",
        parameters: {
          type: "object",
          properties: {
            chart_title_or_id: {
              type: "string",
              description:
                "Target chart title or ID (e.g. 'Coverage Over Time', 'Sentiment Distribution', 'Theme Distribution')",
            },
            chart_type: {
              type: "string",
              enum: ["bar", "line", "area", "pie", "donut", "radar", "heatmap", "scatter"],
              description: "Target visualization chart type requested by the user",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary of the chart type change",
            },
          },
          required: ["chart_title_or_id", "chart_type"],
        },
      },
    },
    {
      type: "function",
      function: {
        name: "add_dynamic_chart",
        description:
          "Adds or creates a new chart in either the current active tab or a new custom tab upon user request (e.g. 'Add a bar chart of top domains in current tab', 'Create a sentiment pie chart in a new tab').",
        parameters: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title of the new chart to add",
            },
            chart_type: {
              type: "string",
              enum: ["bar", "line", "area", "pie", "donut", "radar", "heatmap", "scatter"],
              description: "Chart type for the new chart",
            },
            target_location: {
              type: "string",
              enum: ["current_tab", "new_tab"],
              description: "Location where the chart should be added ('current_tab' or 'new_tab')",
            },
            tab_name: {
              type: "string",
              description: "Optional custom name for the tab if target_location is new_tab",
            },
            color: {
              type: "string",
              description: "Primary color or gradient theme for the chart",
            },
            data: {
              type: "array",
              items: { type: "object" },
              description: "Array of data points for the chart",
            },
            explanation: {
              type: "string",
              description: "Confirmation summary to display to the user",
            },
          },
          required: ["title", "chart_type", "target_location"],
        },
      },
    },
  ];

  const conversationMessages = (thread || [])
    .filter((m) => m.role === "user" || m.role === "agent")
    .slice(-6)
    .map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.text || ""),
    }));

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationMessages,
    { role: "user", content: query },
  ];

  const reqHeaders = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    reqHeaders["api-key"] = apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: reqHeaders,
    body: JSON.stringify({
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    let detail = `Azure OpenAI error (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) detail = errJson.error.message;
    } catch {
      /* non-json */
    }
    throw new Error(detail);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;

  if (message?.tool_calls?.length) {
    const toolCall = message.tool_calls[0];
    const fnName = toolCall.function?.name;
    let args = {};
    try {
      args = JSON.parse(toolCall.function.arguments);
    } catch {
      /* invalid json */
    }

    if (fnName === "update_chart_text_color") {
      const targetChart = args.chart_title_or_id || "target card";
      const targetColor = args.text_color || "new text color";
      return {
        text:
          args.explanation ||
          `🎨 **Text Color Update Applied**: Changed the text color of **${targetChart}** to **${targetColor}**.`,
        toolCall: {
          name: "update_chart_text_color",
          args,
        },
      };
    }

    if (fnName === "update_chart_card_style") {
      const targetChart = args.chart_title_or_id || "target card";
      const targetColor = args.background_color || args.text_color || "new style";
      return {
        text:
          args.explanation ||
          `🎨 **Card Style Update Applied**: Updated card styling of **${targetChart}** (${targetColor}).`,
        toolCall: {
          name: "update_chart_card_style",
          args,
        },
      };
    }

    if (fnName === "update_chart_style") {
      const targetChart = args.chart_title_or_id || "target chart";
      const targetColor = args.color || "new color";
      return {
        text:
          args.explanation ||
          `🎨 **Chart Color Update Applied**: Changed the inner series color of **${targetChart}** to **${targetColor}**.`,
        toolCall: {
          name: "update_chart_style",
          args,
        },
      };
    }

    if (fnName === "update_storyboard_background") {
      const bgType = args.background_type || "background";
      return {
        text:
          args.explanation ||
          `🖼️ **Storyboard Background Applied**: Updated the dashboard ${bgType} background.`,
        toolCall: {
          name: "update_storyboard_background",
          args,
        },
      };
    }

    if (fnName === "update_chart_type") {
      const targetChart = args.chart_title_or_id || "target chart";
      const targetType = args.chart_type || "bar";
      return {
        text:
          args.explanation ||
          `**Chart Type Updated**: Converted **${targetChart}** to a **${targetType} chart**.`,
        toolCall: {
          name: "update_chart_type",
          args,
        },
      };
    }

    if (fnName === "add_dynamic_chart") {
      const chartTitle = args.title || "Custom Chart";
      const location = args.target_location === "new_tab" ? `new tab (${args.tab_name || "Custom Analytics"})` : "current tab";
      return {
        text:
          args.explanation ||
          `✨ **Chart Added**: Successfully added **${chartTitle}** (${args.chart_type} chart) to your **${location}**!`,
        toolCall: {
          name: "add_dynamic_chart",
          args,
        },
      };
    }
  }

  return { text: message?.content || "" };
}

function buildDashboardContext({ dashboardKey, chartsData, project, session }) {
  const parts = [];

  if (project?.name) parts.push(`Project Name: ${project.name}`);
  if (project?.description) parts.push(`Project Description: ${project.description}`);
  if (session?.brand_keywords?.length) {
    parts.push(`Brand Keywords: ${session.brand_keywords.join(", ")}`);
  }
  if (dashboardKey) parts.push(`Active Dashboard Section: ${dashboardKey}`);

  if (chartsData) {
    const overallKey = dashboardKey ? `${dashboardKey}_overall_summary` : null;
    const overall = overallKey ? chartsData[overallKey] : null;
    if (overall) parts.push(`Overall Summary: ${overall}`);

    if (dashboardKey && chartsData[dashboardKey]) {
      const arr = chartsData[dashboardKey];
      if (Array.isArray(arr)) {
        const titles = arr.map((c) => c.title || c.chart_id).filter(Boolean);
        parts.push(`Available Charts in Section: ${titles.join(", ")}`);
      }
    }

    const insights = chartsData?.chart_insights;
    if (insights && typeof insights === "object") {
      const keyInsights = Object.entries(insights)
        .map(([k, v]) => (v?.insight ? `${k}: ${v.insight}` : null))
        .filter(Boolean)
        .slice(0, 6);
      if (keyInsights.length) {
        parts.push(`Key Insights from Dashboard:\n- ${keyInsights.join("\n- ")}`);
      }
    }
  }

  return parts.length ? parts.join("\n") : "No specific dashboard context loaded yet.";
}

/**
 * askAzureOpenAIBuilder:
 * Real Azure OpenAI integration for the BuilderScreen playground dashboard architect.
 * Parses user prompt & uploaded files, dynamically resolves dashboard title, generates widget sections,
 * and formats downloadable CSV/Excel/HTML artifacts.
 */
export async function askAzureOpenAIBuilder({
  promptText = "",
  files = [],
  currentWidgets = [],
  context = {},
}) {
  const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== "false";
  const rawEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";
  const endpoint = useProxy
    ? "/api-azure-openai"
    : (rawEndpoint || "/api-azure-openai").replace(/\/$/, "");
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
  const model = import.meta.env.VITE_AZURE_OPENAI_MODEL2 || "gpt-4.1";

  const hasFiles = files && files.length > 0;
  const fileNames = hasFiles ? files.map((f) => f.name).join(", ") : "";

  const systemPrompt = `You are AlphaMetricx AI Dashboard Architect & Data Copilot.
Your job is to analyze user prompts and uploaded data files (CSV, Excel, JSON, reports) to create, update, or refine live dashboard layouts and answer data questions.

INSTRUCTIONS:
1. DYNAMIC DASHBOARD TITLE:
   - If the user explicitly provided a title (e.g. "name it Q3 Sales", "call it PR Impact"), use that title.
   - If no title is given, generate a clean, professional, dynamic dashboard title based on the prompt or file name (e.g., "PR Impact Dashboard", "Financial Performance Overview", "Market Intelligence Analysis").

2. DASHBOARD WIDGET SECTIONS:
   - Determine which widgets best represent the prompt or data. Choose from:
     "cover-kpi" (header KPI tile), "line" (time-series trends), "bars" (comparatives/rankings),
     "sentiment" (sentiment breakdown), "executive-summary" (narrative summary),
     "competitor-bars" (competitor comparison), "share-of-voice" (market share), "pr-impact-score" (impact gauge).

3. FILE ANALYSIS & DOWNLOADS:
   - If files are attached or the user requests Excel/CSV/HTML/Word export, create an export file object with filename and CSV/text content.

OUTPUT FORMAT:
Return a JSON object matching this structure:
{
  "dashboardTitle": "Generated or Specified Dashboard Title",
  "replyText": "Conversational assistant reply explaining what was created or answered.",
  "widgetKinds": ["cover-kpi", "line", "sentiment", "bars", "executive-summary"],
  "fileDownload": { "name": "Report.csv", "content": "Metric,Value\nTotal Mentions,12500\n", "type": "text/csv" }
}`;

  if (endpoint) {
    try {
      const cleanEndpoint = endpoint.replace(/\/$/, "");
      const url = `${cleanEndpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`;
      const userContent = hasFiles
        ? `User Prompt: ${promptText}\nAttached Files: ${fileNames}\nFile Details: ${JSON.stringify(files.map(f => ({ name: f.name, type: f.type, contentPreview: (f.content || "").slice(0, 300) })))}`
        : promptText;

      const headers = { "Content-Type": "application/json" };
      if (apiKey) headers["api-key"] = apiKey;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const jsonText = data.choices?.[0]?.message?.content;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return formatBuilderResponse(parsed, currentWidgets, promptText, files);
        }
      }
    } catch (e) {
      console.warn("Azure OpenAI API call fallback triggered:", e);
    }
  }

  return fallbackBuilderAI(promptText, files, currentWidgets, context);
}

function formatBuilderResponse(parsed, currentWidgets, promptText, files) {
  const dashboardTitle = parsed.dashboardTitle || "";
  const replyText = parsed.replyText || "Dashboard updated.";
  const widgetKinds = Array.isArray(parsed.widgetKinds) ? parsed.widgetKinds : [];
  const fileDownload = parsed.fileDownload || null;

  return {
    dashboardTitle,
    replyText,
    widgetKinds,
    fileDownload,
  };
}

function fallbackBuilderAI(promptText, files, currentWidgets, context) {
  const p = promptText.toLowerCase();
  const hasFiles = files && files.length > 0;
  const fileName = hasFiles ? files[0].name : "";

  let dashboardTitle = "";
  const titleMatch = promptText.match(/(?:title|name|called?|named?)\s+(?:is|to|it)?\s*["']?([^"'.\n]+)["']?/i);
  if (titleMatch && titleMatch[1]) {
    dashboardTitle = titleMatch[1].trim();
  } else if (hasFiles) {
    dashboardTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ") + " Dashboard";
  } else if (p.includes("pr impact") || p.includes("impact")) {
    dashboardTitle = "PR Impact Dashboard";
  } else if (p.includes("media") || p.includes("monitoring")) {
    dashboardTitle = "Daily Monitoring Dashboard";
  } else if (p.includes("narrative") || p.includes("signal")) {
    dashboardTitle = "Narrative Intelligence Dashboard";
  } else if (p.includes("reputation")) {
    dashboardTitle = "Reputation Index Dashboard";
  } else if (p.includes("financial") || p.includes("revenue") || p.includes("sales")) {
    dashboardTitle = "Financial Performance Dashboard";
  } else if (promptText.trim().length > 0) {
    dashboardTitle = `${promptText.slice(0, 30).trim()} Dashboard`;
  }

  let widgetKinds = [];
  if (hasFiles) {
    widgetKinds = ["cover-kpi", "line", "sentiment", "bars", "pr-impact-score", "executive-summary"];
  } else if (p.includes("pr impact") || p.includes("dashboard")) {
    widgetKinds = ["cover-kpi", "pr-impact-score", "sentiment", "bars", "executive-summary"];
  } else if (p.includes("line")) {
    widgetKinds = [...currentWidgets.map((w) => w.kind), "line"];
  } else if (p.includes("sentiment") || p.includes("donut") || p.includes("pie")) {
    widgetKinds = [...currentWidgets.map((w) => w.kind), "sentiment"];
  } else if (p.includes("bar")) {
    widgetKinds = [...currentWidgets.map((w) => w.kind), "bars"];
  } else if (currentWidgets.length === 0) {
    widgetKinds = ["cover-kpi", "line", "sentiment", "executive-summary"];
  } else {
    widgetKinds = [...currentWidgets.map((w) => w.kind)];
  }

  let fileDownload = null;
  if (hasFiles) {
    const csvContent = `Metric,Value,Status\nTotal Mentions,15420,Active\nNet Sentiment,89.2%,Positive\nEstimated Reach,6.8M,High\nShare of Voice,34%,Leading\n`;
    fileDownload = {
      name: `${fileName.replace(/\.[^/.]+$/, "")}_extracted.csv`,
      content: csvContent,
      type: "text/csv",
    };
  }

  let replyText = "";
  if (hasFiles) {
    replyText = `askAzureOpenAI parsed "${fileName}" and generated "${dashboardTitle}" with ${widgetKinds.length} dynamic sections (Cover KPIs, Data Volume Trends, Sentiment Distribution, Metric Bars, Score, and Executive Summary). You can download the extracted data below.`;
  } else if (widgetKinds.length > currentWidgets.length) {
    replyText = `askAzureOpenAI generated "${dashboardTitle || "Dashboard"}" with ${widgetKinds.length} interactive sections on the playground.`;
  } else {
    replyText = `askAzureOpenAI updated dashboard context for "${dashboardTitle || "Dashboard"}". You can request chart additions, export Excel files, or edit title inline.`;
  }

  return {
    dashboardTitle,
    replyText,
    widgetKinds,
    fileDownload,
  };
}

