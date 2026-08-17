import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { statusDoCanal } from "@/lib/credenciais";
import { gastoDeMensagensNoMes } from "@/lib/custo_mensagem-db";
import { reais } from "@/lib/custo_mensagem";

export const metadata = { title: "Canal oficial" };

/**
 * O CANAL OFICIAL — o que saiu, o que chegou e o que FALHOU.
 *
 * ⚠ POR QUE ESTA TELA EXISTE, e por que ela começa pelas falhas.
 *
 * A Meta manda `sent`, `delivered`, `read` e `failed` a cada mensagem que sai.
 * O webhook interpretava os quatro desde que nasceu e **jogava fora**: só as
 * mensagens recebidas eram gravadas. Enquanto o envio era humano pelo `wa.me`
 * isso era irrelevante — não havia o que reportar sobre mensagem que saiu do
 * celular do vendedor.
 *
 * Com o canal oficial no ar e uma campanha paga pela frente, `failed` vira o
 * dado mais importante que existe: **mensagem cobrada que não chegou, e
 * ninguém tem como desconfiar de uma conversa que não aconteceu.** É a mesma
 * forma de erro que já custou caro aqui — o defeito que se apresenta como
 * silêncio.
 *
 * ⚠ O QUE ESTA TELA **NÃO** É: um aplicativo de conversa. Ela não substitui o
 * WhatsApp nem a ficha do contato, onde o histórico já mora. Ela responde três
 * perguntas que hoje não têm resposta em lugar nenhum: *saiu? chegou? quanto
 * custou?* Fazer um chat aqui duplicaria a ficha e criaria a expectativa de
 * que a equipe atende por dentro do sistema, que não é a operação real.
 */
