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

/**
 * As 9 ESCOLAS DE VENDA canônicas.
 *
 * Escola é a dimensão que responde "com que técnica isto foi resolvido" — e
 * precisa ser enum, não texto livre, porque é ela que vai ser cruzada com o
 * desfecho ("qual escola converte neste segmento"). Antes desta lista havia
 * 134 rótulos distintos para 134 entradas: impossível medir, impossível
 * aprender. Ver `docs/blueprint/COS_Escolas_de_Venda.md`.
 *
 * Isto NÃO fere a Lei 1: escola é vocabulário de TÉCNICA (o produto), não de
 * segmento. O núcleo continua sem saber o que é aluno, matrícula ou corte.
 */
export const CANONICAL_SCHOOLS = [
  "consultiva_spin",         // Rackham — perguntar antes de responder; implicação
  "persuasao_cialdini",      // Cialdini — reciprocidade, prova social, autoridade
  "negociacao_voss",         // Voss — rotular a emoção, isolar a objeção real
  "challenger",              // Dixon — ensinar e desafiar a premissa do cliente
  "indecisao_jolt",          // Dixon 2022 — o cliente travou; reduzir risco
  "cadencia_blount",         // Blount — constância, follow-up, o antídoto do silêncio
  "relacionamento_carnegie", // Carnegie — interesse genuíno, nunca humilhar
  "fechamento_classico",     // Ziglar/Hopkins/Tracy — conduzir à decisão
  "oferta_valor",            // Hormozi/Kahneman — montar oferta, aversão à perda
] as const;

/**
 * QUALIFICAÇÃO DE COMPRA (MEDDIC-lite) — o item 3 do M3.
 *
 * Quatro perguntas que decidem se um negócio existe de verdade: tem verba,
 * quem assina, o que vai pesar na escolha, e quem defende a compra por dentro.
 * O campo `decisor` já existia por segmento; estes quatro faltavam.
 *
 * POR QUE CANÔNICO NO NÚCLEO, e não redeclarado em cada manifesto:
 * isto é vocabulário de **processo de compra**, que é a técnica — o produto —
 * e não vocabulário de mercado (aluno, corte, gramatura). Mesma justificativa
 * que já vale para `school` e para as 12 categorias, e a Lei 1 continua de pé:
 * o núcleo segue sem saber o que é academia.
 *
 * E as OPÇÕES também são canônicas, não só as chaves. Se cada segmento
 * inventasse as suas, a pergunta "qual critério de decisão aparece nos
 * negócios ganhos" ficaria sem resposta — que foi exatamente o que aconteceu
 * com os 134 rótulos de `technique` antes do M1. `CLAUDE.md`: toda dimensão de
 * análise é enum, nunca texto livre.
 *
 * O manifesto escolhe SE usa (segmento de decisão instantânea não usa) e pode
 * trocar o `label`, que é o que o vendedor lê. A chave e as opções, não.
 */
export const QUALIFICATION_FIELDS = {
  verba: {
    label: "Verba",
    options: ["sem_verba", "verba_prevista", "verba_aprovada", "busca_financiamento", "indefinido"],
  },
  processo_decisao: {
    label: "Como decidem",
    options: ["decide_sozinho", "duas_pessoas", "comite_ou_diretoria", "licitacao", "indefinido"],
  },
  criterio_decisao: {
    label: "O que vai pesar na escolha",
    options: ["preco", "prazo", "qualidade_tecnica", "atendimento", "risco_ou_garantia", "indefinido"],
  },
  defensor_interno: {
    label: "Quem defende por dentro",
    options: ["sim_identificado", "sim_mas_sem_forca", "nao_ha", "indefinido"],
  },
} as const;

export const QUALIFICATION_KEYS = Object.keys(QUALIFICATION_FIELDS) as (keyof typeof QUALIFICATION_FIELDS)[];

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
  // Etapa de PERDA. Não é redundante com `terminal`: desde ago/2026 `perdido`
  // é NÃO-terminal, para que quem apenas parou de responder continue
  // alcançável por reativação. `lost` é o que impede essa mesma etapa de cair
  // na lista de RECOMPRA — que é para quem já comprou — e de ser contada como
  // "em aberto".
  lost: z.boolean().optional(),
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
    /**
     * O ORQUESTRADOR DE ESTRATÉGIA, em dado: qual escola governa cada situação
     * neste segmento. É por segmento de propósito — Rackham mostrou que
     * fechamento por pressão ajuda em ticket baixo e ATRAPALHA em ticket alto,
     * então barbearia e indústria não podem responder com a mesma escola.
     * A entrada da biblioteca pode sobrescrever; sem override, vale este mapa.
     */
    strategy_map: z.record(z.string(), z.string()).optional(),
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

    // O mapa de estratégia, quando existe, cobre as 12 categorias com escolas
    // válidas. Meio mapa é pior que mapa nenhum: o motor cairia no silêncio
    // justamente nas situações não declaradas.
    if (m.strategy_map) {
      const escolas = new Set<string>(CANONICAL_SCHOOLS);
      const semMapa = [...canon].filter((c) => !(c in m.strategy_map!));
      const invalidas = Object.entries(m.strategy_map)
        .filter(([, v]) => !escolas.has(v))
        .map(([c, v]) => `${c}=${v}`);
      const foraDasCategorias = Object.keys(m.strategy_map).filter((c) => !canon.has(c));
      if (semMapa.length || invalidas.length || foraDasCategorias.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["strategy_map"],
          message:
            `strategy_map deve cobrir as 12 categorias canônicas com escolas válidas. ` +
            `Sem escola: [${semMapa.join(", ")}]. ` +
            `Escola inexistente: [${invalidas.join(", ")}]. ` +
            `Categoria inexistente: [${foraDasCategorias.join(", ")}]`,
        });
      }
    }

    // QUALIFICAÇÃO DE COMPRA: quem usa uma das quatro chaves canônicas usa as
    // OPÇÕES canônicas junto. Só o `label` é livre, porque é o que o vendedor
    // lê na tela. Sem esta trava, cada segmento inventaria o próprio conjunto
    // e a dimensão deixaria de ser comparável entre eles — que é a única razão
    // de ela existir. É o mesmo erro dos 134 rótulos de `technique`, e ele já
    // custou o M1 inteiro para ser desfeito.
    for (const f of m.contact_fields) {
      const canonico = QUALIFICATION_FIELDS[f.key as keyof typeof QUALIFICATION_FIELDS];
      if (!canonico) continue;
      const esperado = [...canonico.options].join(",");
      const veio = [...(f.options ?? [])].join(",");
      if (f.type !== "enum" || veio !== esperado) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contact_fields", f.key],
          message:
            `"${f.key}" é campo canônico de qualificação de compra: precisa ser enum com ` +
            `exatamente estas options, nesta ordem — [${esperado}]. ` +
            `O label pode mudar; a chave e as opções, não.`,
        });
      }
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
