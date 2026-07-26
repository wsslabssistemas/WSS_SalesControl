"use client";

import { useState } from "react";

type Step = { title: string; content: string };
type Section = { id: string; n: string; title: string; desc: string; color: string; steps: Step[] };

const SECTIONS: Section[] = [
  {
    id: "inicio",
    n: "01",
    title: "Primeiros passos",
    desc: "A filosofia do sistema e o seu papel",
    color: "var(--brand-blue)",
    steps: [
      { title: "O que é o WSS Kairós?", content: "É um assistente comercial que padroniza o atendimento. Você não decora respostas: o sistema sugere o que dizer com base na sua biblioteca de vendas, nos fatos da empresa e no histórico do cliente. Seu trabalho é executar com qualidade, não inventar do zero." },
      { title: "Seu papel como vendedor aqui", content: "Você deixa de só \"atender\" e vira um consultor. O sistema te diz a próxima ação de cada cliente, sugere a resposta e te avisa quando alguém está esquecido." },
      { title: "Fluxo do dia recomendado", content: "1) Abra o Início e veja os toques de hoje e os atrasados.\n2) No Responder, escolha o cliente e cole a mensagem dele.\n3) Copie a melhor resposta e mande pelo WhatsApp.\n4) Registre o atendimento no cliente.\n5) No fim do dia, confira a Agenda." },
    ],
  },
  {
    id: "contatos",
    n: "02",
    title: "Contatos e jornada",
    desc: "Cadastrar leads e mover pela jornada",
    color: "var(--brand-cyan)",
    steps: [
      { title: "Criar um lead", content: "Clique em \"Novo contato\". Preencha ao menos o nome e o telefone — o sistema avisa se o telefone já existe. Quanto mais dados, melhor o sistema personaliza depois." },
      { title: "A jornada é uma barra", content: "Cada contato tem uma barra de jornada mostrando por onde passou e onde está. Abra a ficha do contato para ver e mover de etapa; cada mudança fica no histórico." },
      { title: "Etapas", content: "As etapas vêm do seu segmento (ex.: contato → descoberta → proposta → experiência → ganho). Ao mover, o sistema calcula os toques automáticos e joga na Agenda." },
    ],
  },
  {
    id: "responder",
    n: "03",
    title: "Responder — o coração",
    desc: "A melhor resposta para cada mensagem",
    color: "#a78bfa",
    steps: [
      { title: "Como funciona (hoje, manual)", content: "Escolha o cliente (traz a jornada e o histórico ao lado), cole a mensagem que ele mandou e clique em Buscar. O sistema encontra na sua biblioteca as melhores respostas para aquela situação. Você revisa, copia e manda pelo WhatsApp." },
      { title: "Registrar no cliente", content: "Ao usar uma resposta, clique em \"Registrar no cliente\". Isso guarda a mensagem recebida e a enviada no histórico — é o que constrói a memória de cada cliente." },
      { title: "Com IA (versão automática)", content: "Na versão automática, em vez de só buscar, o sistema LÊ a mensagem e ESCREVE uma resposta personalizada, já adaptada ao histórico — e explica o porquê daquela abordagem e qual técnica usou. É o mesmo cockpit, com o motor ligado." },
    ],
  },
  {
    id: "agenda",
    n: "04",
    title: "Funil e Agenda",
    desc: "Ver o funil e não esquecer ninguém",
    color: "var(--brand-green)",
    steps: [
      { title: "Funil", content: "Mostra quantas pessoas há em cada etapa e a taxa de conversão (quem chegou na etapa ganha ÷ total). Clique numa etapa para ver as pessoas." },
      { title: "Agenda em calendário", content: "Os toques de cada cliente aparecem no dia certo do calendário. O que está atrasado ou é para hoje fica destacado no topo. Sua missão é zerar os atrasados." },
    ],
  },
  {
    id: "dna",
    n: "05",
    title: "DNA da empresa",
    desc: "Os fatos — e por que o sistema nunca inventa",
    color: "#f59e0b",
    steps: [
      { title: "O que é o DNA", content: "São os fatos da sua empresa: preços, horários, planos, parceiros, políticas. É a fonte única de verdade. O que não está no DNA, o sistema não afirma." },
      { title: "Trava anti-invenção", content: "Se falta um fato para responder com segurança, o sistema escala para um humano em vez de inventar. É isso que torna a resposta confiável — nunca um preço errado ou uma promessa que não existe." },
    ],
  },
  {
    id: "automacao",
    n: "06",
    title: "Versão automática (upgrade)",
    desc: "Ligar o motor sem perder o manual",
    color: "#34d399",
    steps: [
      { title: "O que muda no upgrade", content: "O automático é o mesmo sistema, com o motor de IA ligado: ele gera as respostas (e pode até enviar sozinho por um canal). O manual continua disponível o tempo todo — nada é perdido." },
      { title: "Modo de operação", content: "Na aba Automação você escolhe o modo:\n• Desligado — 100% manual.\n• Simulação — gera e conta, mas não envia (para calibrar).\n• Automático — gera e envia dentro das regras." },
      { title: "Regras anti-bloqueio e orçamento", content: "Você define máximo de mensagens por dia, janela de horário, quanto esperar entre contatos, quando parar de insistir e um teto de orçamento mensal. Bateu o teto, a automação suspende até virar o mês — sem surpresa na conta." },
    ],
  },
  {
    id: "tecnicas",
    n: "07",
    title: "Técnicas de venda (o porquê)",
    desc: "Os princípios por trás das respostas",
    color: "#fb7185",
    steps: [
      { title: "Transparência de preço na hora certa", content: "Descubra a necessidade antes de despejar a tabela. Quando apresentar valores, mostre as opções e destaque a mais vantajosa como argumento de fechamento." },
      { title: "Fechamento por alternativa", content: "Em vez de \"o que acha?\", ofereça duas opções: \"prefere de manhã ou à noite?\". Isso conduz à decisão em vez de abrir espaço para o \"vou pensar\"." },
      { title: "Fechamento pressuposto", content: "Presuma o sim: \"quando você quiser começar, já deixo tudo pronto\" no lugar de \"você quer fechar?\"." },
      { title: "Aversão à perda", content: "Enquadre o que o cliente perde ao adiar: cada dia parado é um dia de benefício desperdiçado. A dor de perder move mais que o prazer de ganhar." },
      { title: "Experiência que vende sozinha", content: "Sempre que der, conduza para a experiência (aula/semana/visita). Quem experimenta com acompanhamento converte muito mais." },
    ],
  },
  {
    id: "erros",
    n: "08",
    title: "Erros comuns a evitar",
    desc: "O que NÃO fazer no atendimento",
    color: "var(--danger)",
    steps: [
      { title: "Pergunta aberta como CTA", content: "Evite \"o que você acha?\" e \"quer pensar e me avisa?\". Troque por alternativa ou pressuposto — sempre com um próximo passo claro." },
      { title: "Deixar o lead esfriar", content: "Não espere dias. Quando o toque vence, aparece como atrasado na Agenda. Retorne no dia certo — lead frio converte muito menos." },
      { title: "Esquecer de registrar", content: "Sempre registre o atendimento no cliente. Sem registro, o sistema não acompanha a jornada nem agenda o próximo passo, e a pessoa some da sua lista." },
    ],
  },
];

