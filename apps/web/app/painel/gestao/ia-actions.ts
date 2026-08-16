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
import { lerTudo } from "@/lib/paginado";

// `limite` separado de `error` pelo mesmo motivo do Responder: teto atingido
// não é falha do produto, e mostrar como falha faz a empresa achar que quebrou.
export type AskResult =
  | { ok: true; answer: string }
  | { ok: false; error: string }
  | { ok: false; limite: true; mensagem: string };

type Contact = { id: string; name: string; journey_stage: string; source: string | null; owner_id: string | null; created_at: string };
type Ix = { contact_id: string | null; direction: string; input_kind: string | null; occurred_at: string; outcome: string | null; created_by: string | null };
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
    const [cData, ixData, hData, { data: mData }] = await Promise.all([
      // ⚠ PAGINADO — e esta é a METADE QUE SOBROU do defeito ao vivo contado
      // logo abaixo. Naquele dia as `interactions` foram corrigidas e os
      // `contacts` ficaram como estavam. O Analista responde sobre CARTEIRA,
      // LEADS DO PERÍODO e CONVERSÃO, e os três saem daqui: com 9 mil
      // cadastros ele afirmaria, com a mesma serenidade, números calculados
      // sobre 1.000 pessoas escolhidas ao acaso.
      lerTudo<Contact>((de, ate) => supabase.from("contacts").select("id, name, journey_stage, source, owner_id, created_at").eq("tenant_id", tenant.id).is("deleted_at", null).order("id").range(de, ate), { rotulo: "contatos da gestao" }),
      // ⚠ PAGINADO, e a falta disto foi um defeito AO VIVO (14/ago/2026).
      //
      // O fundador perguntou "o que os vendedores fizeram hoje" e o Analista
      // respondeu que o ultimo movimento tinha sido 20 dias antes. Ele proprio
      // desconfiou: *"nao pode, eles devem ter usado o sistema sim."* Estava
      // certo — havia 32 interacoes no dia anterior.
      //
      // A causa: `.limit(5000)` NAO protege. O PostgREST tem teto proprio de
      // 1.000 linhas e **corta em silencio** — e sem `ORDER BY` as 1.000 que
      // voltam sao ARBITRARIAS. Eram 1.955 no periodo. O analista recebeu
      // metade, escolhida ao acaso, e concluiu com honestidade sobre um
      // recorte que ninguem sabia que existia.
      //
      // A licao ja estava escrita no ESTADO_DO_PROJETO ("limite que nao
      // reclama e o pior tipo") e reapareceu aqui. Corrigir ocorrencia nao
      // fecha classe: ver `paginacao_check.mjs`.
      lerTudo<Ix>((de, ate) => supabase.from("interactions").select("contact_id, direction, input_kind, occurred_at, outcome, created_by").eq("tenant_id", tenant.id).gte("occurred_at", startISO).order("occurred_at", { ascending: false }).range(de, ate), { rotulo: "interacoes da gestao" }),
      lerTudo<Hist>((de, ate) => supabase.from("contact_stage_history").select("contact_id, to_stage, occurred_at").eq("tenant_id", tenant.id).gte("occurred_at", startISO).order("occurred_at", { ascending: false }).range(de, ate), { rotulo: "historico de etapa" }),
      supabase.from("memberships").select("id, role, user:profiles(full_name, email)").eq("tenant_id", tenant.id).eq("status", "active"),
    ]);

    const srData = await lerTudo<{ performed_by: string | null; service: string; value_cents: number }>(
      (de, ate) => supabase
        .from("services_rendered")
        .select("performed_by, service, value_cents, occurred_at")
        .eq("tenant_id", tenant.id)
        .gte("occurred_at", startISO)
        .order("occurred_at", { ascending: false })
        .range(de, ate),
      { rotulo: "atendimentos com valor" },
    );
    const servicos = (srData as { performed_by: string | null; service: string; value_cents: number }[] | null) ?? [];

    const contacts = cData;
    const ix = ixData;
    const hist = hData;
    const members = (mData as Member[] | null) ?? [];

    const nomeDe = (id: string | null) => {
      const m = members.find((x) => x.id === id);
      return m?.user?.full_name ?? m?.user?.email ?? "Sem responsável";
    };

    const leadsPeriodo = contacts.filter((c) => c.created_at >= startISO);
    const fechados = new Set<string>();
    for (const h of hist) if (wonKeys.has(h.to_stage)) fechados.add(h.contact_id);
    const ownerOf = new Map(contacts.map((c) => [c.id, c.owner_id] as const));

    /**
     * ⚠ QUEM FEZ ≠ DE QUEM É O CONTATO — e o relatório confundia os dois.
     *
     * A atribuição era `dono do contato`, sempre. Então "Nycolas: 11 enviadas"
     * queria dizer *"11 mensagens para contatos da carteira do Nycolas"*, e uma
     * mensagem que a Luciana mandou para um contato do João contava para o
     * João. Num relatório que o dono usa para cobrar produtividade, isso não é
     * impreciso: é atribuir o trabalho de uma pessoa a outra.
     *
     * `created_by` é quem registrou. Ele nem sempre existe — as 2.105
     * interações importadas do piloto não têm — então o dono continua sendo o
     * recurso, e o prompt DECLARA que parte foi estimada. Número sem
     * procedência declarada é o que este produto existe para não produzir.
     */
    const membrosPorId = new Set(members.map((m) => m.id));
    const autorDe = (i: Ix): { nome: string; estimado: boolean } =>
      i.created_by && membrosPorId.has(i.created_by)
        ? { nome: nomeDe(i.created_by), estimado: false }
        : { nome: nomeDe(ownerOf.get(i.contact_id ?? "") ?? null), estimado: true };
    const estimadas = ix.filter((i) => !i.created_by || !membrosPorId.has(i.created_by)).length;

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
        const dono = autorDe(i).nome;
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

    // ------------------------------------------- CADASTROS POR DIA, POR PESSOA
    //
    // ⚠ O ANALISTA PEDIU ISTO SOZINHO, e estava certo: *"não tenho esse número
    // quebrado por dia… o sistema só me dá o acumulado do período."* Era
    // verdade — `contacts.created_at` vinha na consulta e era usado só para
    // somar leads do mês.
    //
    // É a MESMA falha de 14/ago com as interações, e ela reapareceu ao lado:
    // corrigi a granularidade das mensagens e deixei a dos cadastros. Quando o
    // motor disser "não tenho esse dado", a primeira pergunta continua sendo se
    // ele não tem ou se **quem monta o prompt não mandou.**
    //
    // ⚠ E A ORIGEM VAI JUNTO, por um motivo específico desta base. O relatório
    // de 15/ago afirmou "580 leads novos em 30 dias" — e 349 deles eram uma
    // IMPORTAÇÃO do piloto, não captação. Cadastro em massa entra com a data
    // do dia em que foi carregado e vira "resultado comercial" na leitura de
    // quem confia no total. Quebrando por origem, um pico de 349 numa origem
    // só, num dia só, se denuncia.
    const cadastroPorDia = new Map<string, Map<string, number>>();
    const origemPorDia = new Map<string, Map<string, number>>();
    for (const c of contacts) {
      if (!c.created_at || c.created_at < startISO) continue;
      const k = diaDe(c.created_at);
      const dono = nomeDe(c.owner_id);
      const pd = cadastroPorDia.get(k) ?? new Map();
      pd.set(dono, (pd.get(dono) ?? 0) + 1);
      cadastroPorDia.set(k, pd);
      const org = c.source?.trim() || "sem origem";
      const po = origemPorDia.get(k) ?? new Map();
      po.set(org, (po.get(org) ?? 0) + 1);
      origemPorDia.set(k, po);
    }
    const blocoCadastros = `CADASTROS NOVOS POR DIA, POR QUEM É RESPONSÁVEL (últimos 14 dias com movimento)
${[...cadastroPorDia.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14).map(([k, pd]) => {
  const quem = [...pd.entries()].sort((a, b) => b[1] - a[1]).map(([n, v]) => `${n}: ${v}`).join(" | ");
  const orgs = [...(origemPorDia.get(k) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([o, v]) => `${o} ${v}`).join(", ");
  return `- ${k}: ${quem}  (origens: ${orgs})`;
}).join("\n") || "- nenhum cadastro no período"}
⚠ Um dia com dezenas ou centenas de cadastros de uma origem só é IMPORTAÇÃO de
planilha, não captação. Diga isso quando acontecer, em vez de somar no total de
leads — e não credite o volume ao vendedor que aparece como responsável, porque
a importação distribui a carteira automaticamente.`;

    /**
     * ⚠ A MAIOR CARGA DE UM DIA SÓ — o que denuncia importação virando "lead".
     *
     * O relatório de 15/ago afirmou **"580 leads novos em 30 dias"** e o
     * fundador leu como captação. Eram 349 contatos de UMA origem, carregados
     * de UMA vez, do piloto antigo. O número não estava errado no cálculo:
     * estava errado no significado, que é a forma cara de errar aqui.
     *
     * O teto de 40 é o que separa um dia bom de balcão de uma carga: nenhuma
     * academia cadastra 40 pessoas da mesma origem num dia trabalhando.
     */
    const maiorCarga = (() => {
      let melhor: { dia: string; origem: string; n: number } | null = null;
      for (const [dia, porOrigem] of origemPorDia) {
        for (const [origem, n] of porOrigem) {
          if (n >= 40 && (!melhor || n > melhor.n)) melhor = { dia, origem, n };
        }
      }
      return melhor;
    })();

    const porDia = agrupar(diaDe);
    const porSemana = agrupar(semanaDe);
    const hojeKey = new Date().toISOString().slice(0, 10);
    const blocoDiario = `ATIVIDADE POR DIA, POR VENDEDOR (últimos 14 dias com movimento — hoje é ${hojeKey})
${linhasDe(porDia, true).slice(0, 14).join("\n") || "- nenhuma interação registrada no período"}
Obs.: conta interações REGISTRADAS no sistema. Conversa que aconteceu no
WhatsApp e não foi registrada não aparece aqui — se um vendedor aparece com
zero e você sabe que ele trabalhou, o buraco é o registro, não o vendedor.
Obs. 2 — DE QUEM É O NÚMERO: quando a interação diz quem a registrou, ela é
creditada a essa pessoa. Quando não diz (registro antigo, importado), cai no
RESPONSÁVEL pelo contato, que é uma estimativa. Neste período isso vale para
${estimadas} de ${ix.length} interações — se a proporção for alta, diga que a
atribuição por pessoa é aproximada em vez de apresentá-la como medida.
Obs. 3 — "enviadas" e "recebidas" quase iguais NÃO indicam integração
automática: quando o vendedor registra um atendimento no Responder, ele grava a
mensagem do cliente e a resposta dele no mesmo ato. O par é do formulário, não
do WhatsApp.`;

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
- Leads novos no período: ${leadsPeriodo.length}${maiorCarga ? ` ⚠ dos quais ${maiorCarga.n} entraram em ${maiorCarga.dia} pela origem "${maiorCarga.origem}" — volume desse tamanho num dia só é IMPORTAÇÃO de planilha, não captação. Diga isso e informe o número SEM ela (${leadsPeriodo.length - maiorCarga.n}) quando falar de resultado comercial.` : ""}
- Fechamentos no período: ${fechados.size}
- Conversão (fechamentos ÷ leads do período): ${pct(fechados.size, leadsPeriodo.length)}${maiorCarga ? " ⚠ este percentual está diluído pela importação acima — recalcule sobre os leads reais antes de comentar." : ""}
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

${blocoCadastros}

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
