const fs = require("fs");
const path = require("path");

const podfilePath = path.join(__dirname, "..", "ios", "Podfile");

if (!fs.existsSync(podfilePath)) {
  console.log("📭 No Podfile found. Skipping patch.");
  process.exit(0);
}

let content = fs.readFileSync(podfilePath, "utf8");

if (!content.includes("use_modular_headers!")) {
  content = content.replace(
    /^platform :ios, ['"]\d+\.\d+['"]/m,
    match => `${match}\nuse_modular_headers!`
  );
  fs.writeFileSync(podfilePath, content, "utf8");
  console.log("✅ use_modular_headers! injected into Podfile");
} else {
  console.log("✅ Podfile already contains use_modular_headers!");
}
