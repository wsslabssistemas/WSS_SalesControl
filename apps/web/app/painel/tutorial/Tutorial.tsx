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
      { title: "Fluxo do dia recomendado", content: "1) Comece pela FILA DE ENVIO. Ela junta num lugar só quem você combinou de procurar, quem tem contrato vencendo, quem espera follow-up e quem está no ponto de voltar — já na ordem certa.\n2) Em cada linha, clique em Preparar mensagem, leia, ajuste se quiser e abra no WhatsApp.\n3) Marque como enviado. Isso faz a cadência avançar e tira a pessoa da fila.\n4) Quando alguém responder, vá ao Responder, cole a mensagem e trabalhe a resposta.\n5) Antes de fechar, registre a PRÓXIMA AÇÃO de quem pediu para falar depois." },
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
      { title: "Próxima ação: a data que o CLIENTE marcou", content: "Quando alguém disser \"me procura em agosto\", preencha PRÓXIMA AÇÃO na ficha dele: a data e o que ficou combinado.\n\nÉ diferente das outras duas formas de lembrar, que são do sistema: a cadência é a régua do ramo (toque no dia 2) e esfriando é alarme de ausência. Nenhuma das duas sabe o que ele te disse — e cobrar antes queima o contato.\n\nEscreva a nota. \"Voltar dia 3\" não diz nada um mês depois; \"ele começa em agosto, depois das férias\" faz você retomar de onde parou." },
      { title: "Vigência: início e vencimento", content: "Nos ramos que vendem período (academia, curso, escola, clínica), preencha início e vencimento do plano.\n\nA partir daí o sistema avisa em 60, 30 e 7 dias. E o primeiro aviso NÃO fala de renovação: fala do RESULTADO. Renovação vendida em cima de um ganho que o cliente acabou de reconhecer é outra conversa — quem só aparece para cobrar mensalidade ensina o cliente a lembrar do produto como despesa." },
      { title: "Perdido NÃO é quem sumiu", content: "Marque PERDIDO só quando a pessoa DISSER não — e para isso existe a etapa Disse não.\n\nQuem apenas parou de responder vai para Parou de responder, que continua alcançável: ela volta para você em 60 a 90 dias, com ângulo novo. O motivo é medido, não achismo: no piloto real foram 459 perdas por silêncio contra 59 por decisão. Sumir não é dizer não." },
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
      { title: "Com IA", content: "Em vez de só buscar, o sistema LÊ a mensagem e ESCREVE uma resposta personalizada, adaptada ao histórico — e explica o porquê daquela abordagem e qual técnica usou. É o mesmo cockpit, com o motor ligado." },
      { title: "Mover a etapa sem sair da conversa", content: "Logo abaixo da barra de jornada tem um seletor de etapa. Use quando a IA não sugeriu, ou sugeriu diferente do que você sabe — você acabou de falar com a pessoa, e isso não está escrito em lugar nenhum. Seu julgamento vence o do sistema." },
      { title: "Se aparecer o aviso de cota de IA", content: "Cada empresa tem um limite de respostas com IA no mês. Se ele acabar, aparece um aviso AZUL — não é erro e não é defeito.\n\nO cockpit manual (busca na biblioteca por palavra-chave) continua ilimitado e sem custo. Você não fica sem produto: fica sem o motor até virar o mês, ou até o dono aumentar a cota." },
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
      { title: "Fila de envio — onde o dia começa", content: "A Fila junta os quatro motivos para falar com alguém numa lista só, já na ordem por CUSTO DE FURAR:\n1) o que você COMBINOU (o cliente lembra que marcou);\n2) contrato a VENCER (receita já vendida saindo pela porta);\n3) FOLLOW-UP devido (a maior perda medida);\n4) hora de CHAMAR DE VOLTA.\n\nCada pessoa aparece uma vez só, pelo motivo mais urgente — para você não mandar quatro mensagens à mesma pessoa no mesmo dia." },
      { title: "Placar da equipe", content: "Em Equipe tem o placar dos últimos 30 dias. O número do TIME vem primeiro, porque é ele que a comissão cobra.\n\nEm destaque fica o que você controla: atendimentos, tempo de resposta e combinados cumpridos. Conversão só vira percentual quando há amostra suficiente — abaixo disso o sistema diz amostra pequena em vez de mostrar um número que engana." },
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
      { title: "Como é HOJE: a inteligência é nossa, o envio é humano", content: "Hoje o sistema decide QUEM procurar e escreve O QUE dizer — isso é a Fila de envio. O que ele NÃO faz é apertar o botão: você lê, ajusta e envia pelo WhatsApp com um clique.\n\nIsso não é limitação temporária. Envio automático exige a API oficial da Meta, com número dedicado e mensagens aprovadas; e usar provedor não oficial arrisca BANIR o número da sua empresa. O número é o ativo." },
      { title: "O que muda quando a automação ligar", content: "Quando o volume justificar a burocracia da Meta, a mesma fila passa a enviar sozinha — sem reescrever nada. O que muda é quem aperta o botão. O manual continua disponível o tempo todo." },
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
