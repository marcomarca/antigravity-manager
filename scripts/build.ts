import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";

async function build(): Promise<void> {
  const distDir = path.join(__dirname, "..", "dist");

  // Ensure clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  console.log("⚡ Building Main Process...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, "..", "src", "main", "main.ts")],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    outfile: path.join(distDir, "main", "main.js"),
    external: ["electron", "better-sqlite3", "node:sqlite"],
    sourcemap: true
  });

  console.log("⚡ Building Preload Script...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, "..", "src", "preload", "preload.ts")],
    bundle: true,
    platform: "node",
    target: "node22",
    format: "cjs",
    outfile: path.join(distDir, "preload", "preload.js"),
    external: ["electron"],
    sourcemap: true
  });

  console.log("⚡ Building Renderer...");
  await esbuild.build({
    entryPoints: [path.join(__dirname, "..", "src", "renderer", "app.ts")],
    bundle: true,
    platform: "browser",
    target: "es2022",
    format: "esm",
    outfile: path.join(distDir, "renderer", "app.js"),
    sourcemap: true
  });

  // Copy HTML & CSS
  console.log("⚡ Copying Assets...");
  const rendererDist = path.join(distDir, "renderer");
  const stylesDist = path.join(rendererDist, "styles");
  fs.mkdirSync(stylesDist, { recursive: true });

  fs.copyFileSync(
    path.join(__dirname, "..", "src", "renderer", "index.html"),
    path.join(rendererDist, "index.html")
  );

  fs.copyFileSync(
    path.join(__dirname, "..", "src", "renderer", "styles", "app.css"),
    path.join(stylesDist, "app.css")
  );

  // Copy resources
  const resourcesSrc = path.join(__dirname, "..", "resources");
  const resourcesDist = path.join(distDir, "resources");
  if (fs.existsSync(resourcesSrc)) {
    fs.mkdirSync(resourcesDist, { recursive: true });
    fs.cpSync(resourcesSrc, resourcesDist, { recursive: true });
  }

  console.log("✅ Build finished successfully!");
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
