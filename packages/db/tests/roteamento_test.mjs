/**
 * O ROTEAMENTO POR MOTIVO — por qual número cada toque sai.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE.
 *
 * A escolha de canal era UMA chave por empresa, e uma chave só obriga a
 * escolher entre "tudo pelo número novo" e "nada". Ligar tudo é o defeito que
 * o fundador nomeou em 16/ago: o cliente recebe a mensagem do sistema por um
 * número e a resposta da recepcionista por outro, e do lado dele não são dois
 * canais da academia — são dois desconhecidos.
 *
 * As três propriedades que este arquivo guarda, e que são fáceis de desfazer
 * sem perceber:
 *
 *   1. **O padrão é quase tudo no link humano.** Só `reativacao` sai pelo
 *      número oficial, porque é o único motivo que fala com quem NÃO é
 *      cliente. Se alguém "melhorar" o padrão ligando os outros, a operação
 *      corrente inteira muda de número em silêncio — e passa a custar.
 *   2. **Credencial não liga canal.** Sem token salvo, tudo continua no link.
 *   3. **`bloqueado` não cai de volta no link humano.** Escolher o número
 *      oficial e não ter modelo aprovado precisa APARECER. Cair no `wa.me`
 *      despejaria mil conversas frias no celular pessoal de um vendedor, em
 *      silêncio e com aparência de sucesso.
 *
 * Valor esperado escrito no arquivo. "Parece certo" não é critério.
 */

