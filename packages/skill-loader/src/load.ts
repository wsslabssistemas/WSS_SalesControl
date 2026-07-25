import { readFileSync } from "node:fs";
import { parse } from "yaml";

/** Lê e faz o parse de um manifesto YAML. Não valida — isso é do schema. */
export function loadYaml(path: string): unknown {
  return parse(readFileSync(path, "utf8"));
}
