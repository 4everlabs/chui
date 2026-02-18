import { mkdir, readFile } from "node:fs/promises";
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

const createMacBinaries = async () => {
  await mkdir(RELEASE_DIR, { recursive: true });

  for (const target of MAC_TARGETS) {
    const arch = target.endsWith("arm64") ? "arm64" : "x64";
    const out = `${RELEASE_DIR}/chui-macos-${arch}`;
    console.log(`Building ${target} -> ${out}`);
    await $`bun build src/index.ts --compile --format=esm --bytecode --minify --target=${target} --outfile ${out}`;
  }
};

const main = async () => {
  await ensureCleanGitState();
  await ensureGhAuth();

  await $`bun run bump`;
  await $`bun run check`;
  await createMacBinaries();

  const version = await versionFromPackage();
  const tag = `v${version}`;
  const releaseTitle = `v${version}`;
  const armAsset = `${RELEASE_DIR}/chui-macos-arm64`;
  const x64Asset = `${RELEASE_DIR}/chui-macos-x64`;

  await $`git add package.json README.md src/app/version.ts`;
  await $`git commit -m ${`chore(release): ${tag}`}`;
  await $`git tag ${tag}`;
  await $`git push`;
  await $`git push origin ${tag}`;
  await $`gh release create ${tag} ${armAsset} ${x64Asset} --title ${releaseTitle} --generate-notes`;

  console.log(`Release ${tag} published with macOS arm64 + x64 binaries.`);
};

await main();
