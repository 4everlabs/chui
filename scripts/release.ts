import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { $ } from "bun";

const RELEASE_DIR = "dist/release";
const MAC_TARGETS = ["bun-darwin-arm64", "bun-darwin-x64"] as const;

const versionFromPackage = async () => {
  const raw = await readFile(new URL("../package.json", import.meta.url), "utf8");
  const parsed = JSON.parse(raw) as { version?: string };
  const version = parsed.version?.trim();
  if (!version) {
    throw new Error("package.json version is missing.");
  }
  return version;
};

const ensureCleanGitState = async () => {
  const status = (await $`git status --porcelain`.text()).trim();
  if (status.length > 0) {
    throw new Error(
      "Git working tree is not clean. Commit/stash changes first, then run bun run release.",
    );
  }
};

const ensureGhAuth = async () => {
  await $`gh auth status`;
};

const ensureCrossArchOpentuiDeps = async () => {
  await $`bun add --no-save --os darwin --cpu x64 @opentui/core-darwin-x64@0.1.77`;
};

const createMacBinaries = async () => {
  await mkdir(RELEASE_DIR, { recursive: true });

  for (const target of MAC_TARGETS) {
    const arch = target.endsWith("arm64") ? "arm64" : "x64";
    const out = `${RELEASE_DIR}/chui-macos-${arch}`;
    console.log(`Building ${target} -> ${out}`);
    await $`bun build src/index.ts --compile --format=esm --minify --target=${target} --outfile ${out}`;
  }
};

const sha256Hex = async (path: string) => {
  const hash = createHash("sha256");
  const content = await readFile(path);
  hash.update(content);
  return hash.digest("hex");
};

const compressAndChecksumAssets = async () => {
  const assets = ["chui-macos-arm64", "chui-macos-x64"];
  const checksumLines: string[] = [];
  const gzAssets: string[] = [];

  for (const asset of assets) {
    const srcPath = `${RELEASE_DIR}/${asset}`;
    const gzPath = `${srcPath}.gz`;
    const srcBuffer = await readFile(srcPath);
    const gzBuffer = gzipSync(srcBuffer, { level: 9 });
    await writeFile(gzPath, gzBuffer);
    const digest = await sha256Hex(gzPath);
    checksumLines.push(`${digest}  ${asset}.gz`);
    gzAssets.push(gzPath);
  }

  const checksumsPath = `${RELEASE_DIR}/checksums.txt`;
  await writeFile(checksumsPath, `${checksumLines.join("\n")}\n`, "utf8");
  return {
    gzAssets,
    checksumsPath,
  };
};

const main = async () => {
  await ensureCleanGitState();
  await ensureGhAuth();

  await $`bun run bump`;
  await $`bun run check`;
  await ensureCrossArchOpentuiDeps();
  await createMacBinaries();
  const { gzAssets, checksumsPath } = await compressAndChecksumAssets();

  const version = await versionFromPackage();
  const tag = `v${version}`;
  const releaseTitle = `v${version}`;
  const [armAsset, x64Asset] = gzAssets;

  await $`git add package.json README.md src/app/version.ts`;
  await $`git commit -m ${`chore(release): ${tag}`}`;
  await $`git tag ${tag}`;
  await $`git push`;
  await $`git push origin ${tag}`;
  await $`gh release create ${tag} ${armAsset} ${x64Asset} ${checksumsPath} --title ${releaseTitle} --generate-notes`;

  console.log(`Release ${tag} published with compressed macOS binaries and checksums.`);
};

await main();
