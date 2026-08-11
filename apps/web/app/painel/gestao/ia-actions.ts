"use server";

import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { median, percentile, responseMinutes, fmtDuration } from "@/lib/metrics";
import { aiModel, AI_MODEL, hasAIKey, keyHint, estimateCostCents, tokensOf } from "@/lib/ai";
import { verificarCota } from "@/lib/cota-db";
import { stagesForaDeJogo } from "@/lib/recurrence";

// `limite` separado de `error` pelo mesmo motivo do Responder: teto atingido
// não é falha do produto, e mostrar como falha faz a empresa achar que quebrou.
export type AskResult =
  | { ok: true; answer: string }
  | { ok: false; error: string }
  | { ok: false; limite: true; mensagem: string };

type Contact = { id: string; name: string; journey_stage: string; source: string | null; owner_id: string | null; created_at: string };
type Ix = { contact_id: string | null; direction: string; input_kind: string | null; occurred_at: string; outcome: string | null };
type Hist = { contact_id: string; to_stage: string; occurred_at: string };
type Member = { id: string; role: string; user: { full_name: string | null; email: string | null } | null };

/**
 * Pergunta livre sobre os dados da empresa. Monta um retrato agregado (nunca a
 * base inteira) e deixa o modelo redigir. Ele só pode usar estes números.
 */
