"use server";

import { getActiveTenant } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { rodarMotor } from "@/lib/motor-db";
import { ROTULO } from "@/lib/fila";

export type LinhaDaSimulacao = {
  nome: string;
  motivo: string;
  sai: boolean;
  /** Por que NÃO sai. Vazio quando sai. */
  motivoDaRecusa: string;
};

export type SimulacaoResult =
  | {
      ok: true;
      /** `false` quando nada sairia agora — e `porque` diz o motivo. */
      ativo: boolean;
      porque: string;
      linhas: LinhaDaSimulacao[];
      sairiam: number;
      avaliados: number;
    }
  | { ok: false; erro: string };

/**
 * A SIMULAÇÃO — "quem sairia agora, e por que cada um foi barrado".
 *
 * ⚠ POR QUE ESTA TELA EXISTE, e ela nasceu de um erro meu.
 *
 * O fundador configurou 10 mensagens/dia, escolheu "Simulação" e foi procurar
 * o botão de rodar. **Não havia nenhum** — o modo era gravado e nada o lia. Eu
 * descrevi um fluxo que não tinha construído, e ele passou um tempo procurando
 * uma coisa que não existe.
 *
 * ⚠ E ELA MOSTRA OS BARRADOS, NÃO SÓ OS ESCOLHIDOS. Uma lista só com "vão sair
 * 7" não permite conferir nada: quem lê não sabe se os outros 30 foram
 * poupados pela regra certa ou sumiram por um defeito. É a mesma exigência da
 * fila — sumir da lista sem explicação é como um erro vira "trabalho em dia".
 *
 * NUNCA ENVIA. `simular: true` força o modo simulação mesmo com a empresa em
 * automático, então apertar aqui é seguro por construção, não por disciplina.
 */
export async function simularMotor(): Promise<SimulacaoResult> {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, erro: "Sem empresa vinculada." };
  if (!["owner", "admin"].includes(membership!.role)) {
    return { ok: false, erro: "Só quem é dono ou admin pode simular." };
  }

  try {
    const r = await rodarMotor({
      tenantId: tenant.id,
      skillKey: tenant.skill_key,
      tenantNome: tenant.name,
      simular: true,
    });

    // Os nomes vêm numa consulta só, e só dos que apareceram no plano.
    const ids = r.plano.vereditos.map((v) => v.contactId);
    const nomes = new Map<string, string>();
    if (ids.length) {
      const supabase = await createClient();
      // paginacao-ok: busca por lista de ids já limitada pelo plano.
      const { data } = await supabase
        .from("contacts")
        .select("id, name")
        .eq("tenant_id", tenant.id)
        .in("id", ids.slice(0, 200));
      for (const c of ((data as { id: string; name: string }[] | null) ?? [])) {
        nomes.set(c.id, c.name);
      }
    }

    // ⚠ O motivo da FILA vem do executor, não do veredito. O veredito também
    // tem um campo `motivo`, mas ele é o TEXTO da recusa — mesmo nome, camada
    // diferente. Ler o errado aqui mostraria "Fica para amanhã" onde deveria
    // aparecer "Ex-aluno — trazer de volta".
    const linhas: LinhaDaSimulacao[] = r.plano.vereditos.map((v) => ({
      nome: nomes.get(v.contactId) ?? "(contato sem nome)",
      motivo: ROTULO[r.motivoPorContato[v.contactId]] ?? "",
      sai: v.enviar,
      motivoDaRecusa: v.enviar ? "" : v.motivo,
    }));

    return {
      ok: true,
      ativo: r.plano.ativo,
      porque: r.plano.porque,
      linhas,
      sairiam: r.plano.enviar.length,
      avaliados: r.plano.vereditos.length,
    };
  } catch (e) {
    // O erro sobe INTEIRO. Simulação que falha em silêncio é pior que não ter
    // simulação: quem aperta conclui que não há ninguém para falar.
    return { ok: false, erro: e instanceof Error ? e.message : String(e) };
  }
}
