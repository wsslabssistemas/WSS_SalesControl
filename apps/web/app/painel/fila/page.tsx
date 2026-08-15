import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { getSkillFormConfig } from "@/lib/skill";
import { computeDueTouches, historicoPorContato } from "@/lib/cadence";
import { computeDue, stagesWithoutRecurrence, stagesForaDeJogo } from "@/lib/recurrence";
import { computeRenovacoes } from "@/lib/renovacao";
import { construirFila, comCarimbo, ROTULO, type ItemDaFila as Item } from "@/lib/fila";
import { paraE164BR } from "@/lib/phone";
import { lerTudo } from "@/lib/paginado";
import { lerRacao, estadoDaRacao, toquesDeHoje } from "@/lib/racao";
import { ItemDaFila } from "./ItemDaFila";

export const metadata = { title: "Fila de envio" };

/**
 * ⚠ O TEMPO DA FUNÇÃO — e a falta disto era o "fica só preparando a mensagem,
 * mas não gera nada" que a Luciana relatou em 15/ago.
 *
 * `prepararToque` chama o modelo de IA, e uma geração leva de 5 a 25 segundos.
 * Sem `maxDuration` declarado, a Vercel usa o padrão dela (dezenas de segundos
 * a menos que isto), **mata a função no meio e não devolve resposta nenhuma**:
 * o botão fica girando para sempre. Não vem erro, não vem aviso — e por isso
 * parece "às vezes funciona, às vezes não", que foi exatamente o relato: uma
 * pessoa gerou e as duas seguintes não.
 *
 * É a MESMA classe do arquivo de 4,2 MB da sincronização: **limite de
 * plataforma que se apresenta como silêncio.** Custou duas vezes em dois dias,
 * então fica a regra: *tela que chama IA declara `maxDuration`.*
 */
export const maxDuration = 60;

