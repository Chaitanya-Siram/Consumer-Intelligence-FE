const useProxy = import.meta.env.DEV && import.meta.env.VITE_USE_AZURE_PROXY !== "false";
const rawEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || "";
const AZURE_OPENAI_ENDPOINT = useProxy
  ? "/api-azure-openai"
  : (rawEndpoint || "/api-azure-openai").replace(/\/$/, "");
const AZURE_OPENAI_API_KEY = import.meta.env.VITE_AZURE_OPENAI_API_KEY || "";
const AZURE_OPENAI_API_VERSION = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || "2025-03-01-preview";
const AZURE_OPENAI_MODEL = import.meta.env.VITE_AZURE_OPENAI_MODEL || "gpt-4.1";

// Helper to extract code from markdown code blocks
export function extractCode(text) {
  if (!text) return "";
  
  // Try to find code wrapped in ```
  const regex = /```(?:html|jsx|javascript|js|css|typescript|ts)?\s*([\s\S]*?)```/i;
  const match = text.match(regex);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return text.trim();
}

/**
 * Call Azure OpenAI Chat Completion API to generate or edit sandbox code.
 * @param {Object} params
 * @param {string} params.prompt - The user's design/feature request.
 * @param {'html'|'react'|'nextjs'} params.type - The target sandbox framework type.
 * @param {Array} params.history - Array of previous chat messages: [{ role: 'user'|'assistant', content: '...' }]
 * @returns {Promise<{code: string, rawText: string}>}
 */
export async function generateSandboxCode({ prompt, type, history = [] }) {
  const url = `${AZURE_OPENAI_ENDPOINT.replace(/\/$/, "")}/openai/deployments/${AZURE_OPENAI_MODEL}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;
  
  let systemPrompt = "";
  
  if (type === "html") {
    systemPrompt = `You are an expert frontend developer and UI/UX designer.
Generate complete, standalone HTML code based on the user's prompt.
RULES:
1. Output ONLY valid, single-file HTML code. Do NOT wrap it in explanation text.
2. Incorporate modern CSS styling. We pre-load the Tailwind CSS CDN v3 (https://cdn.tailwindcss.com) and FontAwesome (https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css) and Google Fonts 'Inter' and 'Outfit' in the iframe sandbox. Use Tailwind classes extensively for rich glassmorphic, modern, clean styling.
3. Write robust, client-side JavaScript within <script> tags for all interactions, mock statistics, chart elements, animations, and transitions.
4. Make the visual design highly premium, using fine gradients, borders, shadows, smooth transitions, and hover effects.
5. If modifying existing code, return the entire revised code, not just the changes.`;
  } else if (type === "react" || type === "nextjs") {
    const isNext = type === "nextjs";
    systemPrompt = `You are an expert frontend developer and UI/UX designer.
Generate a complete, single-file React component representing the requested application or component.
RULES:
1. Output ONLY valid JavaScript code containing a single React component named 'App' as the main entry point (e.g. export default function App() { ... } or function App() { ... }).
2. Do NOT write ESM imports (like "import React, { useState } from 'react'") at the top because this code will be transpiled and executed directly in the browser using Babel Standalone.
3. Assume that 'React' is available globally. You MUST destructure hooks at the top of your code, or access them via React:
   const { useState, useEffect, useMemo, useCallback, useRef } = React;
4. If the user requested Next.js features (like routing or link navigation), we have pre-configured the following globals in the sandbox which you can use:
   - "useRouter" hook (returns { push(path), pathname: '/', query: {}, back() })
   - "<Link href='...'>..." component (handles clicking cleanly)
   - "recharts" is NOT loaded. Create beautiful mock visual chart bars, areas, and indicators using animated SVG elements or Tailwind layouts.
5. Tailwind CSS is pre-loaded via CDN. Use Tailwind classes for styling. Create a highly premium visual interface with glassmorphic cards, dark/light toggle readiness, vibrant gradients, and elegant typography.
6. Make components fully interactive with responsive layouts.
7. If modifying existing code, return the entire revised code containing the App component, not just a snippet.`;
  }

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: prompt }
  ];

  try {
    const reqHeaders = {
      "Content-Type": "application/json",
    };
    if (AZURE_OPENAI_API_KEY) {
      reqHeaders["api-key"] = AZURE_OPENAI_API_KEY;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: reqHeaders,
      body: JSON.stringify({
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.error?.message || `${response.status} ${response.statusText}`;
      throw new Error(`Azure OpenAI Error: ${message}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    const code = extractCode(rawText);
    
    return {
      code,
      rawText
    };
  } catch (error) {
    console.error("API Error in generateSandboxCode:", error);
    throw error;
  }
}
