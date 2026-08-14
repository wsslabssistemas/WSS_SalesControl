"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { lerTudo } from "@/lib/paginado";
import { ler, lerRecebimentos } from "@/lib/planilha";
import { comparar, type EstadoConhecido } from "@/lib/sincronizacao";
import { revalidatePath } from "next/cache";

/**
 * SINCRONIZAR COM O SISTEMA DA ACADEMIA — prever e aplicar, nessa ordem.
 *
 * ⚠ SÃO DUAS AÇÕES SEPARADAS DE PROPÓSITO, e a separação é a segurança.
 *
 * `prever` não escreve NADA. Ela lê os arquivos, compara com o banco e devolve
 * o que ACONTECERIA. Só depois de a pessoa ver a lista é que `aplicar` grava.
 *
 * Sem isso, uma exportação com filtro aplicado daria baixa em massa em gente
 * que continua pagando — e o histórico do repositório mostra que essa classe
 * de defeito não aparece como erro: o `seed-curso.mjs` derrubou oito módulos
 * ao lado **saindo com três ✓ verdes**. *Relatório que só mostra o que a
 * operação escreveu não enxerga o que ela derrubou.*
 */

export type Previsao = {
  ok: boolean;
  erro?: string;
  bloqueio?: string | null;
  entendeu?: { matriculas?: string; recebimentos?: string };
  resumo?: { entraram: number; renovaram: number; ajustaram: number; encerraram: number; reapareceram: number; recuaram: number };
  eventos?: { chave: string; tipo: string; descricao: string }[];
  pagantes?: { total: number; comHabito: number; descartadas: string[] };
};

async function contexto() {
  const m = await getActiveTenant();
  if (!m?.tenant || (m.role !== "owner" && m.role !== "admin")) return null;
  return m;
}

/** O que o banco sabe hoje, na forma que a comparação espera. */
async function estadoConhecido(tenantId: string): Promise<EstadoConhecido[]> {
  const supabase = await createClient();
  // PAGINADO: o PostgREST corta em 1.000 linhas sem avisar, e aqui o corte
  // seria catastrófico — quem ficasse de fora apareceria como "sumiu da
  // fonte" e levaria baixa. Silêncio que vira gravação é o pior caso.
  const linhas = await lerTudo<{ name: string; custom: Record<string, unknown> | null; contract_end: string | null }>(
    (de, ate) =>
      supabase
        .from("contacts")
        .select("name, custom, contract_end")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
    { rotulo: "contatos para sincronizar" },
  );
  return linhas
    .filter((c) => c.custom?.["codigo_sistema"])
    .map((c) => ({
      chave: String(c.custom!["codigo_sistema"]),
      nome: c.name,
      vigencia_ate: c.contract_end ? String(c.contract_end).slice(0, 10) : null,
      encerrado: c.custom?.["contrato_encerrado_em"] ? true : false,
    }));
}

export async function prever(matriculas: string, recebimentos: string): Promise<Previsao> {
  const m = await contexto();
  if (!m) return { ok: false, erro: "Só dono ou administrador pode sincronizar." };

  const entendeu: { matriculas?: string; recebimentos?: string } = {};
  let resumo: Previsao["resumo"];
  let eventos: Previsao["eventos"] = [];
  let bloqueio: string | null = null;

  if (matriculas.trim()) {
    const leitura = ler(matriculas, { exigeVigencia: true });
    if (leitura.erro) return { ok: false, erro: `Matrículas: ${leitura.erro}` };
    entendeu.matriculas =
      `chave "${leitura.entendeu.chave}", vencimento "${leitura.entendeu.vigencia}" · ` +
      `${leitura.entendeu.lidas} linhas → ${leitura.linhas.length} pessoas` +
      (leitura.ignoradas.length ? ` (${leitura.ignoradas.length} linhas colapsadas ou ignoradas)` : "");

    const cmp = comparar(leitura.linhas, await estadoConhecido(m.tenant!.id));
    bloqueio = cmp.bloqueio;
    resumo = {
      entraram: cmp.resumo.entraram, renovaram: cmp.resumo.renovaram,
      ajustaram: cmp.resumo.ajustaram, encerraram: cmp.resumo.encerraram,
      reapareceram: cmp.resumo.reapareceram,
      recuaram: cmp.eventos.filter((e) => e.tipo === "vigencia_recuou").length,
    };
    // "sem_mudanca" fica de fora da lista: são centenas de linhas que não
    // dizem nada e afogariam as poucas que dizem.
    eventos = cmp.eventos.filter((e) => e.tipo !== "sem_mudanca").map((e) => ({ chave: e.chave, tipo: e.tipo, descricao: e.descricao }));
  }

  let pagantes: Previsao["pagantes"];
  if (recebimentos.trim()) {
    const rec = lerRecebimentos(recebimentos);
    if (rec.erro) return { ok: false, erro: `Recebimentos: ${rec.erro}` };
    entendeu.recebimentos =
      `chave "${rec.entendeu.chave}", pagamento "${rec.entendeu.pagamento}" · ` +
      `${rec.entendeu.lidas} linhas → ${rec.pagantes.length} pagantes` +
      (rec.ignoradas.length ? ` (${rec.ignoradas.length} linhas ignoradas)` : "");
    pagantes = {
      total: rec.pagantes.length,
      comHabito: rec.pagantes.filter((p) => p.atrasoHabitualDias !== null).length,
      descartadas: rec.descartadas,
    };
  }

  return { ok: true, bloqueio, entendeu, resumo, eventos, pagantes };
}

