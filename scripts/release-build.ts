import { mkdir } from "node:fs/promises";
import { platform, arch } from "node:os";
import { $ } from "bun";

const ENTRYPOINT = "src/index.ts";
const OUTPUT_DIR = "dist/release";
const RELEASE_TARGETS = [
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-darwin-arm64",
  "bun-windows-x64",
] as const;

type ReleaseTarget = (typeof RELEASE_TARGETS)[number];

const WINDOWS_TARGETS = new Set<ReleaseTarget>(["bun-windows-x64"]);

const targetFromCurrentPlatform = (): ReleaseTarget => {
  const currentPlatform = platform();
  const currentArch = arch();
  const target = `bun-${currentPlatform}-${currentArch}`;

  if ((RELEASE_TARGETS as readonly string[]).includes(target)) {
    return target as ReleaseTarget;
  }

  throw new Error(
    `Current platform "${currentPlatform}-${currentArch}" is not mapped in release targets. Pass an explicit target.`,
  );
};

const normalizeTargets = (args: string[]): ReleaseTarget[] => {
  if (args.length === 0 || (args.length === 1 && args[0] === "current")) {
    return [targetFromCurrentPlatform()];
  }

  const invalid = args.filter((value) => !(RELEASE_TARGETS as readonly string[]).includes(value));
  if (invalid.length > 0) {
    throw new Error(
      `Unsupported target(s): ${invalid.join(", ")}. Supported: ${RELEASE_TARGETS.join(", ")}`,
    );
  }

  return args as ReleaseTarget[];
};

const main = async () => {
  const requestedTargets = Bun.argv.slice(2);
  const targets = normalizeTargets(requestedTargets);

  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const target of targets) {
    const extension = WINDOWS_TARGETS.has(target) ? ".exe" : "";
    const outputPath = `${OUTPUT_DIR}/chui-${target}${extension}`;
    console.log(`Building ${target} -> ${outputPath}`);

    await $`bun build ${ENTRYPOINT} --compile --format=esm --bytecode --minify --target=${target} --outfile ${outputPath}`;
  }

  console.log(`Built ${targets.length} release artifact(s).`);
};

await main();
