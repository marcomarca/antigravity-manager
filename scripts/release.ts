import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

function run(cmd: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}): void {
  console.log(`\n🚀 Executing: ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...options.env }
  });

  if (result.status !== 0) {
    console.error(`\n❌ Command failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }
}

function getOutput(cmd: string, args: string[]): string {
  const result = spawnSync(cmd, args, {
    encoding: "utf8",
    shell: true
  });
  return (result.stdout || "").trim();
}

async function main(): Promise<void> {
  const rootDir = path.join(__dirname, "..");
  const packageJsonPath = path.join(rootDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = pkg.version;
  const tag = `v${version}`;

  console.log(`\n==================================================`);
  console.log(`📦 Antigravity Project Launcher Release Pipeline`);
  console.log(`📌 Target Version: ${version} (Tag: ${tag})`);
  console.log(`==================================================\n`);

  // 1. Quality Checks
  console.log("🔍 Running typecheck & tests...");
  run("bun", ["run", "check"], { cwd: rootDir });

  // 2. Build production assets
  console.log("\n⚡ Building production bundles...");
  run("bun", ["run", "build"], { cwd: rootDir });

  // 3. Package Windows distributable
  console.log("\n🔨 Packaging with electron-builder...");
  run("bunx", ["electron-builder", "--win"], { cwd: rootDir });

  // 4. Verify release files
  const releaseDir = path.join(rootDir, "release");
  const latestYml = path.join(releaseDir, "latest.yml");
  const setupExe = path.join(releaseDir, `Antigravity-Project-Launcher-Setup-${version}.exe`);
  const blockmap = path.join(releaseDir, `Antigravity-Project-Launcher-Setup-${version}.exe.blockmap`);
  const portableExe = path.join(releaseDir, `Antigravity Project Launcher ${version} Portable.exe`);

  if (!fs.existsSync(latestYml)) {
    console.error(`❌ Missing critical updater metadata file: ${latestYml}`);
    process.exit(1);
  }
  if (!fs.existsSync(setupExe)) {
    console.error(`❌ Missing setup installer: ${setupExe}`);
    process.exit(1);
  }

  // 5. Publish to GitHub Releases
  console.log(`\n☁️ Publishing assets to GitHub release ${tag}...`);

  const existingReleases = getOutput("gh", ["release", "list"]);
  const releaseExists = existingReleases.includes(tag);

  const assetsToUpload: string[] = [
    latestYml,
    setupExe
  ];

  if (fs.existsSync(blockmap)) assetsToUpload.push(blockmap);
  if (fs.existsSync(portableExe)) assetsToUpload.push(portableExe);

  if (!releaseExists) {
    console.log(`✨ Creating new GitHub release ${tag}...`);
    const defaultNotes = `### Antigravity Project Launcher ${tag}\n- Fast Windows launcher for Antigravity IDE projects.\n- Automatic background updates via electron-updater.`;
    const createArgs = [
      "release",
      "create",
      tag,
      ...assetsToUpload.map((a) => `"${a}"`),
      "--title",
      `"Antigravity Project Launcher ${tag}"`,
      "--notes",
      `"${defaultNotes}"`
    ];
    run("gh", createArgs, { cwd: rootDir });
  } else {
    console.log(`🔄 Updating existing release ${tag} assets (--clobber)...`);
    const uploadArgs = [
      "release",
      "upload",
      tag,
      ...assetsToUpload.map((a) => `"${a}"`),
      "--clobber"
    ];
    run("gh", uploadArgs, { cwd: rootDir });
  }

  console.log(`\n✅ Release ${tag} published successfully!`);
  console.log(`🔗 URL: https://github.com/marcomarca/antigravity-manager/releases/tag/${tag}\n`);
}

main().catch((err) => {
  console.error("Release failed:", err);
  process.exit(1);
});
