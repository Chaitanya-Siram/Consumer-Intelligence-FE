import { useState, useEffect, useRef } from "react";
import { generateSandboxCode } from "../api/sandboxOpenAi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Predefined template presets
const PRESET_TEMPLATES = [
  {
    id: "html-landing",
    name: "Glassmorphic Landing Page",
    desc: "A stunning marketing layout with glowing backdrops, interactive tabs, cards, and micro-interactions.",
    type: "html",
    code: `<!-- Complete Glassmorphic Marketing Page -->
<div class="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-8 font-sans">
  <header class="flex justify-between items-center pb-6 border-b border-slate-800">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30">A</div>
      <span class="text-xl font-bold tracking-tight">Aura Analytics</span>
    </div>
    <nav class="flex gap-6 text-sm text-slate-400 font-medium">
      <a href="#" class="hover:text-white transition">Features</a>
      <a href="#" class="hover:text-white transition">Pricing</a>
      <a href="#" class="hover:text-white transition">Resources</a>
    </nav>
    <button onclick="console.log('Sign in clicked')" class="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-semibold transition shadow-md shadow-indigo-600/20">Get Started</button>
  </header>
  
  <main class="flex-1 py-16 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6 animate-pulse">
      <span class="w-2 bg-indigo-400 rounded-full h-2"></span>
      Introducing v2.5 Sandbox
    </div>
    <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
      Generate, Render & Test <br><span class="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">AI Interfaces Live</span>
    </h1>
    <p class="text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
      Build premium dashboards, interactive micro-frontends, and component prototypes directly inside the sandboxed workspace with real-time feedback.
    </p>
    <div class="flex gap-4">
      <button onclick="alert('Welcome to the Sandbox!')" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5">Explore Sandbox</button>
      <button onclick="console.log('User requested documentation')" class="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl transition">View API Docs</button>
    </div>
  </main>
  
  <footer class="pt-6 border-t border-slate-900 text-center text-xs text-slate-500">
    &copy; 2026 Aura Analytics. All rights reserved.
  </footer>
</div>`
  },
  {
    id: "react-counter",
    name: "Interactive State Counter",
    desc: "A React component using hooks (useState/useEffect) and an action event log list to track component clicks.",
    type: "react",
    code: `// A clean, styled React Component
function App() {
  const { useState, useEffect } = React;
  const [count, setCount] = useState(0);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [\`[\${new Date().toLocaleTimeString()}] \${msg}\`, ...prev].slice(0, 5));
    console.log("Component Action:", msg);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl bg-opacity-70">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Interactive Counter</h2>
        <p className="text-sm text-zinc-400 mb-6">A reactive state component running live inside the iframe sandbox.</p>
        
        <div className="flex flex-col items-center justify-center py-8 bg-zinc-950 rounded-xl border border-zinc-800 mb-6">
          <span className="text-6xl font-extrabold text-indigo-450 mb-4">{count}</span>
          <div className="flex gap-3">
            <button 
              onClick={() => { setCount(c => c - 1); addLog('Decremented value'); }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 rounded-lg font-semibold transition"
            >
              - Decrement
            </button>
            <button 
              onClick={() => { setCount(c => c + 1); addLog('Incremented value'); }}
              className="px-4 py-2 bg-indigo-650 hover:bg-indigo-550 active:scale-95 text-white rounded-lg font-semibold transition shadow-lg shadow-indigo-600/25"
            >
              + Increment
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Component Events Log</h4>
          <div className="space-y-1 font-mono text-[11px] text-emerald-400">
            {logs.length === 0 ? (
              <span className="text-zinc-600 italic">No events triggered yet...</span>
            ) : (
              logs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    id: "nextjs-dashboard",
    name: "PR Metrics Portal (Next.js)",
    desc: "A Next.js dashboard template that exercises router.push(), layout tabs, and responsive custom charts.",
    type: "nextjs",
    code: `// Next.js styled telemetry portal
function App() {
  const { useState } = React;
  const router = useRouter(); // Stub router is globally available
  const [tab, setTab] = useState('overview');

  const metrics = [
    { label: 'Volume Reach', val: '4.8M', change: '+12.4%', trend: 'up' },
    { label: 'Negative Index', val: '3.2%', change: '-0.8%', trend: 'down' },
    { label: 'Share of Voice', val: '38.5%', change: '+4.2%', trend: 'up' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">N</div>
          <span className="font-bold tracking-tight">NextDashboard</span>
        </div>
        <nav className="flex gap-4">
          <button 
            onClick={() => { setTab('overview'); console.log('Switched navigation to Overview'); }}
            className={\`text-sm font-semibold px-3 py-1.5 rounded-lg transition \${tab === 'overview' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'}\`}
          >
            Overview
          </button>
          <button 
            onClick={() => { setTab('analytics'); console.log('Switched navigation to Analytics'); }}
            className={\`text-sm font-semibold px-3 py-1.5 rounded-lg transition \${tab === 'analytics' ? 'bg-indigo-650 text-white' : 'text-slate-400 hover:text-white'}\`}
          >
            Analytics
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        {tab === 'overview' ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">System Overview</h2>
              <span className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 px-2.5 py-1 rounded-full font-semibold">
                Path: {router.pathname}
              </span>
            </div>
            
            {/* Metrics cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics.map((m, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg hover:border-slate-700 transition">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{m.label}</p>
                  <p className="text-3xl font-extrabold tracking-tight text-white mt-2">{m.val}</p>
                  <span className={\`inline-block text-xs font-semibold mt-2 px-2 py-0.5 rounded-full \${m.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}\`}>
                    {m.change}
                  </span>
                </div>
              ))}
            </div>

            {/* Custom SVG Chart Area */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-4">Volume Activity (Past 7 Days)</h3>
              <div className="flex items-end justify-between h-40 pt-4 bg-slate-950 rounded-lg px-6 border border-slate-850">
                {[40, 65, 30, 85, 55, 95, 70].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <div 
                      style={{ height: \`\${h}%\` }} 
                      className="w-8 rounded-t bg-gradient-to-t from-indigo-650 to-indigo-400 hover:from-indigo-550 hover:to-indigo-350 transition-all cursor-pointer relative group"
                    >
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-xs px-2 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">{h}% SOV</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Day {i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="text-lg font-bold text-white">Analytics Workspace</h3>
            <p className="text-sm text-slate-400 mt-2">Deep dive metric telemetry visualization console.</p>
            <button 
              onClick={() => {
                router.push('/telemetry-detail');
                console.log('router.push() called to: /telemetry-detail');
              }} 
              className="mt-6 bg-indigo-650 hover:bg-indigo-550 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition shadow-md shadow-indigo-600/20"
            >
              Request Telemetry Route
            </button>
          </div>
        )}
      </main>
    </div>
  );
}`
  }
];

export default function SandboxScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("prompt"); // "prompt" | "code" | "templates"
  const [codeType, setCodeType] = useState("react"); // "html" | "react" | "nextjs"
  const [promptInput, setPromptInput] = useState("");
  const [code, setCode] = useState(PRESET_TEMPLATES[1].code); // Default to react counter template
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [deviceWidth, setDeviceWidth] = useState("100%"); // "100%" | "768px" | "375px"
  const [logs, setLogs] = useState([]);
  const [iframeKey, setIframeKey] = useState(0); // Used to force reload iframe
  
  const iframeRef = useRef(null);

  // Clear console logs
  const clearLogs = () => setLogs([]);

  // Listening for console messages from iframe sandbox
  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data && event.data.type === "CONSOLE_LOG") {
        setLogs((prev) => [
          ...prev,
          {
            type: event.data.logType,
            message: event.data.message,
            timestamp: new Date().toLocaleTimeString(),
            id: Math.random().toString(36).substring(7)
          }
        ].slice(-100)); // Cap logs at 100 entries
      }
    };
    
    window.addEventListener("message", handleIframeMessage);
    return () => window.removeEventListener("message", handleIframeMessage);
  }, []);

  // Update iframe source when code changes
  useEffect(() => {
    updateIframe();
  }, [code, codeType, iframeKey]);

  // Construct iframe html source doc based on code type
  const updateIframe = () => {
    if (!iframeRef.current) return;
    
    let htmlContent = "";
    
    if (codeType === "html") {
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HTML Sandbox Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            accent: '#5B6CF9',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }
    .font-display {
      font-family: 'Outfit', sans-serif;
    }
  </style>
</head>
<body class="bg-slate-950 text-white min-h-screen">
  ${code}

  <script>
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      function sendLog(type, args) {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch { return String(arg); }
          }
          return String(arg);
        }).join(' ');
        window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, message }, '*');
      }

      console.log = function(...args) {
        originalLog.apply(console, args);
        sendLog('log', args);
      };
      console.error = function(...args) {
        originalError.apply(console, args);
        sendLog('error', args);
      };
      console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendLog('warn', args);
      };

      window.onerror = function(message, source, lineno, colno, error) {
        window.parent.postMessage({
          type: 'CONSOLE_LOG',
          logType: 'error',
          message: message + ' (Line ' + lineno + ':' + colno + ')'
        }, '*');
        return false;
      };
    })();
  </script>
