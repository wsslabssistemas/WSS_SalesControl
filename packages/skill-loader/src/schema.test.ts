import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManifest, CANONICAL_CATEGORIES } from "./schema";

/** Manifesto mínimo válido, base para mutações nos testes. */
function baseManifest() {
  const categories = Object.fromEntries(
    CANONICAL_CATEGORIES.map((c) => [c, "descrição"]),
  );
  return {
    key: "teste",
    name: "Teste",
    version: "1.0.0",
    vocabulary: { lead: "a", conversion: "b", churn: "c", catalog_item: "d" },
    discovery_axis: "eixo",
    journey: {
      allow_skip: true,
      allow_regression: true,
      stages: [
        { key: "contato", label: "Contato" },
        { key: "fim", label: "Fim", terminal: true },
      ],
    },
    contact_fields: [],
    lead_sources: ["whatsapp"],
    dna_sections: [
      { key: "pricing", label: "Preços", required: true, fields: [{ key: "range", type: "money_range" }] },
    ],
    categories,
    cadences: [],
    hard_rules: [],
    kpis: [],
  } as Record<string, unknown>;
}

test("manifesto mínimo válido passa", () => {
  assert.equal(validateManifest(baseManifest()).success, true);
});

test("falta uma categoria canônica → falha", () => {
  const m = baseManifest();
  delete (m.categories as Record<string, string>).reciprocity;
  assert.equal(validateManifest(m).success, false);
});

test("categoria inventada → falha", () => {
  const m = baseManifest();
  (m.categories as Record<string, string>).inventada = "x";
  assert.equal(validateManifest(m).success, false);
});

test("jornada sem etapa terminal → falha", () => {
  const m = baseManifest();
  m.journey = {
    allow_skip: true,
    allow_regression: true,
    stages: [
      { key: "contato", label: "Contato" },
      { key: "meio", label: "Meio" },
    ],
  };
  assert.equal(validateManifest(m).success, false);
});

test("etapa com chave duplicada → falha", () => {
  const m = baseManifest();
  m.journey = {
    allow_skip: true,
    allow_regression: true,
    stages: [
      { key: "contato", label: "A" },
      { key: "contato", label: "B", terminal: true },
    ],
  };
  assert.equal(validateManifest(m).success, false);
});

test("version fora de semver → falha", () => {
  const m = baseManifest();
  m.version = "1.0";
  assert.equal(validateManifest(m).success, false);
});

test("contact_field enum sem options → falha", () => {
  const m = baseManifest();
  m.contact_fields = [{ key: "objetivo", label: "Objetivo", type: "enum" }];
  assert.equal(validateManifest(m).success, false);
});
