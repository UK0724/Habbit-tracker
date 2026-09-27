const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { expo } = require("../app.json");

const checkPng = (relativePath, minimumSize) => {
  const data = fs.readFileSync(path.resolve(__dirname, "..", relativePath));
  assert.equal(data.subarray(1, 4).toString(), "PNG", `${relativePath}: expected PNG`);
  const width = data.readUInt32BE(16);
  const height = data.readUInt32BE(20);
  assert.equal(width, height, `${relativePath}: icon must be square`);
  assert.ok(width >= minimumSize, `${relativePath}: placeholder or undersized image (${width}px)`);
};

checkPng(expo.icon, 1024);
checkPng(expo.android.adaptiveIcon.foregroundImage, 1024);
checkPng(expo.android.adaptiveIcon.monochromeImage, 1024);
checkPng(expo.splash.image, 1024);
const notifications = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-notifications");
assert.ok(notifications, "Notification icon must be configured for Android");
checkPng(notifications[1].icon, 96);
console.log("Mobile launcher, adaptive, splash and notification asset checks passed");