export async function aplicar(matriculas: string, recebimentos: string): Promise<{ ok: boolean; erro?: string; gravados?: number }> {
  const m = await contexto();
  if (!m) return { ok: false, erro: "Só dono ou administrador pode sincronizar." };

  // ⚠ A PREVISÃO É REFEITA AQUI, e não é desperdício.
  //
  // O cliente poderia mandar "aplicar" com um arquivo diferente do que foi
  // previsto — por troca de aba, por clique duplo, ou por má-fé. Confiar na
  // previsão que o browser diz ter visto seria confiar no browser para decidir
  // uma gravação em massa. A trava tem que valer no servidor.
  const p = await prever(matriculas, recebimentos);
  if (!p.ok) return { ok: false, erro: p.erro };
  if (p.bloqueio) return { ok: false, erro: p.bloqueio };

  const supabase = await createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  let gravados = 0;

  if (matriculas.trim()) {
    const leitura = ler(matriculas, { exigeVigencia: true });
    // ⚠ PAGINADO. Esta leitura decide quem recebe UPDATE. Cortada em 1.000
    // linhas arbitrárias, parte da base ficaria sem sincronizar — e o que não
    // foi atualizado não aparece em lugar nenhum para alguém desconfiar.
    const atuais = await lerTudo<{ id: string; custom: Record<string, unknown> | null; contract_end: string | null }>(
      (de, ate) => supabase
        .from("contacts").select("id, custom, contract_end")
        .eq("tenant_id", m.tenant!.id).is("deleted_at", null).order("id").range(de, ate),
      { rotulo: "contatos para atualizar" },
    );
    const porCodigo = new Map(
      atuais
        .filter((c) => c.custom?.["codigo_sistema"])
        .map((c) => [String(c.custom!["codigo_sistema"]), c]),
    );

    for (const l of leitura.linhas) {
      const alvo = porCodigo.get(l.chave);
      if (!alvo) continue; // criar contato novo é outro fluxo (importador)
      const custom = { ...(alvo.custom ?? {}), contrato_conferido_em: hoje };
      // Quem voltou perde a marca de encerrado — senão ficaria fora da fila
      // para sempre, que é o oposto do que a marca existe para fazer.
      delete (custom as Record<string, unknown>)["contrato_encerrado_em"];
      // paginacao-ok: UPDATE de uma linha, endereçado por id.
      const { error } = await supabase
        .from("contacts")
        .update({ contract_end: l.vigencia_ate, custom })
        .eq("id", alvo.id)
        .eq("tenant_id", m.tenant!.id);
      if (!error) gravados++;
    }

    // O ENCERRAMENTO É O QUE A PLANILHA NÃO SABE CONTAR — ver `sincronizacao.ts`.
    for (const e of (p.eventos ?? []).filter((x) => x.tipo === "encerrou")) {
      const alvo = porCodigo.get(e.chave);
      if (!alvo) continue;
      // paginacao-ok: UPDATE de uma linha, endereçado por id.
      await supabase
        .from("contacts")
        .update({ custom: { ...(alvo.custom ?? {}), contrato_encerrado_em: hoje, contrato_conferido_em: hoje } })
        .eq("id", alvo.id)
        .eq("tenant_id", m.tenant!.id);
      gravados++;
    }
  }

  if (recebimentos.trim()) {
    const rec = lerRecebimentos(recebimentos);
    const atuais = await lerTudo<{ id: string; custom: Record<string, unknown> | null }>(
      (de, ate) => supabase
        .from("contacts").select("id, custom")
        .eq("tenant_id", m.tenant!.id).is("deleted_at", null).order("id").range(de, ate),
      { rotulo: "contatos para recebimentos" },
    );
    const porCodigo = new Map(
      atuais
        .filter((c) => c.custom?.["codigo_sistema"])
        .map((c) => [String(c.custom!["codigo_sistema"]), c]),
    );
    for (const pg of rec.pagantes) {
      const alvo = porCodigo.get(pg.chave);
      if (!alvo) continue;
      // paginacao-ok: UPDATE de uma linha, endereçado por id.
      const { error } = await supabase
        .from("contacts")
        .update({
          custom: {
            ...(alvo.custom ?? {}),
            // CPF e endereço NÃO estão aqui, e é decisão: ver `DESCARTADAS`.
            pagamentos: pg.pagamentos,
            total_pago_cents: pg.totalCents,
            ultimo_pagamento: pg.ultimoPagamento,
            atraso_habitual_dias: pg.atrasoHabitualDias,
            recebimentos_conferidos_em: hoje,
          },
        })
        .eq("id", alvo.id)
        .eq("tenant_id", m.tenant!.id);
      if (!error) gravados++;
    }
  }

  revalidatePath("/painel");
  revalidatePath("/painel/fila");
  return { ok: true, gravados };
}
