// A CARTEIRA — todo contato tem dono, inclusive o que o sistema criou sozinho.
//
// ⚠ POR QUE ISTO EXISTE, e o buraco que ele fecha.
//
// A Fila passou a abrir na carteira de quem está logado — o padrão anterior
// mostrava a lista dos três recepcionistas juntos, e lista que não é de alguém
// não é de ninguém. O fundador viu a consequência na hora: *"e os cadastros que
// não têm responsável? Ninguém vê?"*
//
// Ele estava certo, e o caso não é hipotético: **o webhook do WhatsApp cria
// contato sem `owner_id`.** Quem escreve para a academia e não está cadastrado
// vira lead automaticamente — e nascia órfão, fora da carteira de todo mundo.
// Hoje isso não aparece porque o canal está desligado; no dia em que ligar, é o
// lead NOVO, o mais quente que existe, que some da lista de todo mundo.
//
// É a mesma classe de sempre: não dá erro, não dá aviso. A pessoa simplesmente
// não está em lista nenhuma.
//
// A REGRA: quem entra ganha dono na porta. Manual já era assim (`owner_id` do
// vínculo de quem cadastra); importação distribui; e o que o sistema cria
// sozinho passa por aqui.

/**
 * Escolhe quem recebe um contato novo: **o vendedor com a menor carteira
 * aberta.**
 *
 * Por que menor carteira e não sorteio ou rodízio: rodízio precisa de estado
 * guardado ("de quem foi a vez?") e sorteio desequilibra em amostra pequena —
 * com três pessoas e poucos leads por dia, o acaso concentra. Menor carteira é
 * uma função dos dados que já existem, não precisa lembrar de nada entre uma
 * chamada e outra, e se autocorrige: quem recebeu o último passa a ter mais.
 *
 * `agentes` deve vir ordenado de forma estável (por id) — com carteiras
 * empatadas, o desempate precisa ser o mesmo em duas chamadas iguais, senão o
 * mesmo lead poderia cair em pessoas diferentes em duas tentativas.
 *
 * Devolve `null` quando não há ninguém para receber: nesse caso é melhor o
 * contato ficar sem dono e aparecer no aviso de órfãos do que ser atribuído a
 * um vínculo que não atende.
 */
export function escolherResponsavel(
  agentes: { id: string }[],
  carteiraPorAgente: Record<string, number>,
): string | null {
  if (agentes.length === 0) return null;
  let escolhido = agentes[0];
  let menor = carteiraPorAgente[escolhido.id] ?? 0;
  for (const a of agentes.slice(1)) {
    const carga = carteiraPorAgente[a.id] ?? 0;
    if (carga < menor) {
      menor = carga;
      escolhido = a;
    }
  }
  return escolhido.id;
}
