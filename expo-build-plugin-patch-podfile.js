const fs = require("fs");
const path = require("path");

module.exports = function withPodfileMod(config) {
  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      function patchPodfile(config) {
        return {
          ...config,
          mods: {
            ...config.mods,
            ios: {
              ...config.mods?.ios,
              podfile: [
                ...(config.mods?.ios?.podfile || []),
                (podfileConfig) => {
                  const podfilePath = path.join(podfileConfig.modRequest.projectRoot, "ios", "Podfile");

                  if (fs.existsSync(podfilePath)) {
                    let contents = fs.readFileSync(podfilePath, "utf8");

                    // Inject `use_modular_headers!` at top if not present
                    if (!contents.includes("use_modular_headers!")) {
                      contents = contents.replace(
                        /^platform :ios, ['"]\d+\.\d+['"]/m,
                        match => `${match}\nuse_modular_headers!`
                      );

                      fs.writeFileSync(podfilePath, contents, "utf8");
                      console.log("✅ use_modular_headers! injected into Podfile via plugin");
                    } else {
                      console.log("ℹ️ Podfile already contains use_modular_headers!");
                    }
                  }

                  return podfileConfig;
                },
              ],
            },
          },
        };
      },
    ],
  };
};