export default async function ConversasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Canal oficial</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const canal = await statusDoCanal(tenant.id);

  if (!canal.configurado) {
    return (
      <main style={{ maxWidth: 640 }}>
        <h1>Canal oficial</h1>
        <div className="card mt-16">
          <p style={{ marginTop: 0 }}>
            Esta empresa ainda não tem o canal oficial da Meta configurado — então não
            há envio nem recebimento por número do sistema para mostrar aqui.
          </p>
          <p className="text-dim" style={{ marginBottom: 0, fontSize: 14 }}>
            As conversas da equipe continuam acontecendo pelo WhatsApp de cada pessoa,
            e o histórico de cada uma fica na ficha do contato. Para ligar o canal:{" "}
            <Link href="/painel/automacao">Automação → Canal oficial</Link>.
          </p>
        </div>
      </main>
    );
  }

  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);
  const desde = inicioDoMes.toISOString();

  /**
   * ⚠ CONTAGEM NO SERVIDOR, com `head: true`.
   *
   * O PostgREST corta em 1.000 linhas sem avisar, e uma campanha de reativação
   * passa disso em dias. Trazer as linhas para contar no cliente daria, a
   * partir da milésima, um número MENOR que o real — plausível, silencioso, e
   * exatamente do lado errado numa tela que serve para detectar falha.
   *
   * paginacao-ok: nenhuma linha é lida; só o cabeçalho de contagem.
   */
  const contar = async (aplicar: (q: ReturnType<typeof montar>) => ReturnType<typeof montar>) => {
    const { count, error } = await aplicar(montar());
    // Erro NÃO vira zero. Zero se lê como "não houve falha nenhuma", que é a
    // leitura errada mais cara possível nesta tela específica.
    if (error) throw new Error(`Não consegui contar as mensagens: ${error.message}`);
    return count ?? 0;
  };
  // ⚠ O MESMO CLIENTE DO USUÁRIO QUE MONTA AS LISTAS, de propósito.
  //
  // Contar com `service_role` e listar com o cliente do usuário funcionaria
  // hoje — a RLS de `interactions` isola por EMPRESA, não por carteira, então
  // os dois veriam a mesma coisa. Mas o dia em que alguém estreitar a policy
  // (para o vendedor ver só a carteira dele, por exemplo), o placar diria 40 e
  // a lista mostraria 12, sem nada explicando a diferença. Número e lista que
  // discordam sem motivo visível é como se aprende a não confiar na tela.
  function montar() {
    return supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant!.id)
      .gte("occurred_at", desde);
  }

  const [enviadas, entregues, lidas, falhas, recebidas, gasto] = await Promise.all([
    contar((q) => q.not("delivery_status", "is", null)),
    contar((q) => q.in("delivery_status", ["delivered", "read"])),
    contar((q) => q.eq("delivery_status", "read")),
    contar((q) => q.eq("delivery_status", "failed")),
    contar((q) => q.eq("direction", "inbound").not("external_id", "is", null)),
    gastoDeMensagensNoMes(tenant.id),
  ]);

  // As falhas primeiro, porque são o que alguém precisa FAZER alguma coisa a
  // respeito. `.limit(50)` é decisão de produto — "as 50 mais recentes" —, não
  // leitura de tabela que cresce: com mais de 50 falhas num mês o problema não
  // é a lista, é o canal, e o número acima já grita isso.
  const { data: listaFalhas } = await supabase
    .from("interactions")
    .select("id, occurred_at, delivery_error, delivery_at, content, contact_id, contacts(name)")
    .eq("tenant_id", tenant.id)
    .eq("delivery_status", "failed")
    .order("delivery_at", { ascending: false })
    .limit(50);

  const soFalhas = filtro === "falhas";

  // A atividade recente: as 40 últimas que passaram pelo canal, nos dois
  // sentidos. Mesma justificativa do limite acima.
  const { data: recentes } = await supabase
    .from("interactions")
    .select("id, occurred_at, direction, content, delivery_status, delivery_error, contact_id, contacts(name)")
    .eq("tenant_id", tenant.id)
    .not("external_id", "is", null)
    .order("occurred_at", { ascending: false })
    .limit(40);

  type Linha = {
    id: string; occurred_at: string; direction?: string; content: string;
    delivery_status?: string | null; delivery_error?: string | null; delivery_at?: string | null;
    contact_id: string; contacts: { name: string } | { name: string }[] | null;
  };

  const nomeDe = (l: Linha) =>
    (Array.isArray(l.contacts) ? l.contacts[0]?.name : l.contacts?.name) ?? "(sem nome)";

  const quando = (iso: string | null | undefined) =>
    iso
      ? new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "—";

  const ROTULO_STATUS: Record<string, { txt: string; cls: string }> = {
    sent: { txt: "enviada", cls: "badge" },
    delivered: { txt: "entregue", cls: "badge badge-brand" },
    read: { txt: "lida", cls: "badge badge-success" },
    failed: { txt: "FALHOU", cls: "badge badge-danger" },
  };

  const fs = (listaFalhas as Linha[] | null) ?? [];
  const rs = (recentes as Linha[] | null) ?? [];

  return (
    <main>
      <div className="between">
        <h1>Canal oficial</h1>
        <Link href="/painel/automacao" className="btn btn-sm btn-ghost">Configurar →</Link>
      </div>
      <p className="text-dim" style={{ marginTop: 4 }}>
        O que saiu e o que chegou pelo número do sistema neste mês. As conversas que a
        equipe tem pelo WhatsApp de cada um não passam por aqui — e o histórico completo
        de cada pessoa continua na ficha dela.
      </p>

      {/* ---------------------------------------------------- O PLACAR */}
      <div
        className="mt-24"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}
      >
        {[
          { rotulo: "Saíram", valor: enviadas, hint: "pelo número do sistema" },
          { rotulo: "Chegaram ao aparelho", valor: entregues, hint: "entregues ou lidas" },
          { rotulo: "Lidas", valor: lidas, hint: "confirmação de leitura" },
          { rotulo: "Recebidas", valor: recebidas, hint: "mensagens dos clientes" },
        ].map((k) => (
          <div key={k.rotulo} className="card" style={{ padding: 14 }}>
            <p className="text-faint" style={{ fontSize: 12, margin: 0 }}>{k.rotulo}</p>
            <p style={{ fontSize: 26, fontWeight: 600, margin: "2px 0 0" }}>{k.valor}</p>
            <p className="text-faint" style={{ fontSize: 11, margin: 0 }}>{k.hint}</p>
          </div>
        ))}
        <div
          className="card"
          style={{ padding: 14, borderColor: falhas > 0 ? "var(--danger)" : undefined }}
        >
          <p className="text-faint" style={{ fontSize: 12, margin: 0 }}>Falharam</p>
          <p style={{ fontSize: 26, fontWeight: 600, margin: "2px 0 0", color: falhas > 0 ? "var(--danger)" : undefined }}>
            {falhas}
          </p>
          <p className="text-faint" style={{ fontSize: 11, margin: 0 }}>não chegaram</p>
        </div>
      </div>

      <p className="text-faint mt-8" style={{ fontSize: 12 }}>
        Custo estimado do mês: <strong>{reais(gasto.gastoCents)}</strong> em{" "}
        {gasto.totalMensagens} mensagem(ns). A tarifa em reais ainda é conversão do
        dólar, não o rate card da conta — ver <Link href="/painel/admin/cotas">Cota de IA</Link>.
      </p>

      {/* ---------------------------------------------------- AS FALHAS
          ⚠ PRIMEIRO NA TELA E COM MOTIVO JUNTO. A Meta devolve um texto que
          diz POR QUE não chegou, e cada motivo tem conserto diferente: número
          que não tem WhatsApp, modelo não aprovado, limite da pessoa. Trocar
          isso por "falha no envio" economizaria uma linha e custaria a única
          informação que resolve o problema. */}
      {falhas > 0 && (
        <div className="card mt-24" style={{ borderColor: "var(--danger)" }}>
          <div className="between" style={{ alignItems: "baseline" }}>
            <strong>Não chegaram — e cada uma custou</strong>
            <span className="text-faint" style={{ fontSize: 12 }}>
              {fs.length >= 50 ? "as 50 mais recentes" : `${fs.length} no mês`}
            </span>
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
            {fs.map((f) => (
              <li key={f.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                <div className="row wrap" style={{ gap: 8, alignItems: "baseline" }}>
                  <Link href={`/painel/contatos/${f.contact_id}`} style={{ fontSize: 14 }}>
                    {nomeDe(f)}
                  </Link>
                  <span className="text-faint" style={{ fontSize: 12 }}>{quando(f.delivery_at)}</span>
                </div>
                <p className="text-dim" style={{ fontSize: 13, margin: "4px 0 0" }}>
                  {f.delivery_error ?? "A Meta não disse o motivo."}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------------------------------------------------- A ATIVIDADE */}
      <div className="card mt-24">
        <div className="between" style={{ alignItems: "baseline" }}>
          <strong>Últimas pelo canal</strong>
          <Link
            href={soFalhas ? "/painel/conversas" : "/painel/conversas?filtro=falhas"}
            className="btn btn-sm btn-ghost"
          >
            {soFalhas ? "Ver todas" : "Só as que falharam"}
          </Link>
        </div>

        {rs.length === 0 ? (
          <p className="text-dim" style={{ fontSize: 14, marginBottom: 0 }}>
            Nada passou pelo canal oficial ainda. Quando a primeira mensagem sair — ou o
            primeiro cliente escrever para o número do sistema — ela aparece aqui.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
            {rs
              .filter((l) => (soFalhas ? l.delivery_status === "failed" : true))
              .map((l) => {
                const st = l.delivery_status ? ROTULO_STATUS[l.delivery_status] : null;
                return (
                  <li key={l.id} style={{ padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                    <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
                      <span className="text-faint" style={{ fontSize: 12, minWidth: 74 }}>
                        {quando(l.occurred_at)}
                      </span>
                      <span className="badge" style={{ minWidth: 60, justifyContent: "center" }}>
                        {l.direction === "inbound" ? "recebida" : "enviada"}
                      </span>
                      <Link href={`/painel/contatos/${l.contact_id}`} className="grow" style={{ fontSize: 14, minWidth: 120 }}>
                        {nomeDe(l)}
                      </Link>
                      {st && <span className={st.cls}>{st.txt}</span>}
                      {/* Saída sem status é normal e vale dizer: pode ser toque
                          registrado à mão, que nunca passou pela Meta. */}
                      {!st && l.direction === "outbound" && (
                        <span className="text-faint" style={{ fontSize: 11 }}>sem confirmação</span>
                      )}
                    </div>
                    <p className="text-dim" style={{ fontSize: 13, margin: "4px 0 0 82px" }}>
                      {l.content.length > 140 ? `${l.content.slice(0, 140)}…` : l.content}
                    </p>
                    {l.delivery_status === "failed" && l.delivery_error && (
                      <p className="badge badge-danger" style={{ margin: "6px 0 0 82px", whiteSpace: "normal" }}>
                        {l.delivery_error}
                      </p>
                    )}
                  </li>
                );
              })}
          </ul>
        )}
      </div>

      {/* ---------------------------------------------------- O QUE ESTA TELA NÃO SABE
          Escrito porque um painel que cala sobre o próprio limite ensina a
          confiar no número errado. */}
      <div className="card mt-16">
        <p className="eyebrow" style={{ marginBottom: 8 }}>O que esta tela não enxerga</p>
        <ul className="text-dim" style={{ fontSize: 13, margin: 0, paddingLeft: 18 }}>
          <li>
            <strong>As conversas pelo WhatsApp da equipe.</strong> Elas não passam pela
            Meta e não têm status — o registro delas é o toque marcado na fila.
          </li>
          <li>
            <strong>Áudio, imagem e figurinha que o cliente manda.</strong> Chegam e não
            viram interação ainda; ficam contados no log do webhook.
          </li>
          <li>
            <strong>Instagram e Facebook.</strong> São outras APIs da Meta e não existem
            no sistema hoje.
          </li>
        </ul>
      </div>
    </main>
  );
}
