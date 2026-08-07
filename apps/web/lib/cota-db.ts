// A leitura que alimenta a cota de IA. A DECISÃO mora em `lib/cota.ts` (pura,
// testada em Node sem banco); aqui só se busca o número.
//
// A VERIFICAÇÃO ACONTECE ANTES DA CHAMADA, NUNCA DEPOIS. Verificar depois é
// medir o prejuízo: o token já foi gasto e a conta já existe.
//
// A CONTAGEM VEM DO `usage_ledger`, não de um contador próprio. O ledger já é
// gravado a cada chamada e é o MESMO número que o painel do fabricante mostra.
// Um contador paralelo diverge em silêncio — e divergência numa trava de custo
// só aparece no extrato.
//
// LEITURA POR RPC, e o motivo está no `0047`: o PostgREST corta em 1.000 linhas
// sem avisar. Somar centavos no cliente daria, para toda empresa ativa, um
// gasto MENOR que o real — plausível, silencioso e exatamente do lado errado.

import { createAdminClient } from "@/lib/supabase/admin";
import { avaliarCota, limitesEfetivos, avisoDeCota, type Limites, type Consumo, type Uso, type Veredito } from "@/lib/cota";

const VAZIO: Limites = {
  respostas_mes: null, teto_mes_cents: null, prospeccao_dia: null, teto_global_mes_cents: null,
};

type Estado = { limites: Limites; consumo: Consumo };

async function lerEstado(tenantId: string): Promise<Estado | null> {
  const admin = createAdminClient();
  const [{ data: linhas }, { data: uso }] = await Promise.all([
    admin.from("ai_limits").select("tenant_id, respostas_mes, teto_mes_cents, prospeccao_dia, teto_global_mes_cents")
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`),
    admin.rpc("ai_usage_summary", { p_tenant: tenantId }),
  ]);

  const rows = (linhas as ({ tenant_id: string | null } & Limites)[] | null) ?? [];
  const global = rows.find((r) => r.tenant_id === null) ?? null;
  const doTenant = rows.find((r) => r.tenant_id === tenantId) ?? null;

  const u = (Array.isArray(uso) ? uso[0] : uso) as
    | { respostas_mes: number; custo_mes_cents: number; prospeccao_hoje: number; custo_global_mes_cents: number }
    | null
    | undefined;
  if (!u) return null;

  return {
    limites: limitesEfetivos(global, doTenant),
    consumo: {
      respostasNoMes: u.respostas_mes ?? 0,
      custoNoMesCents: u.custo_mes_cents ?? 0,
      prospeccaoHoje: u.prospeccao_hoje ?? 0,
      custoGlobalNoMesCents: u.custo_global_mes_cents ?? 0,
    },
  };
}

/**
 * O portão. Devolve o veredito da cota para este tenant e este uso.
 *
 * SE NÃO DÁ PARA MEDIR, LIBERA — e isso é escolha, não descuido. A leitura
 * falha quando falta a chave de `service_role`, que é o mesmo caso em que o
 * `usage_ledger` também não é escrito: ambiente de desenvolvimento sem chave.
 * Bloquear ali desligaria a IA de todo mundo por causa de configuração local,
 * enquanto o risco real — a conta do fundador — só existe em produção, onde a
 * chave existe. Falhar fechado aqui protegeria um caixa que não está em jogo e
 * quebraria o desenvolvimento todo dia.
 */
export async function verificarCota(tenantId: string, uso: Uso): Promise<Veredito> {
  try {
    const estado = await lerEstado(tenantId);
    if (!estado) return avaliarCota(uso, null, { respostasNoMes: 0, custoNoMesCents: 0, prospeccaoHoje: 0, custoGlobalNoMesCents: 0 });
    return avaliarCota(uso, estado.limites, estado.consumo);
  } catch {
    return avaliarCota(uso, VAZIO, { respostasNoMes: 0, custoNoMesCents: 0, prospeccaoHoje: 0, custoGlobalNoMesCents: 0 });
  }
}

/** O que a tela mostra ANTES de acabar. `null` quando ainda não é hora de avisar. */
export async function avisoDaCota(tenantId: string): Promise<string | null> {
  try {
    const estado = await lerEstado(tenantId);
    return estado ? avisoDeCota(estado.limites, estado.consumo) : null;
  } catch {
    return null;
  }
}

/** Consumo + limites de uma empresa, para a tela do fabricante. */
export async function estadoDaCota(tenantId: string): Promise<Estado | null> {
  try {
    return await lerEstado(tenantId);
  } catch {
    return null;
  }
}
