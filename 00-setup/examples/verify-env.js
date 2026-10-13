// examples/verify-env.js
// Prints a small report about your Node environment.
// Run: node examples/verify-env.js

console.log("=== Environment check ===");
console.log("Node version:   ", process.version);       // e.g. v22.11.0
console.log("Platform:       ", process.platform);      // 'darwin', 'linux', 'win32'
console.log("Architecture:   ", process.arch);          // 'arm64', 'x64'
console.log("Working dir:    ", process.cwd());          // where you ran the command

// A tiny sanity check: is Node new enough for this guide (>= 20)?
const major = Number(process.version.slice(1).split(".")[0]);
if (major >= 20) {
  console.log("✅ Node is new enough for everything in this guide.");
} else {
  console.log("⚠️  Please upgrade Node to v20 or newer (see Module 00, Step 1).");
}
