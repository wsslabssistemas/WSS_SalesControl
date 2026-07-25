import { z } from "zod";

/**
 * As 12 categorias canônicas. Toda Skill preenche EXATAMENTE estas doze —
 * nenhuma inventa categoria nova, nenhuma omite. É a invariante que prova a
 * tese do COS: mesma estrutura em qualquer segmento, muda só o conteúdo.
 */
export const CANONICAL_CATEGORIES = [
  "pricing",
  "risk_free_entry",
  "availability",
  "expertise_proof",
  "catalog",
  "goal_matching",
  "objections",
  "commitment_offer",
  "reciprocity",
  "limits_and_ethics",
  "retention",
  "ecosystem",
] as const;

const key = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "chave deve ser snake_case minúsculo");

const phase = z.object({
  key,
  label: z.string().min(1),
  offset_days: z.number().int(),
});

const stage = z.object({
  key,
  label: z.string().min(1),
  goal: z.string().optional(),
  terminal: z.boolean().optional(),
  won: z.boolean().optional(), // etapa que conta como conversão (matrícula)
  phases: z.array(phase).optional(),
});

const contactField = z
  .object({
    key,
    label: z.string().min(1),
    type: z.enum(["enum", "text", "number", "date", "boolean"]),
    options: z.array(z.string()).optional(),
  })
  .refine((f) => f.type !== "enum" || (f.options?.length ?? 0) > 0, {
    message: "campo do tipo enum precisa de options não vazio",
  });

const dnaField = z.object({
  key,
  type: z.string().min(1),
  required: z.boolean().optional(),
  columns: z.array(z.string()).optional(),
  options: z.array(z.string()).optional(),
});

const dnaSection = z.object({
  key,
  label: z.string().min(1),
  required: z.boolean().optional(),
  type: z.string().optional(),
  fields: z.array(dnaField).optional(),
});

const cadence = z.object({
  key,
  applies_to: z.string().min(1),
  steps: z
    .array(z.object({ offset_days: z.number().int(), intent: z.string().min(1) }))
    .min(1),
  stop_on: z.array(z.string()).default([]),
  max_attempts: z.number().int().positive().optional(),
});

export const manifestSchema = z
  .object({
    key,
    name: z.string().min(1),
    version: z
      .string()
      .regex(/^\d+\.\d+\.\d+$/, "version deve ser semver x.y.z"),
    vocabulary: z
      .object({
        lead: z.string().min(1),
        conversion: z.string().min(1),
        churn: z.string().min(1),
        catalog_item: z.string().min(1),
      })
      .catchall(z.string()),
    discovery_axis: z.string().min(1),
    journey: z.object({
      allow_skip: z.boolean(),
      allow_regression: z.boolean(),
      stages: z.array(stage).min(2),
    }),
    contact_fields: z.array(contactField).default([]),
    lead_sources: z.array(z.string()).min(1),
    dna_sections: z.array(dnaSection).min(1),
    categories: z.record(z.string(), z.string()),
    cadences: z.array(cadence).default([]),
    hard_rules: z.array(z.string()).default([]),
    kpis: z.array(z.string()).default([]),
  })
  .superRefine((m, ctx) => {
    // As categorias devem ser EXATAMENTE as 12 canônicas.
    const keys = Object.keys(m.categories);
    const canon = new Set<string>(CANONICAL_CATEGORIES);
    const missing = [...canon].filter((c) => !keys.includes(c));
    const extra = keys.filter((k) => !canon.has(k));
    if (missing.length || extra.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["categories"],
        message:
          `categories deve ter exatamente as 12 canônicas. ` +
          `Faltando: [${missing.join(", ")}]. Sobrando: [${extra.join(", ")}]`,
      });
    }

    // Unicidade de chaves onde ela importa.
    const dups = (arr: string[]) =>
      [...new Set(arr.filter((v, i) => arr.indexOf(v) !== i))];

    const dupStages = dups(m.journey.stages.map((s) => s.key));
    if (dupStages.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["journey", "stages"],
        message: `etapas com chave duplicada: ${dupStages.join(", ")}`,
      });

    const dupDna = dups(m.dna_sections.map((s) => s.key));
    if (dupDna.length)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dna_sections"],
        message: `dna_sections com chave duplicada: ${dupDna.join(", ")}`,
      });

    // A jornada é um grafo, mas precisa de ao menos um estado final.
    if (!m.journey.stages.some((s) => s.terminal))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["journey", "stages"],
        message: "a jornada precisa de ao menos uma etapa terminal",
      });
  });

export type Manifest = z.infer<typeof manifestSchema>;

export function validateManifest(input: unknown) {
  return manifestSchema.safeParse(input);
}