export default function Tutorial() {
  const [open, setOpen] = useState<string | null>("inicio");
  const [step, setStep] = useState(0);

  const toggle = (id: string) => {
    setOpen(open === id ? null : id);
    setStep(0);
  };

  return (
    <div>
      <div className="card mt-16" style={{ background: "var(--brand-gradient-soft)", borderColor: "var(--border-brand)" }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Comece aqui: o fluxo do dia</p>
        <ol className="text-dim" style={{ margin: 0, paddingLeft: 20, fontSize: 14, lineHeight: 1.7 }}>
          <li>Abra o <strong>Início</strong> e veja os toques de hoje e os atrasados</li>
          <li>No <strong>Responder</strong>, escolha o cliente e cole a mensagem</li>
          <li>Copie a melhor resposta e mande pelo WhatsApp</li>
          <li>Registre o atendimento e confira a <strong>Agenda</strong></li>
        </ol>
      </div>

      <div className="stack mt-16" style={{ gap: 10 }}>
        {SECTIONS.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="card" style={{ padding: 0, overflow: "hidden", borderColor: isOpen ? "var(--border-strong)" : undefined }}>
              <button
                onClick={() => toggle(s.id)}
                className="linklike"
                style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "14px 16px", color: "var(--text)" }}
              >
                <span style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: "color-mix(in srgb, " + s.color + " 16%, transparent)", color: s.color, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {s.n}
                </span>
                <span className="grow">
                  <span style={{ display: "block", fontWeight: 600 }}>{s.title}</span>
                  <span className="text-faint" style={{ fontSize: 13 }}>{s.desc}</span>
                </span>
                <span className="text-faint">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 16px 14px" }}>
                  {s.steps.map((st, i) => {
                    const so = step === i;
                    return (
                      <div key={i} style={{ borderTop: "1px solid var(--border)" }}>
                        <button
                          onClick={() => setStep(so ? -1 : i)}
                          className="linklike"
                          style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 0", color: "var(--text)" }}
                        >
                          <span style={{ width: 24, height: 24, borderRadius: 999, display: "grid", placeItems: "center", background: so ? "color-mix(in srgb, " + s.color + " 18%, transparent)" : "var(--surface-2)", color: so ? s.color : "var(--text-dim)", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {i + 1}
                          </span>
                          <span className="grow" style={{ fontSize: 14, fontWeight: 500 }}>{st.title}</span>
                          <span className="text-faint" style={{ fontSize: 12 }}>{so ? "−" : "+"}</span>
                        </button>
                        {so && (
                          <p className="text-dim" style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6, margin: "0 0 14px", paddingLeft: 36 }}>
                            {st.content}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Teaser do curso */}
      <div className="card mt-24" style={{ borderColor: "var(--border-brand)" }}>
        <div className="row" style={{ gap: 12 }}>
          <span className="badge badge-brand">Em breve</span>
          <strong>Curso de Vendas Avançadas</strong>
        </div>
        <p className="text-dim" style={{ marginTop: 10, marginBottom: 0, fontSize: 14 }}>
          Este tutorial ensina o sistema. O curso vai além: forma qualquer pessoa a
          ter cabeça de vendedor, com as técnicas dos grandes mestres aplicadas ao
          seu dia a dia. Um aprofundamento à parte, para times que querem vender mais.
        </p>
      </div>
    </div>
  );
}