export async function perguntarGestao(question: string, dias = 90): Promise<AskResult> {
  if (!hasAIKey()) return { ok: false, error: "Chave de IA não configurada." };
  const q = (question ?? "").trim();
  if (!q) return { ok: false, error: "Escreva sua pergunta." };

  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) return { ok: false, error: "Sem empresa vinculada." };
  if (!["owner", "admin", "manager"].includes(membership!.role)) {
    return { ok: false, error: "Esta área é do dono e dos gestores." };
  }

  // O Analista não consome a cota de ATENDIMENTOS — bloquear o relatório de
  // gestão porque o vendedor usou o Responder seria cobrar de uma função o
  // consumo de outra. Mas responde aos tetos de dinheiro: dinheiro é dinheiro.
  const cota = await verificarCota(tenant.id, "analise");
  if (!cota.permitido) return { ok: false, limite: true, mensagem: cota.mensagem! };

  try {
    const supabase = await createClient();
    const { stages } = await getSkillFormConfig(tenant.skill_key);
    const wonKeys = new Set(stages.filter((s) => s.won).map((s) => s.key));
    const terminalKeys = stagesForaDeJogo(stages);
    const stageLabel = (k: string) => stages.find((s) => s.key === k)?.label ?? k;

    const startISO = new Date(Date.now() - dias * 86400000).toISOString();
    const [{ data: cData }, { data: ixData }, { data: hData }, { data: mData }] = await Promise.all([
      supabase.from("contacts").select("id, name, journey_stage, source, owner_id, created_at").eq("tenant_id", tenant.id).is("deleted_at", null),
      supabase.from("interactions").select("contact_id, direction, input_kind, occurred_at, outcome").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
      supabase.from("contact_stage_history").select("contact_id, to_stage, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).limit(5000),
      supabase.from("memberships").select("id, role, user:profiles(full_name, email)").eq("tenant_id", tenant.id).eq("status", "active"),
    ]);

    const { data: srData } = await supabase
      .from("services_rendered")
      .select("performed_by, service, value_cents, occurred_at")
      .eq("tenant_id", tenant.id)
      .gte("occurred_at", startISO)
      .limit(5000);
    const servicos = (srData as { performed_by: string | null; service: string; value_cents: number }[] | null) ?? [];

    const contacts = (cData as Contact[] | null) ?? [];
    const ix = (ixData as Ix[] | null) ?? [];
    const hist = (hData as Hist[] | null) ?? [];
    const members = (mData as Member[] | null) ?? [];

    const nomeDe = (id: string | null) => {
      const m = members.find((x) => x.id === id);
      return m?.user?.full_name ?? m?.user?.email ?? "Sem responsável";
    };

    const leadsPeriodo = contacts.filter((c) => c.created_at >= startISO);
    const fechados = new Set<string>();
    for (const h of hist) if (wonKeys.has(h.to_stage)) fechados.add(h.contact_id);
    const ownerOf = new Map(contacts.map((c) => [c.id, c.owner_id] as const));

    // Equipe
    const equipe = members.map((m) => {
      const leads = leadsPeriodo.filter((c) => c.owner_id === m.id).length;
      const fech = [...fechados].filter((cid) => ownerOf.get(cid) === m.id).length;
      const carteira = contacts.filter((c) => c.owner_id === m.id && !terminalKeys.has(c.journey_stage)).length;
      const atend = ix.filter((i) => i.contact_id && ownerOf.get(i.contact_id) === m.id).length;
      return `- ${nomeDe(m.id)} (${m.role}): ${leads} leads novos, ${fech} fechamentos, ${carteira} em aberto, ${atend} interações`;
    });

    // Etapas
    const porEtapa = stages.map((s) => `- ${s.label}${s.won ? " (ganho)" : ""}${s.terminal ? " (final)" : ""}: ${contacts.filter((c) => c.journey_stage === s.key).length}`);

    // Origem
    const origens = new Map<string, { total: number; fech: number }>();
    for (const c of leadsPeriodo) {
      const k = c.source?.trim() || "Sem origem";
      const cur = origens.get(k) ?? { total: 0, fech: 0 };
      cur.total++;
      if (fechados.has(c.id)) cur.fech++;
      origens.set(k, cur);
    }
    const origemTxt = [...origens.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10)
      .map(([k, v]) => `- ${k}: ${v.total} leads, ${v.fech} fechados`);

    // Desfechos e tempo de resposta
    const desfechos = ["respondeu", "avancou", "ganhou", "perdeu_decisao", "perdeu_silencio"]
      .map((o) => `- ${o}: ${ix.filter((i) => i.outcome === o).length}`);
    const respEvents = ix.filter((i) => i.direction === "outbound" || (i.direction === "inbound" && i.input_kind === "customer_message"));
    const rmins = responseMinutes(respEvents);

    // Parados há mais tempo (sem interação)
    const ultima = new Map<string, string>();
    for (const i of [...ix].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))) {
      if (i.contact_id && !ultima.has(i.contact_id)) ultima.set(i.contact_id, i.occurred_at);
    }
    const hoje = Date.now();
    const parados = contacts
      .filter((c) => !terminalKeys.has(c.journey_stage))
      .map((c) => ({ nome: c.name, etapa: stageLabel(c.journey_stage), resp: nomeDe(c.owner_id), dias: Math.floor((hoje - new Date(ultima.get(c.id) ?? c.created_at).getTime()) / 86400000) }))
      .sort((a, b) => b.dias - a.dias)
      .slice(0, 12)
      .map((c) => `- ${c.nome} (${c.etapa}, resp. ${c.resp}): ${c.dias} dias sem contato`);

    // ------------------------------------------------ QUEBRA POR DIA E POR SEMANA
    //
    // ⚠ O DADO SEMPRE EXISTEU; O QUE FALTAVA ERA MANDAR.
    //
    // O fundador pediu "uma relação para saber o que os vendedores fizeram
    // hoje" e o Analista respondeu **"não tenho dado de hoje… não posso
    // inventar essa granularidade"**. A recusa estava certa — a trava
    // anti-invenção funcionando — mas a premissa estava errada: cada linha de
    // `interactions` tem `occurred_at` com hora, e todas já vinham na
    // consulta. Elas eram somadas em um total do período antes de chegar ao
    // prompt, e ninguém percebeu porque **o sintoma foi uma recusa educada, e
    // recusa educada parece limite do produto**, não defeito.
    //
    // Fica a regra: quando o motor disser "não tenho esse dado", conferir se
    // ele não tem ou se **quem monta o prompt não mandou**. As duas se
    // parecem, e só a segunda tem conserto barato.
    //
    // Por dia mostra os últimos 14 (é o que um dono acompanha de manhã) e por
    // semana cobre o período inteiro, para mês e trimestre.
    const diaDe = (iso: string) => iso.slice(0, 10);
    const semanaDe = (iso: string) => {
      const d = new Date(iso);
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // segunda-feira
      return d.toISOString().slice(0, 10);
    };
    const agrupar = (chave: (iso: string) => string) => {
      const m = new Map<string, Map<string, { saidas: number; entradas: number }>>();
      for (const i of ix) {
        if (!i.contact_id) continue;
        const k = chave(i.occurred_at);
        const dono = nomeDe(ownerOf.get(i.contact_id) ?? null);
        const porDono = m.get(k) ?? new Map();
        const cur = porDono.get(dono) ?? { saidas: 0, entradas: 0 };
        if (i.direction === "outbound") cur.saidas++; else cur.entradas++;
        porDono.set(dono, cur);
        m.set(k, porDono);
      }
      return m;
    };
    // Fechamentos por dia saem do histórico de etapa, que é append-only e
    // carimbado — é o único lugar onde "quando virou venda" é fato, não
    // dedução.
    const fechouEm = new Map<string, string[]>();
    for (const h of hist) {
      if (!wonKeys.has(h.to_stage)) continue;
      const k = diaDe(h.occurred_at);
      fechouEm.set(k, [...(fechouEm.get(k) ?? []), nomeDe(ownerOf.get(h.contact_id) ?? null)]);
    }
    const linhasDe = (m: Map<string, Map<string, { saidas: number; entradas: number }>>, comFechamento: boolean) =>
      [...m.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([k, porDono]) => {
        const fech = comFechamento ? (fechouEm.get(k) ?? []) : [];
        const detalhe = [...porDono.entries()]
          .sort((a, b) => b[1].saidas + b[1].entradas - (a[1].saidas + a[1].entradas))
          .map(([dono, v]) => {
            const f = fech.filter((x) => x === dono).length;
            return `${dono}: ${v.saidas} enviadas, ${v.entradas} recebidas${f ? `, ${f} fecharam` : ""}`;
          })
          .join(" | ");
        return `- ${k}: ${detalhe || "sem atividade"}`;
      });

    const porDia = agrupar(diaDe);
    const porSemana = agrupar(semanaDe);
    const hojeKey = new Date().toISOString().slice(0, 10);
    const blocoDiario = `ATIVIDADE POR DIA, POR VENDEDOR (últimos 14 dias com movimento — hoje é ${hojeKey})
${linhasDe(porDia, true).slice(0, 14).join("\n") || "- nenhuma interação registrada no período"}
Obs.: conta interações REGISTRADAS no sistema. Conversa que aconteceu no
WhatsApp e não foi registrada não aparece aqui — se um vendedor aparece com
zero e você sabe que ele trabalhou, o buraco é o registro, não o vendedor.`;

    const blocoSemanal = `ATIVIDADE POR SEMANA, POR VENDEDOR (semana começa na segunda)
${linhasDe(porSemana, true).join("\n") || "- nenhuma interação registrada no período"}`;

    const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");
    const brl = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    // Faturamento (só existe se a empresa registra atendimento com valor).
    const receitaTotal = servicos.reduce((s, x) => s + (x.value_cents ?? 0), 0);
    const porProf = members.map((m) => {
      const meus = servicos.filter((x) => x.performed_by === m.id);
      const tot = meus.reduce((s, x) => s + (x.value_cents ?? 0), 0);
      return `- ${nomeDe(m.id)}: ${meus.length} atendimentos, ${brl(tot)} (${pct(tot, receitaTotal)} do total)`;
    });
    const porServico = new Map<string, { n: number; total: number }>();
    for (const s of servicos) {
      const k = s.service?.trim() || "—";
      const cur = porServico.get(k) ?? { n: 0, total: 0 };
      cur.n++; cur.total += s.value_cents ?? 0;
      porServico.set(k, cur);
    }
    const servicoTxt = [...porServico.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10)
      .map(([k, v]) => `- ${k}: ${v.n}x, ${brl(v.total)}`);

    const blocoFaturamento = servicos.length
      ? `
FATURAMENTO NO PERÍODO
- Total: ${brl(receitaTotal)}
- Atendimentos realizados: ${servicos.length}
- Ticket médio: ${brl(Math.round(receitaTotal / servicos.length))}

FATURAMENTO POR PROFISSIONAL
${porProf.join("\n")}

O QUE MAIS FATURA
${servicoTxt.join("\n")}
`
      : `
FATURAMENTO NO PERÍODO
- Nenhum atendimento com valor registrado. Para responder sobre faturamento,
  comissão ou ticket, a empresa precisa registrar os atendimentos na ficha do
  cliente (serviço + valor).
`;

    const dados = `EMPRESA: ${tenant.name} | Período analisado: últimos ${dias} dias

NÚMEROS GERAIS
- Contatos na base: ${contacts.length}
- Em aberto (não finalizados): ${contacts.filter((c) => !terminalKeys.has(c.journey_stage)).length}
- Leads novos no período: ${leadsPeriodo.length}
- Fechamentos no período: ${fechados.size}
- Conversão (fechamentos ÷ leads do período): ${pct(fechados.size, leadsPeriodo.length)}
- Interações registradas no período: ${ix.length}
- Tempo de resposta ao cliente — mediana: ${fmtDuration(median(rmins))} | p90: ${fmtDuration(percentile(rmins, 90))} (${rmins.length} medições)

CONTATOS POR ETAPA
${porEtapa.join("\n")}

EQUIPE (no período)
${equipe.join("\n") || "- sem membros"}

ORIGEM DOS LEADS (no período)
${origemTxt.join("\n") || "- sem dados"}

DESFECHOS REGISTRADOS (no período)
${desfechos.join("\n")}

CONTATOS EM ABERTO PARADOS HÁ MAIS TEMPO
${parados.join("\n") || "- nenhum"}

${blocoDiario}
${blocoSemanal}
${blocoFaturamento}`;

    const system = `Você é o analista comercial da empresa. Responde ao dono/gestor em português do Brasil, de forma direta e prática.
REGRAS:
- Use SOMENTE os dados fornecidos. NUNCA invente número, nome ou fato que não esteja ali.
- Se o dado necessário não existe no material, diga claramente o que falta e o que precisa ser registrado no sistema para responder.
- Quando pedirem relatório, organize com títulos curtos e listas; destaque os números que importam.
- Não se limite a repetir números: aponte o que eles significam e o que fazer a seguir.
- Conversão conta pessoas distintas; tempo de resposta usa mediana e p90 (não média). Respeite isso.
- Seja conciso. Sem enrolação e sem elogios vazios.`;

    const res = await generateText({ model: aiModel, system, prompt: `DADOS DA EMPRESA:\n${dados}\n\nPERGUNTA DO GESTOR:\n${q}` });

    const t = tokensOf(res.usage);
    try {
      const admin = createAdminClient();
      await admin.from("usage_ledger").insert({
        tenant_id: tenant.id,
        feature: "gestao_qa",
        model: AI_MODEL,
        tokens_in: t.in,
        tokens_out: t.out,
        cost_cents: estimateCostCents(t.in, t.out),
      });
    } catch {
      // medição best-effort
    }

    return { ok: true, answer: res.text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Erro no motor de IA: ${msg} — [${keyHint()}]` };
  }
}
