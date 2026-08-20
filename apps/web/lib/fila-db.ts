import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSkillFormConfig } from "@/lib/skill";
import { computeDueTouches, historicoPorContato } from "@/lib/cadence";
import { computeDue, stagesWithoutRecurrence, stagesForaDeJogo } from "@/lib/recurrence";
import { computeRenovacoes } from "@/lib/renovacao";
import { construirFila, comCarimbo, type ItemDaFila } from "@/lib/fila";
import { lerTudo } from "@/lib/paginado";

// A CARGA DA FILA — ler o banco e montar a lista de conversas devidas.
//
// ⚠ POR QUE ESTE ARQUIVO EXISTE, e por que ele nasceu ANTES do motor.
//
// A montagem da fila já morava em `lib/fila.ts` (lógica pura), mas a CARGA —
// quais contatos, quais interações, qual manifesto — vivia dentro de
// `/painel/fila/page.tsx`. Enquanto só a tela precisava dela, isso passava.
//
// O motor proativo precisa da mesma lista, e não tem tela. Copiar a carga para
// dentro dele criaria **duas filas divergindo em silêncio** — que não é risco
// teórico nesta casa: é exatamente o que aconteceu quando o Painel inicial
// montava as SUAS cinco listas próprias e a regra "uma pessoa, um motivo" não
// valia lá. A mesma aluna aparecia em três lugares e ninguém sabia qual estava
// certo.
//
// E a divergência aqui seria pior que a de antes: uma lista decide o que uma
// PESSOA faz hoje; a outra decide o que a MÁQUINA manda em nome do cliente
// pagante. Se as duas discordarem, a que erra é a que ninguém está olhando.
//
// Por isso a regra é a mesma de `lib/despacho.ts`: **um caminho só, e quem
// chama traz o cliente que tem.** A tela passa o do usuário (com RLS ligada);
// o motor passa o admin, porque não há sessão para a RLS avaliar. O
// `tenant_id` é explícito nas duas consultas de qualquer jeito — a RLS é a
// defesa, nunca a única.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteSupabase = SupabaseClient<any, any, any>;

export type ContatoDaCarga = {
  id: string;
  name: string;
  phone: string | null;
  owner_id: string | null;
  journey_stage: string;
  stage_entered_at: string;
  next_action_at: string | null;
  next_action: string | null;
  next_action_note: string | null;
  contract_end: string | null;
  custom: Record<string, unknown> | null;
};

export type InteracaoDaCarga = {
  contact_id: string | null;
  occurred_at: string;
  direction: string;
  created_by: string | null;
};

export type CargaDaFila = {
  /** A fila montada, já deduplicada e ordenada por custo de furar. */
  fila: ItemDaFila[];
  /** TODOS os contatos do tenant, não só os do dono filtrado. */
  todos: ContatoDaCarga[];
  /** Todas as interações — quem chama usa para ração, placar e histórico. */
  interacoes: InteracaoDaCarga[];
  /** Última conversa por contato (qualquer direção). */
  ultimo: Record<string, string>;
  /** Toques NOSSOS por contato, na etapa atual. */
  toques: Record<string, number>;
  /** `tenants.settings` cru — ração, roteamento, modelos e teto moram aqui. */
  settings: Record<string, unknown> | null;
  /** A data de referência usada na montagem, em ISO curto. */
  hojeISO: string;
};

/**
 * Carrega e monta a fila de uma empresa.
 *
 * `ownerId` filtra a carteira ANTES da montagem — é o que faz o vendedor abrir
 * na lista dele. `null` monta a fila da empresa inteira, que é o que o gestor
 * vê e o que o motor precisa.
 *
 * ⚠ LEITURA PAGINADA, e não é otimização — é correção. O PostgREST corta em
 * 1.000 linhas SEM AVISAR. Com 273 contatos ninguém via; com os 9 mil que
 * podem entrar, a fila calcularia sobre 1.000 contatos ARBITRÁRIOS e a lista
 * do dia sairia errada com cara de certa.
 */
export async function carregarFila(entrada: {
  supabase: ClienteSupabase;
  tenantId: string;
  skillKey: string;
  /** Filtra pela carteira de um membro. `null` = a empresa inteira. */
  ownerId?: string | null;
}): Promise<CargaDaFila> {
  const { supabase, tenantId, skillKey, ownerId = null } = entrada;

  const { stages, cadences, recurrence, contract } = await getSkillFormConfig(skillKey);

  const [cData, ixData, { data: tRow }] = await Promise.all([
    lerTudo<ContatoDaCarga>(
      (de, ate) => supabase
        .from("contacts")
        .select("id, name, phone, owner_id, journey_stage, stage_entered_at, next_action_at, next_action, next_action_note, contract_end, custom")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
      { rotulo: "contatos da fila" },
    ),
    lerTudo<InteracaoDaCarga>(
      (de, ate) => supabase
        .from("interactions")
        .select("contact_id, occurred_at, direction, created_by")
        .eq("tenant_id", tenantId)
        .order("occurred_at", { ascending: false })
        .range(de, ate),
      { rotulo: "interações da fila" },
    ),
    // A ração, o roteamento e o teto de mensagem moram em `tenants.settings`.
    // `getActiveTenant` não traz `settings` de propósito: ele roda em toda
    // página do painel e é o caminho mais quente do sistema.
    supabase.from("tenants").select("settings").eq("id", tenantId).maybeSingle(),
  ]);

  // ⚠ O HISTÓRICO É CALCULADO SOBRE **TODOS**, não sobre o recorte da carteira.
  //
  // `stage_entered_at` de todo mundo precisa entrar aqui, senão o contato de
  // outro dono ficaria sem entrada na etapa e a contagem de toques dele viria
  // zerada — e a régua colapsaria justamente quando o gestor trocasse de
  // filtro. O recorte acontece DEPOIS, na montagem.
  const { ultimo, toques } = historicoPorContato(
    ixData,
    Object.fromEntries(cData.map((c) => [c.id, c.stage_entered_at])),
  );

  const contatos = ownerId ? cData.filter((c) => c.owner_id === ownerId) : cData;
  const hojeISO = new Date().toISOString().slice(0, 10);

  // AS ORIGENS MORAM EM `lib/fila.ts`, não aqui. Este arquivo lê; ele decide.
  const fila = construirFila({
    contatos: contatos.map(comCarimbo),
    ultimoContato: ultimo,
    toquesNossos: toques,
    stages,
    cadences,
    recurrence,
    renewal: contract?.renewal,
    etapaDeSaida: contract?.ended_stage ?? null,
    hojeISO,
    deps: { stagesForaDeJogo, stagesWithoutRecurrence, computeRenovacoes, computeDueTouches, computeDue },
  });

  return {
    fila,
    todos: cData,
    interacoes: ixData,
    ultimo,
    toques,
    settings: (tRow?.settings ?? null) as Record<string, unknown> | null,
    hojeISO,
  };
}
