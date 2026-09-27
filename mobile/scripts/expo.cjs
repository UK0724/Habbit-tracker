// Resolve Expo from this workspace, whether npm nests or hoists it.
const path = require("node:path");
const workspace = path.resolve(__dirname, "..");
const expo = path.dirname(require.resolve("expo/package.json", { paths: [workspace] }));
require(path.join(expo, "bin", "cli"));
