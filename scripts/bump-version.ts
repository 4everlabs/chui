import { readFile, writeFile } from "node:fs/promises";

type PackageJson = {
  version?: string;
};

const packagePath = new URL("../package.json", import.meta.url);
const readmePath = new URL("../README.md", import.meta.url);
const versionModulePath = new URL("../src/app/version.ts", import.meta.url);
const versionBadgePattern =
  /!\[Version\]\(https:\/\/img\.shields\.io\/badge\/version-[^-]+-[^)]+\)/;

const bumpPatchVersion = (input: string) => {
  const parts = input.split(".").map((part) => Number(part));
  if (
    parts.length !== 3 ||
    parts.some((part) => Number.isNaN(part) || part < 0 || !Number.isInteger(part))
  ) {
    throw new Error(`Invalid semver version: ${input}`);
  }

  const [major, minor, patch] = parts;
  return `${major}.${minor}.${patch + 1}`;
};

const run = async () => {
  const packageRaw = await readFile(packagePath, "utf8");
  const packageJson = JSON.parse(packageRaw) as PackageJson;
  const currentVersion = packageJson.version ?? "0.0.0";
  const nextVersion = bumpPatchVersion(currentVersion);
  packageJson.version = nextVersion;

  await writeFile(
    packagePath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
    "utf8",
  );

  const readmeRaw = await readFile(readmePath, "utf8");
  const nextBadge = `![Version](https://img.shields.io/badge/version-${nextVersion}-22c55e)`;
  const updatedReadme = versionBadgePattern.test(readmeRaw)
    ? readmeRaw.replace(versionBadgePattern, nextBadge)
    : readmeRaw;

  if (updatedReadme !== readmeRaw) {
    await writeFile(readmePath, updatedReadme, "utf8");
  }

  const versionModule = [
    `export const APP_VERSION = "${nextVersion}";`,
    "",
  ].join("\n");
  await writeFile(versionModulePath, versionModule, "utf8");
};

await run();
