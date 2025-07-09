const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', 'app.config.js');
let content = fs.readFileSync(configPath, 'utf8');

const bumpPatch = (match, major, minor, patch) =>
  `version: '${major}.${minor}.${+patch + 1}'`;

content = content
  // ✅ Bump global version
  .replace(/version:\s*['"`](\d+)\.(\d+)\.(\d+)['"`]/, bumpPatch)

  // ✅ Bump ios.buildNumber
  .replace(/buildNumber:\s*['"`](\d+\.\d+\.\d+)['"`]/, (match, version) => {
    const [maj, min, patch] = version.split('.').map(Number);
    return `buildNumber: '${maj}.${min}.${patch + 1}'`;
  })

  // ✅ Bump android.versionCode
  .replace(/versionCode":\s*(\d+)/, (match, code) => {
    return `versionCode": ${+code + 1}`;
  });

// ❌ android.runtimeVersion is now left as-is (static or using policy)

fs.writeFileSync(configPath, content);
console.log("✅ Bumped version, ios.buildNumber, and android.versionCode (runtimeVersion left unchanged).");
