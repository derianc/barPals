const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'app.config.js');
let content = fs.readFileSync(configPath, 'utf8');

const bumpRuntime = (match, major, minor, patch) =>
  `runtimeVersion: '${major}.${minor}.${+patch + 1}'`;

content = content.replace(
  /runtimeVersion:\s*['"`](\d+)\.(\d+)\.(\d+)['"`]/,
  bumpRuntime
);

fs.writeFileSync(configPath, content);
console.log("✅ Bumped runtimeVersion (version, buildNumber, and versionCode left unchanged).");
