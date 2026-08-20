// QUEM PEDIU PARA NÃO RECEBER MAIS — reconhecimento de descadastro.
//
// Arquivo sem imports, como `lib/markdown.ts` e `lib/modelo.ts`: é texto puro,
// então dá para testar em Node sem banco e sem bundler.
//
// ⚠ POR QUE ISTO É AUTOMÁTICO, e não uma caixinha para alguém marcar depois.
//
// Honrar pedido de descadastro é exigência da LGPD e da política do WhatsApp.
// Deixar para o humano marcar significa que, entre o pedido e a marcação, o
// motor continua mandando — e o motor manda de madrugada, no fim de semana, sem
// ninguém lendo. A janela entre "ele pediu" e "alguém viu" é justamente onde a
// denúncia acontece.
//
// ⚠ E ERRAR AQUI TEM LADO CERTO.
//
// Falso positivo: paramos de falar com alguém que não pediu. Custo: um lead.
// Falso negativo: seguimos falando com quem pediu para parar. Custo: denúncia
// ao WhatsApp, que derruba a qualidade do NÚMERO — e a qualidade do número
// afeta a entrega de tudo, inclusive a renovação de quem paga em dia. O
// prejuízo não fica contido na pessoa que reclamou.
//
// Por isso a lista é generosa e a marcação é REVERSÍVEL: a ficha mostra que
// ele pediu, com data, e um clique desfaz.

/**
 * Frases que valem como pedido de descadastro.
 *
 * ⚠ SÃO FRASES, NÃO PALAVRAS SOLTAS — e a diferença é o que impede o desastre.
 * "sair" sozinho pegaria *"quero sair do plano básico"*, *"vou sair da cidade"*
 * e *"posso sair às 18h?"*. Uma pessoa interessada seria silenciada por dizer
 * uma palavra comum do português.
 *
 * O acento é removido antes de comparar, porque ninguém digita com acento no
 * WhatsApp — e uma regra que só pega texto acentuado não pega nada na vida
 * real.
 */
const PEDIDOS = [
  "nao quero mais receber",
  "nao quero receber mais",
  "nao quero mais mensagens",
  "nao quero mais mensagem",
  "nao me mande mais",
  "nao me manda mais",
  "nao me mandem mais",
  "nao me envie mais",
  "nao me envia mais",
  "pare de me mandar",
  "para de me mandar",
  "pare de mandar",
  "para de mandar",
  "pare de me enviar",
  "parem de me mandar",
  "me tira dessa lista",
  "me tire dessa lista",
  "me tira da lista",
  "me tire da lista",
  "me remove da lista",
  "me remova da lista",
  "sair da lista",
  "me descadastra",
  "me descadastre",
  "descadastrar",
  "me desinscreve",
  "cancelar inscricao",
  "nao me perturbe",
  "nao me perturba",
  "nao me incomode",
  "para de me incomodar",
  "pare de me incomodar",
  "me deixa em paz",
  "me deixe em paz",
  "nao tenho interesse em receber",
  "nao me liguem mais",
  "nao me ligue mais",
];

/** Tira acento e caixa, para comparar como a pessoa realmente digita. */
function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A pessoa pediu para não receber mais?
 *
 * Devolve a FRASE reconhecida, não `true` — porque ela vira o motivo gravado
 * na ficha. Um booleano deixaria a marcação sem justificativa, e marcação sem
 * motivo é a que ninguém tem coragem de desfazer depois.
 */
export function pediuParaSair(texto: string | null | undefined): string | null {
  const t = normalizar(texto ?? "");
  if (!t) return null;
  for (const p of PEDIDOS) {
    if (t.includes(p)) return p;
  }
  return null;
}

/**
 * ⚠ O CASO QUE PRECISA FICAR DE FORA: o botão de opt-out do próprio WhatsApp.
 *
 * Quando os modelos ganharem o botão "Parar promoções", a Meta manda um
 * `type: "button"` com o texto do botão — e aí NÃO é interpretação nossa, é a
 * pessoa clicando num botão que só existe para isso. Esse caminho não passa
 * por lista de frase nenhuma: é sim direto.
 */
export const TEXTO_DO_BOTAO_DE_SAIDA = "parar promocoes";
