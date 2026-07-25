import { readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadYaml } from "./load";
import { validateManifest } from "./schema";

// packages/skill-loader/src/ -> packages/skills/
const skillsDir = fileURLToPath(new URL("../../skills/", import.meta.url));

let checked = 0;
let failures = 0;

for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifestPath = `${skillsDir}${entry.name}/manifest.yaml`;
  if (!existsSync(manifestPath)) continue;

  checked++;
  let data: unknown;
  try {
    data = loadYaml(manifestPath);
  } catch (e) {
    failures++;
    console.error(`✗ ${entry.name}: YAML inválido — ${(e as Error).message}`);
    continue;
  }

  const res = validateManifest(data);
  if (res.success) {
    console.log(`✓ ${entry.name} — manifesto válido`);
  } else {
    failures++;
    console.error(`✗ ${entry.name}:`);
    for (const issue of res.error.issues) {
      const where = issue.path.join(".") || "(raiz)";
      console.error(`    ${where}: ${issue.message}`);
    }
  }
}

console.log(`\n${checked - failures}/${checked} manifestos válidos.`);
process.exit(failures ? 1 : 0);