import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { rotaDoToque, rotaDaResposta, lerRoteamento, lerModelos, ROTEAMENTO_PADRAO } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/roteamento.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "  ok" : "FALHA"}  ${nome}`);
  if (!ok) console.log(`        esperado: ${JSON.stringify(esperado)}\n        obtido:   ${JSON.stringify(obtido)}`);
}

const TUDO_LIGADO = {
  combinado: true, renovacao: true, followup: true,
  recompra: true, lembrete: true, reativacao: true,
};

// ---------------------------------------------------------------------
// 1. O PADRÃO — separação por público, não por ferramenta
// ---------------------------------------------------------------------

// Esperado: só `reativacao` verdadeiro. É a decisão de operação da Be Fitness
// ("o número novo cuida dos ex-alunos; a recepção segue no antigo") virada
// código, e é o único motivo que fala com quem não é cliente.
verifica("padrão: só reativação sai pelo número oficial", ROTEAMENTO_PADRAO, {
  combinado: false, renovacao: false, followup: false,
  recompra: false, lembrete: false, reativacao: true,
});

// Esperado: "link_humano". Follow-up é conversa aberta com uma PESSOA; trocar
// o número no meio dela quebra o que fazia aquilo funcionar.
verifica(
  "follow-up com credencial e tudo configurado continua no link humano",
  rotaDoToque({
    motivo: "followup",
    roteamento: ROTEAMENTO_PADRAO,
    temCredencial: true,
    janelaAberta: false,
    modelos: { followup: "followup_retomada" },
  }).via,
  "link_humano",
);

// ---------------------------------------------------------------------
// 2. CREDENCIAL NÃO LIGA CANAL — a regra de `canalDe`, um nível abaixo
// ---------------------------------------------------------------------

// Esperado: "link_humano". Empresa que nunca configurou canal não pode ver a
// fila travar por uma escolha que ela não fez.
verifica(
  "reativação sem credencial cai no link humano, não em bloqueado",
  rotaDoToque({
    motivo: "reativacao",
    roteamento: ROTEAMENTO_PADRAO,
    temCredencial: false,
    janelaAberta: false,
    modelos: {},
  }).via,
  "link_humano",
);

// ---------------------------------------------------------------------
// 3. A JANELA DE 24 HORAS DECIDE TEXTO × MODELO
// ---------------------------------------------------------------------

// Esperado: "cloud_api_texto". Dentro da janela, texto livre — e hoje grátis.
verifica(
  "dentro da janela, texto livre pela API",
  rotaDoToque({
    motivo: "reativacao",
    roteamento: ROTEAMENTO_PADRAO,
    temCredencial: true,
    janelaAberta: true,
    modelos: {},
  }).via,
  "cloud_api_texto",
);

// Esperado: "cloud_api_modelo" com o nome cadastrado. Fora da janela, a Meta
// só entrega modelo aprovado.
verifica(
  "fora da janela, com modelo cadastrado, sai pelo modelo",
  (() => {
    const r = rotaDoToque({
      motivo: "reativacao",
      roteamento: ROTEAMENTO_PADRAO,
      temCredencial: true,
      janelaAberta: false,
      modelos: { reativacao: "reativacao_ex_aluno" },
    });
    return [r.via, r.modelo];
  })(),
  ["cloud_api_modelo", "reativacao_ex_aluno"],
);

// ⚠ O CASO QUE MAIS IMPORTA. Esperado: "bloqueado", NUNCA "link_humano".
// Cair no link aqui despejaria a reativação inteira no celular pessoal de um
// vendedor, em silêncio.
verifica(
  "fora da janela e SEM modelo: bloqueado, e não cai no link humano",
  rotaDoToque({
    motivo: "reativacao",
    roteamento: ROTEAMENTO_PADRAO,
    temCredencial: true,
    janelaAberta: false,
    modelos: {},
  }).via,
  "bloqueado",
);

// Esperado: "bloqueado". Nome em branco não é modelo — se virasse, a Meta
// recusaria com erro sobre template inexistente, que se lê como "o canal
// quebrou".
verifica(
  "modelo cadastrado em branco não conta como modelo",
  rotaDoToque({
    motivo: "reativacao",
    roteamento: ROTEAMENTO_PADRAO,
    temCredencial: true,
    janelaAberta: false,
    modelos: lerModelos({ automation: { modelos: { reativacao: "   " } } }),
  }).via,
  "bloqueado",
);

// ---------------------------------------------------------------------
// 4. A LEITURA DAS CONFIGURAÇÕES — valor estranho vira o padrão
// ---------------------------------------------------------------------

// Esperado: o padrão inteiro. Settings vazio é o estado de toda empresa que
// nunca abriu a tela, e ele não pode ligar nem desligar nada por acidente.
verifica("settings vazio devolve o padrão", lerRoteamento(null), ROTEAMENTO_PADRAO);

// Esperado: só `recompra` muda; o resto segue o padrão. Valor não-booleano é
// ignorado em vez de virar `false` — desligar a reativação em silêncio é o
// erro que ninguém procura, porque a fila só fica menor.
verifica(
  "valor inválido é ignorado, o booleano vale, e o resto segue o padrão",
  lerRoteamento({ automation: { canal_por_motivo: { recompra: true, reativacao: "sim", followup: 1 } } }),
  { ...ROTEAMENTO_PADRAO, recompra: true },
);

// Esperado: reativacao desligada de propósito continua desligada. O padrão não
// pode sobrescrever uma escolha EXPLÍCITA da empresa.
verifica(
  "false explícito vence o padrão",
  lerRoteamento({ automation: { canal_por_motivo: { reativacao: false } } }).reativacao,
  false,
);

// Esperado: só o nome válido, já sem espaços nas pontas.
verifica(
  "modelos: apara espaço e descarta o que não é texto",
  lerModelos({ automation: { modelos: { reativacao: "  reativacao_ex_aluno  ", recompra: "", followup: 7 } } }),
  { reativacao: "reativacao_ex_aluno" },
);

// Esperado: tudo ligado + sem modelo nenhum = todos bloqueados menos os que
// têm janela aberta. É o cenário "liguei tudo e não cadastrei nada", e ele
// precisa gritar em vez de sair pelo wa.me.
verifica(
  "tudo ligado sem modelo nenhum bloqueia os seis",
  ["combinado", "renovacao", "followup", "recompra", "lembrete", "reativacao"].map(
    (m) => rotaDoToque({
      motivo: m, roteamento: TUDO_LIGADO, temCredencial: true,
      janelaAberta: false, modelos: {},
    }).via,
  ),
  ["bloqueado", "bloqueado", "bloqueado", "bloqueado", "bloqueado", "bloqueado"],
);

// ---------------------------------------------------------------------
// 5. A RESPOSTA — que nao escolhe nada: sai por onde a conversa esta
//
// A PROPRIEDADE QUE ESTE BLOCO GUARDA: `rotaDaResposta` NAO tem chave de
// configuracao. Se alguem acrescentar uma, responder de um numero diferente
// daquele em que a pessoa escreveu volta a ser possivel — e e o defeito de
// 16/ago: do lado dela nao sao dois canais da academia, sao dois
// desconhecidos. Pior no caso que mais importa: o cliente que pede um humano
// pede socorro e recebe resposta de um numero estranho.
// ---------------------------------------------------------------------

// Esperado: "cloud_api_texto". Escreveu no oficial e a janela esta aberta —
// texto livre, sem modelo, e hoje de graca. E a UNICA peca do canal que
// funciona antes de qualquer modelo ser aprovado.
verifica(
  "conversa no oficial dentro da janela responde por texto livre",
  rotaDaResposta({ temCredencial: true, conversaNoCanalOficial: true, janelaAberta: true }).via,
  "cloud_api_texto",
);

// Esperado: "link_humano". Nunca escreveu para o numero do sistema, entao a
// conversa dela e com quem atende — e a resposta sai do mesmo lugar.
verifica(
  "quem nunca escreveu para o oficial e respondido pelo link humano",
  rotaDaResposta({ temCredencial: true, conversaNoCanalOficial: false, janelaAberta: false }).via,
  "link_humano",
);

// Esperado: "link_humano". Sem credencial nada sai pela API, como em canalDe.
verifica(
  "sem credencial a resposta cai no link humano",
  rotaDaResposta({ temCredencial: false, conversaNoCanalOficial: true, janelaAberta: true }).via,
  "link_humano",
);

// Esperado: "bloqueado", e NUNCA "cloud_api_modelo". Passadas 24h aquilo
// deixou de ser resposta e virou retomada — retomada tem motivo, e motivo e
// trabalho da fila. Emendar um modelo aqui faria o sistema "responder" com um
// texto fixo aprovado dias antes, sem relacao com o que a pessoa perguntou.
verifica(
  "fora da janela a resposta bloqueia em vez de emendar um modelo",
  rotaDaResposta({ temCredencial: true, conversaNoCanalOficial: true, janelaAberta: false }).via,
  "bloqueado",
);

// Esperado: o texto explica que ela volta pela fila. Bloqueio sem saida se le
// como "o sistema quebrou" — a regra 1 da cota de IA valendo aqui.
verifica(
  "o bloqueio da resposta diz que a pessoa volta pela fila",
  rotaDaResposta({ temCredencial: true, conversaNoCanalOficial: true, janelaAberta: false })
    .porque.includes("fila"),
  true,
);

console.log(falhas === 0 ? "\nroteamento: tudo certo." : `\nroteamento: ${falhas} falha(s).`);
process.exit(falhas === 0 ? 0 : 1);