type Contact = {
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

/**
 * A FILA DE ENVIO DE UM TOQUE.
 *
 * O último item do `COS_Kairos_Vende_Kairos.md`: o motor decide QUEM contatar e
 * O QUE dizer; a mensagem cai numa fila; a pessoa abre e envia pelo `wa.me` com
 * um clique. Sem Meta, sem template aprovado, sem risco de banir o número.
 *
 * É o mesmo princípio do cockpit manual aplicado ao contato ativo: **a
 * inteligência é nossa, o envio é humano.** Quando o volume justificar a
 * burocracia da API oficial, a fila vira automática sem reescrever nada — o
 * que muda é quem aperta o botão.
 */
export default async function FilaPage({
  searchParams,
}: {
  searchParams: Promise<{ resp?: string; mais?: string }>;
}) {
  const { resp = "", mais = "" } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (<main><h1>Fila de envio</h1><p className="text-dim">Sem empresa vinculada.</p></main>);
  }

  const { stages, cadences, recurrence, contract } = await getSkillFormConfig(tenant.skill_key);
  const supabase = await createClient();

  // LEITURA PAGINADA, e não é otimização — é correção.
  //
  // Estas duas consultas não tinham `.range()`, e o PostgREST corta em 1.000
  // linhas SEM AVISAR. Com 273 contatos ninguém via; com os 9 mil que vão
  // entrar, a fila passaria a calcular sobre 1.000 contatos ARBITRÁRIOS (não
  // há ordenação declarada) e a lista do dia sairia errada com cara de certa.
  //
  // O `limit(3000)` das interações era a mesma doença com número maior: quem
  // tivesse o último contato mais antigo que a 3.000ª interação apareceria
  // como "nunca contatado", e entraria na fila indevidamente.
  const [cData, ixData, { data: mData }, { data: tRow }] = await Promise.all([
    lerTudo<Contact>(
      (de, ate) => supabase
        .from("contacts")
        .select("id, name, phone, owner_id, journey_stage, stage_entered_at, next_action_at, next_action, next_action_note, contract_end, custom")
        .eq("tenant_id", tenant.id)
        .is("deleted_at", null)
        .order("id")
        .range(de, ate),
      { rotulo: "contatos da fila" },
    ),
    lerTudo<{ contact_id: string | null; occurred_at: string; direction: string; created_by: string | null }>(
      (de, ate) => supabase
        .from("interactions")
        .select("contact_id, occurred_at, direction, created_by")
        .eq("tenant_id", tenant.id)
        .order("occurred_at", { ascending: false })
        .range(de, ate),
      { rotulo: "interações da fila" },
    ),
    supabase
      .from("memberships")
      .select("id, user:profiles(full_name, email)")
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
    // A ração do dia mora em `tenants.settings`, como a aparência e o token do
    // calendário. `getActiveTenant` não traz `settings` de propósito: ele roda
    // em toda página do painel e é o caminho mais quente do sistema.
    supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle(),
  ]);

  const membros = ((mData as { id: string; user: { full_name: string | null; email: string | null } | null }[] | null) ?? [])
    .map((m) => ({ id: m.id, nome: m.user?.full_name ?? m.user?.email ?? "—" }));

  // ⚠ O VENDEDOR ABRE NA CARTEIRA DELE, o gestor abre na equipe inteira.
  //
  // O padrão era "toda a equipe" para todo mundo — então o recepcionista abria
  // a fila e via a lista dos três, sem saber qual parte era dele. Lista que não
  // é sua é lista que não é de ninguém.
  //
  // Owner e admin continuam vendo tudo por padrão, porque para eles a pergunta
  // é outra: a operação está em dia?
  const ehGestor = membership.role === "owner" || membership.role === "admin";
  const alvo = resp || (ehGestor ? "" : membership.membershipId);
  const todos = cData;
  const contatos = alvo ? todos.filter((c) => c.owner_id === alvo) : todos;
  const nomeDoAlvo = membros.find((m) => m.id === alvo)?.nome ?? null;

  // O `toques` é o que diz em QUAL passo da régua cada pessoa está. Sem ele a
  // cadência colapsa no acervo: uma mensagem quitava a sequência inteira e a
  // pessoa nunca mais voltava à fila. Ver `computeDueTouches`.
  const { ultimo, toques } = historicoPorContato(
    ixData,
    Object.fromEntries(todos.map((c) => [c.id, c.stage_entered_at])),
  );

  const hojeISO = new Date().toISOString().slice(0, 10);

  // AS QUATRO ORIGENS MORAM EM `lib/fila.ts`, não aqui. Enquanto a montagem
  // vivia nesta tela, o Painel inicial montava as SUAS cinco listas e a
  // dedução "uma pessoa, um motivo" não valia lá — a mesma aluna aparecia em
  // três lugares. Fila é lógica, não é tela.
  const fila = construirFila({
    contatos: contatos.map(comCarimbo), ultimoContato: ultimo, toquesNossos: toques,
    stages, cadences, recurrence, renewal: contract?.renewal, etapaDeSaida: contract?.ended_stage ?? null, hojeISO,
    deps: { stagesForaDeJogo, stagesWithoutRecurrence, computeRenovacoes, computeDueTouches, computeDue },
  });
  const porMotivo = (m: string) => fila.filter((f) => f.motivo === m).length;

  // ⚠ A RAÇÃO DO DIA — ver `lib/racao.ts` para os três motivos de ela existir.
  //
  // Ela só governa a lista de UMA pessoa. Na visão de equipe (gestor) a fila
  // aparece inteira, porque ali a pergunta é "a operação está em dia?" e
  // esconder o acervo de quem decide seria esconder o problema.
  //
  // ⚠ A RAÇÃO É O PISO DO DIA, NÃO UMA JAULA. Pergunta do fundador: *"e se
  // eles responderem 10 e tiverem tempo para mais, vão fazer o quê?"* — quem
  // quer trabalhar mais não pode esbarrar numa trava que existe para quem
  // trabalha de menos. `?mais=1` libera outra leva do mesmo tamanho.
  const levas = Math.max(1, Math.min(20, Number(mais) || 1));
  const teto = lerRacao((tRow?.settings ?? null) as Record<string, unknown> | null) * levas;
  const feitosHoje = alvo ? (toquesDeHoje(ixData, hojeISO)[alvo] ?? 0) : 0;
  const racao = estadoDaRacao({ teto, feitos: feitosHoje, naFila: fila.length });
  const doDia = alvo ? fila.slice(0, racao.restam) : fila.slice(0, 40);

  // ⚠ NINGUÉM PODE FICAR INVISÍVEL. Desde que a fila abre na carteira de quem
  // está logado, contato sem responsável não aparece para pessoa nenhuma — e
  // o webhook do WhatsApp criava lead órfão justamente assim. A origem foi
  // corrigida (`lib/carteira.ts`); isto aqui é a rede embaixo dela, porque
  // origem corrigida não conserta o que já entrou nem a próxima porta nova.
  const orfaos = todos.filter((c) => !c.owner_id).length;

  return (
    <main>
      <div className="between">
        <h1>Fila de envio</h1>
        <Link href="/painel/followup" className="btn btn-sm btn-ghost">Follow-up →</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Quem falar com hoje, por que, e o que dizer. O sistema escreve a mensagem;{" "}
        <strong>quem envia é você</strong> — um clique abre o WhatsApp com o texto pronto.
      </p>

      {membros.length > 1 && ehGestor && (
        <form method="get" className="row wrap mt-16" style={{ gap: 8 }}>
          <select name="resp" defaultValue={resp} style={{ width: "auto" }}>
            <option value="">Toda a equipe</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-sm">Filtrar</button>
        </form>
      )}

      {/* ⚠ O PLACAR DO DIA, e ele substitui a dívida.
          A tela do vendedor nunca mostra o acervo inteiro: "352 pendentes"
          toda manhã é o que faz alguém parar de executar. Aqui ele vê o teto
          do dia e o quanto já andou. O acervo continua existindo — e continua
          visível para quem decide, na visão de equipe. */}
      {alvo && (
        <div className="card mt-16" style={{ borderColor: racao.cumprida ? "var(--success)" : "var(--border-brand)" }}>
          {racao.cumprida ? (
            <>
              <p style={{ margin: 0, fontSize: 15 }}>
                <strong>Dia em dia.</strong> {racao.feitos} de {racao.teto} feitos
                {nomeDoAlvo && !ehGestor ? "" : nomeDoAlvo ? ` — ${nomeDoAlvo}` : ""}.
                {racao.aguardando > 0 && (
                  <span className="text-faint"> Mais {racao.aguardando} esperam a vez.</span>
                )}
              </p>
              {racao.aguardando > 0 && (
                <p style={{ margin: "10px 0 0" }}>
                  <Link
                    href={`/painel/fila?${resp ? `resp=${resp}&` : ""}mais=${levas + 1}`}
                    className="btn btn-sm"
                  >
                    Tenho tempo, quero mais
                  </Link>
                </p>
              )}
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 15 }}>
              <strong>Seu dia: {racao.feitos} de {racao.teto}.</strong>{" "}
              <span className="text-dim">
                {doDia.length === 0
                  ? "Nada na fila agora — aproveite para cadastrar quem apareceu hoje."
                  : `Faltam ${doDia.length} ${doDia.length === 1 ? "pessoa" : "pessoas"}.`}
              </span>
            </p>
          )}
        </div>
      )}

      {/* A rede embaixo da carteira: contato sem dono não aparece na fila de
          ninguém, e some sem dar sinal. Aqui ele vira uma linha visível. */}
      {orfaos > 0 && (
        <div className="card mt-16" style={{ borderColor: "var(--warn)" }}>
          <p style={{ margin: 0, fontSize: 14 }}>
            <span className="badge badge-warn" style={{ marginRight: 8 }}>Sem responsável</span>
            <strong>{orfaos}</strong> {orfaos === 1 ? "contato não está" : "contatos não estão"} na
            carteira de ninguém — e por isso não {orfaos === 1 ? "aparece" : "aparecem"} na fila de
            nenhum vendedor.{" "}
            <Link href="/painel/contatos">Distribuir agora →</Link>
          </p>
        </div>
      )}

      {fila.length === 0 ? (
        <div className="card mt-24">
          <p className="text-dim" style={{ margin: 0 }}>
            Fila vazia. Ninguém combinado, vencendo, esperando follow-up ou no ponto de voltar. 🎯
          </p>
        </div>
      ) : (
        <>
          {/* Os totais por motivo são leitura de GESTÃO. Para quem executa,
              eles são a dívida de novo — e por isso só aparecem na visão de
              equipe. */}
          {!alvo && (
            <div className="row wrap mt-16" style={{ gap: 8 }}>
              {(["combinado", "renovacao", "followup", "recompra", "lembrete"] as const).map((m) =>
                porMotivo(m) > 0 ? (
                  <span key={m} className="badge">{ROTULO[m]}: <strong>{porMotivo(m)}</strong></span>
                ) : null,
              )}
            </div>
          )}

          {/* A ORDEM NÃO É POR DATA, É POR CUSTO DE FURAR: combinado primeiro
              (o cliente lembra que marcou), depois renovação (receita já
              vendida), depois follow-up e recompra. */}
          <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
            {doDia.map((f) => {
              const num = paraE164BR(f.phone);
              return (
                <ItemDaFila
                  key={f.contactId}
                  contactId={f.contactId}
                  nome={f.name}
                  numero={num.ok ? num.digitos : null}
                  ajusteNoNumero={num.ok ? num.ajuste : null}
                  motivo={f.motivo}
                  intencao={f.intencao}
                  observacao={f.observacao}
                  atraso={f.atraso}
                />
              );
            })}
          </ul>
          {!alvo && fila.length > 40 && (
            <p className="text-faint" style={{ fontSize: 13, textAlign: "center" }}>
              Mostrando os 40 primeiros de {fila.length}. Resolva estes e a fila recarrega.
            </p>
          )}
        </>
      )}
    </main>
  );
}
