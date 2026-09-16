const fs = require('fs');
const path = require('path');

const dashboards = ['media_measurement', 'narrative_intelligence', 'pr_impact', 'reputation_index'];

for (const db of dashboards) {
  const cssPath = path.join('/Users/chaitanya/ai-frontend/src/dashboards', db, 'Template2.css');
  if (fs.existsSync(cssPath)) {
    let content = fs.readFileSync(cssPath, 'utf8');
    if (!content.includes('.page-body {')) {
        content += `\n/* Page Body */\n.page-body { padding: 28px 40px 48px; }`;
        fs.writeFileSync(cssPath, content);
    }
  }
}
