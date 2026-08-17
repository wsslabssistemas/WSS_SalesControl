import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  FEATURES_DE_MENSAGEM,
  TARIFA_BR,
  categoriaDoEnvio,
  custoMicroReais,
  featureDaMensagem,
  paraCentavos,
  tarifaVigente,
  type CategoriaMensagem,
  type Contagem,
} from "@/lib/custo_mensagem";

// A leitura e a escrita do custo de mensagem. A DECISÃO mora em
// `lib/custo_mensagem.ts` (pura, testada em Node sem banco); aqui só se grava
// e se busca.
//
// ⚠ `cost_cents` VAI ZERO DE PROPÓSITO, e isso não é preguiça — é o que
// mantém os dois freios separados.
//
// `ai_usage_summary` (0047) soma `cost_cents` de TODAS as linhas do tenant,
// com o comentário "dinheiro é dinheiro". Está certo para o que ele mede: o
// gasto de IA, cujo freio é parar de gerar. Se a mensagem entrasse ali,
// atingir o teto desligaria a IA **e as mensagens continuariam saindo** —
// o freio errado puxado com força.
//
// E há um segundo motivo, igualmente prático: uma mensagem de utilidade custa
// 3,4 centavos, e `cost_cents` é inteiro. Gravar 3 erraria 12% para menos;
// gravar 0 erraria 100%. Num freio de custo, ler menos é o pior defeito
// possível — é a mesma lição da regra dos 1.000.
//
// Então o que se grava é o FATO (saiu uma mensagem desta categoria) e o
// dinheiro é calculado na leitura, com a tarifa vigente. Corrigir a tarifa
// corrige o histórico inteiro — o que importa porque a tarifa em reais ainda
// é estimativa, e não fato conferido no rate card da conta.

/**
 * Registra que uma mensagem saiu pelo número do sistema.
 *
 * Best-effort de propósito: uma falha ao MEDIR não pode desfazer um envio que
 * já aconteceu. Mas ela não é silenciosa — vai para o log, porque medição que
 * some transforma o painel de custo num número menor que o real, que é
 * exatamente o defeito que este arquivo existe para evitar.
 */
export async function registrarMensagemEnviada(
  tenantId: string,
  categoria: CategoriaMensagem,
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("usage_ledger").insert({
      tenant_id: tenantId,
      feature: featureDaMensagem(categoria),
      // Ver a nota do topo: o dinheiro é calculado na leitura.
      cost_cents: 0,
      tokens_in: 0,
      tokens_out: 0,
    });
    if (error) {
      console.error(`[custo] falha ao registrar mensagem ${categoria} de ${tenantId}: ${error.message}`);
    }
  } catch (e) {
    console.error(`[custo] falha ao registrar mensagem: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Registra a partir do que se sabe na hora do envio. */
export async function registrarEnvio(
  tenantId: string,
  entrada: { temModelo: boolean; categoriaDoModelo?: CategoriaMensagem | null },
): Promise<void> {
  await registrarMensagemEnviada(tenantId, categoriaDoEnvio(entrada));
}

export type GastoDeMensagens = {
  contagem: Contagem;
  totalMensagens: number;
  gastoCents: number;
  /** ⚠ A tarifa em reais ainda é conversão do dólar, não o rate card em BRL. */
  estimado: true;
};

/**
 * O gasto do mês corrente, por empresa — ou de TODAS, com `tenantId` nulo.
 *
 * ⚠ CONTAGEM POR `head: true`, uma por categoria. O PostgREST corta em 1.000
 * linhas sem avisar, e uma empresa disparando reativação passa disso em dias:
 * `select` das linhas para contar no cliente daria um gasto MENOR que o real,
 * plausível e silencioso. `count: "exact"` com `head` conta no servidor e não
 * traz linha nenhuma — quatro chamadas baratas em vez de uma armadilha.
 *
 * paginacao-ok: nenhuma linha é lida; só o cabeçalho de contagem.
 */
export async function gastoDeMensagensNoMes(
  tenantId: string | null,
  quando: Date = new Date(),
): Promise<GastoDeMensagens> {
  const admin = createAdminClient();
  const inicioDoMes = new Date(Date.UTC(quando.getUTCFullYear(), quando.getUTCMonth(), 1)).toISOString();

  const contagem: Contagem = {};
  await Promise.all(
    FEATURES_DE_MENSAGEM.map(async (feature) => {
      let q = admin
        .from("usage_ledger")
        .select("id", { count: "exact", head: true })
        .eq("feature", feature)
        .gte("occurred_at", inicioDoMes);
      if (tenantId) q = q.eq("tenant_id", tenantId);
      const { count, error } = await q;
      if (error) {
        // Erro NÃO vira zero. Zero se lê como "não gastou nada", e é a leitura
        // errada mais cara possível num painel de custo.
        throw new Error(`Não consegui ler o gasto de ${feature}: ${error.message}`);
      }
      const cat = feature.replace("whatsapp_", "") as CategoriaMensagem;
      contagem[cat] = count ?? 0;
    }),
  );

  const tarifa = tarifaVigente(TARIFA_BR, quando);
  const totalMensagens = Object.values(contagem).reduce((a, b) => a + (b ?? 0), 0);

  return {
    contagem,
    totalMensagens,
    gastoCents: paraCentavos(custoMicroReais(contagem, tarifa)),
    estimado: true,
  };
}