</body>
</html>`;
    } else {
      // React / Nextjs using Babel standalone compiler
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React Sandbox Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            accent: '#5B6CF9',
          }
        }
      }
    }
  </script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 0;
    }
    .font-display {
      font-family: 'Outfit', sans-serif;
    }
  </style>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen">
  <div id="root"></div>

  <script>
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      function sendLog(type, args) {
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try { return JSON.stringify(arg); } catch { return String(arg); }
          }
          return String(arg);
        }).join(' ');
        window.parent.postMessage({ type: 'CONSOLE_LOG', logType: type, message }, '*');
      }

      console.log = function(...args) {
        originalLog.apply(console, args);
        sendLog('log', args);
      };
      console.error = function(...args) {
        originalError.apply(console, args);
        sendLog('error', args);
      };
      console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendLog('warn', args);
      };

      window.onerror = function(message, source, lineno, colno, error) {
        window.parent.postMessage({
          type: 'CONSOLE_LOG',
          logType: 'error',
          message: message + ' (Line ' + lineno + ':' + colno + ')'
        }, '*');
        return false;
      };
    })();
  </script>

  <script type="text/babel">
    const { useState, useEffect, useMemo, useCallback, useRef } = React;
    
    // Stub router for Next.js mock capability
    const useRouter = () => ({
      push: (path) => console.log('router.push() -> ' + path),
      pathname: '/',
      query: {},
      back: () => console.log('router.back()')
    });
    
    const Link = ({ href, children, ...props }) => (
      <a href="#" onClick={(e) => { e.preventDefault(); console.log('Link clicked: ' + href); }} {...props}>{children}</a>
    );

    // Dynamic user component code
    ${code}

    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);
    } catch (err) {
      console.error("Render Error:", err.message);
    }
  </script>
</body>
</html>`;
    }
    
    // Write content to iframe using srcDoc
    iframeRef.current.srcdoc = htmlContent;
  };

  // Run/trigger code execution
  const handleCompileRun = () => {
    clearLogs();
    setIframeKey((prev) => prev + 1);
    toast.success("Compiling code...");
  };

  // Preset Template Loader
  const handleLoadTemplate = (template) => {
    clearLogs();
    setCodeType(template.type);
    setCode(template.code);
    toast.success(`Loaded preset: ${template.name}`);
    setActiveTab("code");
  };

  // OpenAI Generation Workflow
  const handleGenerate = async () => {
    if (!promptInput.trim()) return;
    setLoading(true);
    clearLogs();
    
    const nextHistory = [
      ...chatHistory,
      { role: "user", content: promptInput }
    ];
    
    setChatHistory(nextHistory);
    const originalPrompt = promptInput;
    setPromptInput("");
    
    toast.loading("Generating code...", { id: "openai-call" });
    
    try {
      const res = await generateSandboxCode({
        prompt: originalPrompt,
        type: codeType,
        history: chatHistory.map(h => ({ role: h.role, content: h.content }))
      });
      
      setCode(res.code);
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `Generated updated code for prompt: "${originalPrompt}"` }
      ]);
      
      toast.success("Generation completed!", { id: "openai-call" });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to generate code: ${error.message}`, { id: "openai-call" });
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: `Error: Failed to process prompt. Details: ${error.message}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sandbox-container">
      {/* Left Workspace Panel */}
      <aside className="sandbox-sidebar">
        {/* Tabs Bar */}
        <div className="sandbox-tabs-header">
          <button 
            className={`sandbox-tab-btn ${activeTab === "prompt" ? "active" : ""}`}
            onClick={() => setActiveTab("prompt")}
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>AI Builder
          </button>
          <button 
            className={`sandbox-tab-btn ${activeTab === "code" ? "active" : ""}`}
            onClick={() => setActiveTab("code")}
          >
            <i className="fa-solid fa-code mr-2"></i>Source Code
          </button>
          <button 
            className={`sandbox-tab-btn ${activeTab === "templates" ? "active" : ""}`}
            onClick={() => setActiveTab("templates")}
          >
            <i className="fa-solid fa-cubes mr-2"></i>Presets
          </button>
        </div>

        {/* Tab Contents */}
        <div className="sandbox-tab-content">
          {activeTab === "prompt" && (
            <>
              {/* Type and Model Selection */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target Framework</label>
                <select 
                  className="sandbox-select"
                  value={codeType}
                  onChange={(e) => setCodeType(e.target.value)}
                  disabled={loading}
                >
                  <option value="react">React Component (JSX)</option>
                  <option value="nextjs">Next.js Stub (React)</option>
                  <option value="html">HTML / CSS / JS Single File</option>
                </select>
              </div>

              {/* Chat Prompts */}
              <div className="sandbox-prompt-section">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">AI Prompt</label>
                <textarea 
                  className="sandbox-textarea"
                  placeholder={
                    codeType === "react" 
                      ? "e.g., Create a beautiful dark themed analytics counter widget with cards, hover animations, and incremental logs."
                      : codeType === "nextjs"
                      ? "e.g., Create a Next.js metrics feed with layout tabs, simulated route requests, and custom bars."
                      : "e.g., Build a stunning glassmorphic product pricing landing page with elegant SVG highlights."
                  }
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  disabled={loading}
                />
                
                <button 
                  className="sandbox-btn-generate"
                  onClick={handleGenerate}
                  disabled={loading || !promptInput.trim()}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch animate-spin"></i>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane"></i>
                      Generate Code
                    </>
                  )}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="sandbox-chat-history">
                <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider pb-1">AI Session History</div>
                {chatHistory.length === 0 ? (
                  <div className="text-xs text-zinc-500 italic text-center py-6">
                    No code requests in this session. Input a prompt above to build.
                  </div>
                ) : (
                  chatHistory.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`sandbox-chat-bubble ${chat.role}`}
                    >
                      {chat.content}
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === "code" && (
            <div className="sandbox-editor-container">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Editor Console</label>
                <button 
                  onClick={handleCompileRun}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold rounded text-emerald-400 border border-zinc-700 active:scale-95 transition"
                >
                  <i className="fa-solid fa-play mr-1"></i>Compile & Run
                </button>
              </div>
              <textarea 
                className="sandbox-code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
              />
            </div>
          )}

          {activeTab === "templates" && (
            <>
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Preset Demos</div>
              <div className="sandbox-templates-grid">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button 
                    key={tpl.id}
                    className="sandbox-template-card"
                    onClick={() => handleLoadTemplate(tpl)}
                  >
                    <div className="sandbox-template-name">{tpl.name}</div>
                    <div className="sandbox-template-desc">{tpl.desc}</div>
                    <div className="mt-2 text-[10px] uppercase font-bold text-indigo-400">{tpl.type}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Right Preview & Log Panel */}
      <section className="sandbox-preview-pane">
        {/* Browser Header Bar */}
        <header className="sandbox-browser-header">
          <div className="sandbox-browser-dots">
            <span className="sandbox-browser-dot bg-rose-500"></span>
            <span className="sandbox-browser-dot bg-amber-500"></span>
            <span className="sandbox-browser-dot bg-emerald-500"></span>
          </div>

          <div className="sandbox-browser-address-bar">
            {codeType === "nextjs" ? "localhost:3000/" : codeType === "react" ? "localhost:5173/" : "file:///index.html"}
          </div>

          <div className="sandbox-browser-actions">
            {/* Device Layout Toggles */}
            <button 
              className={`sandbox-browser-btn ${deviceWidth === "100%" ? "active" : ""}`}
              onClick={() => setDeviceWidth("100%")}
              title="Desktop Layout"
            >
              <i className="fa-solid fa-desktop"></i>
            </button>
            <button 
              className={`sandbox-browser-btn ${deviceWidth === "768px" ? "active" : ""}`}
              onClick={() => setDeviceWidth("768px")}
              title="Tablet Layout"
            >
              <i className="fa-solid fa-tablet-screen-button"></i>
            </button>
            <button 
              className={`sandbox-browser-btn ${deviceWidth === "375px" ? "active" : ""}`}
              onClick={() => setDeviceWidth("375px")}
              title="Mobile Layout"
            >
              <i className="fa-solid fa-mobile-screen-button"></i>
            </button>

            {/* Manual Reload */}
            <button 
              className="sandbox-browser-btn"
              onClick={handleCompileRun}
              title="Force Reload Sandbox"
            >
              <i className="fa-solid fa-rotate-right"></i>
            </button>
          </div>
        </header>

        {/* Live Code Rendering Canvas */}
        <div className="sandbox-iframe-wrapper">
          <iframe 
            key={iframeKey}
            ref={iframeRef}
            className="sandbox-iframe"
            style={{ width: deviceWidth, height: "100%" }}
            sandbox="allow-scripts"
            title="AI Code Sandbox Output Canvas"
          />
        </div>

        {/* Console Logs Drawer */}
        <div className="sandbox-console-drawer">
          <div className="sandbox-console-header">
            <div className="sandbox-console-title">
              <i className="fa-solid fa-terminal text-zinc-500"></i>
              Developer Sandbox Console
            </div>
            <button 
              className="sandbox-browser-btn"
              onClick={clearLogs}
              title="Clear Console"
            >
              <i className="fa-solid fa-ban mr-1"></i>Clear
            </button>
          </div>

          <div className="sandbox-console-logs">
            {logs.length === 0 ? (
              <div className="text-zinc-650 italic text-[11px]">Console is clean. No warnings or execution errors.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`sandbox-log-line ${log.type}`}>
                  <span className="sandbox-log-type">[{log.type}]</span>
                  <span className="text-zinc-600 mr-2">{log.timestamp}</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
