// AS VARIÁVEIS DE UM MODELO APROVADO — derivação e higiene.
//
// Arquivo separado e SEM IMPORTS de propósito, como `lib/markdown.ts` e
// `lib/repescagem.ts`: é lógica pura, então dá para testar em Node puro, sem
// banco e sem bundler. (`lib/envio.ts` importa `./phone` sem extensão, o que o
// Node não resolve sozinho — motivo prático que se soma ao motivo bom.)
//
// O que mora aqui é o que decide se a mensagem SAI, e nada sobre rede.

/**
 * ⚠ VALOR DE VARIÁVEL NÃO PODE TER QUEBRA DE LINHA, TABULAÇÃO NEM MAIS DE 4
 * ESPAÇOS SEGUIDOS — a Meta recusa a mensagem inteira.
 *
 * E isso não é caso de borda nesta base: os nomes vieram da planilha do
 * sistema da academia, com espaço duplo e caixa alta. Regra de plataforma que
 * se apresenta como "não enviou" é a classe de defeito que mais custou aqui,
 * então ela morre antes de virar chamada de rede.
 *
 * Colapsa todo espaço em branco num espaço só. Vazio depois disso é recusa —
 * não existe valor padrão aceitável para uma variável de modelo, e mandar
 * "Oi, !" é pior que não mandar.
 */
export function higienizarParametro(
  v: string | null | undefined,
): { ok: true; valor: string } | { ok: false; motivo: string } {
  const limpo = (v ?? "").replace(/\s+/g, " ").trim();
  if (!limpo) return { ok: false, motivo: "Variável do modelo vazia." };
  return { ok: true, valor: limpo };
}

/**
 * O primeiro nome, para o modelo não abrir com o nome completo em caixa alta.
 *
 * ⚠ DERIVA E NUNCA GRAVA, como `paraE164BR`. A regra que preservou a
 * preocupação original vale igual aqui: derivação errada faz a mensagem não
 * sair, em vez de destruir o cadastro. `contacts.name` continua sendo o que
 * alguém escreveu.
 *
 * "MARIA DA SILVA" vira "Maria" — caixa alta numa mensagem de WhatsApp se lê
 * como grito, e o modelo sai no nome da empresa.
 */
export function primeiroNome(
  nome: string | null | undefined,
): { ok: true; valor: string } | { ok: false; motivo: string } {
  const limpo = (nome ?? "").replace(/\s+/g, " ").trim();
  if (!limpo) {
    return { ok: false, motivo: "Contato sem nome — o modelo abre com o nome e não dá para enviar sem ele." };
  }
  const primeiro = limpo.split(" ")[0];
  return { ok: true, valor: primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase() };
}
