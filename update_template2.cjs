const fs = require('fs');
const path = require('path');

const dashboards = ['media_measurement', 'narrative_intelligence', 'pr_impact', 'reputation_index'];

for (const db of dashboards) {
  const jsxPath = path.join('/Users/chaitanya/ai-frontend/src/dashboards', db, 'Template2.jsx');
  const cssPath = path.join('/Users/chaitanya/ai-frontend/src/dashboards', db, 'Template2.css');
  
  if (fs.existsSync(jsxPath)) {
    let content = fs.readFileSync(jsxPath, 'utf8');
    
    // Replace header structure
    content = content.replace(
      /<header className="editorial-header">[\s\S]*?<\/header>/,
      `<header className="top-nav" style={{ width: "100%" }}>
        <div className="nav-brand">
          {onBack && (
            <button
              onClick={onBack}
              title="Back to dashboards"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                marginRight: "8px"
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <img
                  src={logoImg}
                  alt="InfoVision Logo"
                  style={{ width: 28, height: 28, objectFit: "contain" }}
                />
          <div className="nav-title">AlphaMetricx</div>
        </div>

        <div className="ed-header-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="ed-layout-switchers" style={{ display: "flex", background: "rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "2px" }}>
            <button className={\`template-mode-btn \${templateMode === "classic" ? "active" : ""}\`} onClick={() => onChangeTemplate("classic")}>Classic</button>
            <button className={\`template-mode-btn \${templateMode === "editorial" ? "active" : ""}\`} onClick={() => onChangeTemplate("editorial")}>Editorial</button>
            <button className={\`template-mode-btn \${templateMode === "merger" ? "active" : ""}\`} onClick={() => onChangeTemplate("merger")}>Merger</button>
          </div>
          <button className="iconbtn" aria-label="Notifications" style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", cursor: "pointer", color: "#fff" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <span className="avatar" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--wine-salmon)", color: "var(--wine-dark)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>J</span>
        </div>
      </header>

      <div className="story-strip" style={{ width: "100%" }}>
        <div className="story-strip-label"><span>Storyboard</span> Progress</div>
        <div className="story-strip-track">
          {chapters.map((ch, idx) => {
            const isActive = tab.toLowerCase() === ch.tab_name?.toLowerCase();
            return (
              <button
                key={ch.tab_name}
                onClick={() => setTab(ch.tab_name)}
                className={\`story-step \${isActive ? "active" : ""}\`}
              >
                <span className="story-step-num">{idx + 1}</span>
                <span className="story-step-label">{ch.tab_name}</span>
              </button>
            );
          })}
        </div>
      </div>`
    );

    // Also replace es-kpi-grid inside Template2.jsx
    // Currently it is:
    // <div className="es-kpi-grid">
    //   <EditorialKpiCard val={nf(totalCount)} label="Total Articles" />
    //   <EditorialKpiCard val={compact(totalReach)} label="Total Reach" className="teal" />
    //   <EditorialKpiCard val="42%" label="Key Message SOV" className="crimson" />
    // </div>
    // I need it to be 6 columns if I update the CSS for .es-kpi-grid to repeat(6, 1fr)? 
    // Wait, let me just update CSS, if there are only 3 cards it will just fill 3 slots, or we can leave it as 3 for now, but user said "replace the design of es-kpi-grid in the Template2".
    
    fs.writeFileSync(jsxPath, content);
  }

  if (fs.existsSync(cssPath)) {
    let content = fs.readFileSync(cssPath, 'utf8');

    // Replace header CSS
    content = content.replace(
      /\.editorial-header[\s\S]*?\.editorial-header \.brand__sub\s*\{[\s\S]*?\}/,
      `/* TOP NAV */
.top-nav {
  background: linear-gradient(180deg, #6B2A47 0%, #4A1F35 100%) !important;
  padding: 0 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  position: sticky;
  top: 0;
  z-index: 200;
  border-bottom: 2px solid var(--wine-teal);
  box-shadow: 0 2px 12px rgba(58, 26, 42, 0.35);
  width: 100%;
}
.nav-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-logo {
  width: 26px;
  height: 26px;
  background: var(--wine-teal);
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.nav-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}
.nav-title span {
  color: #FA9899;
}`
    );

    // Update story strip CSS
    content = content.replace(
      /\.story-strip\s*\{[\s\S]*?\}/,
      `.story-strip {
  background: linear-gradient(180deg, #ffffff 0%, #fdf6f8 100%);
  border-bottom: 1px solid var(--wine-border-light);
  padding: 12px 40px;
  display: flex;
  align-items: center;
  gap: 0;
  position: sticky;
  top: 50px;
  z-index: 150;
  box-shadow: 0 1px 3px rgba(148, 69, 100, 0.05);
  width: 100%;
}`
    );

    // Page Hero CSS
    content = content.replace(
      /\[data-dashboard-template="editorial"\] \.page-hero\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-img\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-overlay\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-text\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-eyebrow\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-title\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-title span\s*\{[\s\S]*?\}\s*\[data-dashboard-template="editorial"\] \.page-hero-subtitle\s*\{[\s\S]*?\}/,
      `/* HERO BANNER */
[data-dashboard-template="editorial"] .page-hero {
  width: 100%;
  height: 310px;
  position: relative;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 6px 20px rgba(148, 69, 100, 0.08);
  // border-radius: 14px;
  margin-bottom: 24px;
}
[data-dashboard-template="editorial"] .page-hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  opacity: 1;
  filter: brightness(1.05) saturate(1.05);
}
[data-dashboard-template="editorial"] .page-hero-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 40px;
  gap: 28px;
  z-index: 2;
}
[data-dashboard-template="editorial"] .page-hero-text {
  flex: 1;
}
[data-dashboard-template="editorial"] .page-hero-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #944564;
  margin-bottom: 6px;
  display: block;
}
[data-dashboard-template="editorial"] .page-hero-title {
  font-size: 28px;
  font-weight: 800;
  color: #3A1A2A;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin-bottom: 6px;
  text-shadow: none;
}
[data-dashboard-template="editorial"] .page-hero-title span {
  color: #944564;
  font-style: normal;
}
[data-dashboard-template="editorial"] .page-hero-subtitle {
  font-size: 12px;
  color: #3D5166;
}`
    );

    // KPI Grid CSS
    content = content.replace(
      /\.es-kpi-grid\s*\{[\s\S]*?\}\s*\.es-kpi\s*\{[\s\S]*?\}\s*\.es-kpi::before\s*\{[\s\S]*?\}\s*\.es-kpi\.teal::before\s*\{[\s\S]*?\}\s*\.es-kpi\.crimson::before\s*\{[\s\S]*?\}\s*\.es-kpi:hover\s*\{[\s\S]*?\}\s*\.es-kpi-val\s*\{[\s\S]*?\}\s*\.es-kpi-label\s*\{[\s\S]*?\}/,
      `/* EXEC SUMMARY KPI GRID */
.es-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  // margin-bottom: 20px;
}
.es-kpi {
  background: linear-gradient(180deg, #ffffff 0%, #fdf8fa 100%) !important;
  border-radius: 12px !important;
  border: 1px solid var(--wine-border) !important;
  border-top: 3px solid var(--wine-primary) !important;
  padding: 16px 14px !important;
  text-align: center;
  cursor: pointer;
  transition: transform 0.22s cubic-bezier(.4,0,.2,1), box-shadow 0.22s !important;
  box-shadow: 0 1px 2px rgba(58, 26, 42, 0.04), 0 3px 12px rgba(148, 69, 100, 0.06) !important;
  position: relative;
  overflow: hidden;
  z-index: 1;
}
.es-kpi:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 4px 16px rgba(148, 69, 100, 0.1) !important;
}
.es-kpi.teal { border-top-color: var(--wine-teal) !important; }
.es-kpi.amber { border-top-color: var(--wine-coral) !important; }
.es-kpi.crimson { border-top-color: var(--wine-neg) !important; }
.es-kpi.steel { border-top-color: var(--wine-teal-deep) !important; }
.es-kpi-val {
  font-size: 26px;
  font-weight: 800;
  color: var(--wine-primary);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 5px;
  background: linear-gradient(180deg, #944564 0%, #6B2A47 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: kpiFadeIn 0.7s cubic-bezier(.4,0,.2,1) both;
}
.es-kpi-label {
  font-size: 9px;
  font-weight: 600;
  color: var(--wine-text-light);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 3px;
}
@keyframes kpiFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}`
    );

    // Some residual .editorial-header .story-strip might be present
    content = content.replace(
      /\.editorial-header \.story-strip\s*\{[\s\S]*?\}/,
      ''
    );

    fs.writeFileSync(cssPath, content);
  }
}
