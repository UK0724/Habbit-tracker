// SDK 52 discovers workspace packages and hoisted dependencies automatically.
// Native dependencies are kept singletons by check:native.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);
// Workspace discovery also sees local SDKs, APKs and test artifacts. None are
// app source; excluding them keeps Metro from crawling gigabytes of tooling.
const artifactsPath = path.resolve(__dirname, "../output");
const escapedArtifactsPath = artifactsPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList)
    ? existingBlockList
    : existingBlockList ? [existingBlockList] : []),
  new RegExp(`^${escapedArtifactsPath}(?:[/\\\\]|$)`)
];

module.exports = config;
