const fs = require('fs');
const path = require('path');

const dashboards = ['media_measurement', 'narrative_intelligence', 'pr_impact', 'reputation_index'];

for (const db of dashboards) {
  const cssPath = path.join('/Users/chaitanya/ai-frontend/src/dashboards', db, 'Template2.css');
  if (fs.existsSync(cssPath)) {
    let content = fs.readFileSync(cssPath, 'utf8');
    content = content.replace(/grid-template-columns: repeat\(6, 1fr\);/g, 'grid-template-columns: repeat(3, 1fr);');
    fs.writeFileSync(cssPath, content);
  }
}
