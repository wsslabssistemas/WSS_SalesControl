/**
 * O preço sugerido por empresa, testado com valores escritos no arquivo.
 *
 * POR QUE EXISTE: esta é a única conta do sistema cujo resultado **cobra
 * dinheiro de alguém**. Um relatório errado atrapalha uma decisão; um piso
 * errado vende abaixo do custo por meses sem ninguém notar, porque o número
 * parece plausível o tempo todo.
 *
 * E a metade mais importante do que se testa aqui é a RECUSA: a conta precisa
 * se negar a sugerir quando a janela observada não sustenta. É a mesma doutrina
 * da trava anti-invenção — falta fato, não redige.
 *
 * Não precisa de banco: `lib/precificacao.ts` é lógica pura.
 *
 *   node packages/db/tests/precificacao_test.mjs
 *
 * ESPERADO: 19/19.
 */
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { sugerirPreco, margemDe, POLITICA_PADRAO, MIN_DIAS, MIN_ATENDIMENTOS } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/precificacao.ts")).href
);

let ok = 0;
let falhou = 0;
function verifica(nome, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) { ok++; console.log(`✓ ${nome}`); }
  else { falhou++; console.log(`✗ ${nome}\n    esperado: ${b}\n    obtido:   ${a}`); }
}

const base = {
  membros: 3,
  contatos: 120,
  atendimentos: 400,
  custoIaCents: 20000, // R$ 200 de IA
  diasObservados: 60,
};

// ---------------------------------------------------------------------
// 1. RECUSA — a metade que importa.
// ---------------------------------------------------------------------

// Empresa de ontem: nem janela nem volume. Não sai preço nenhum.
const nova = sugerirPreco({ membros: 1, contatos: 2, atendimentos: 3, custoIaCents: 0, diasObservados: 2 });
verifica("empresa de 2 dias → insuficiente", nova.tipo, "insuficiente");
verifica("e diz os DOIS motivos", nova.motivos.length, 2);
verifica("sem custo gasto, nem piso sai", nova.pisoCents, null);

// Janela boa, volume ridículo: ainda é anedota. 20 atendimentos em 60 dias não
// descrevem uma empresa — descrevem um teste.
const pouco = sugerirPreco({ ...base, atendimentos: 20 });
verifica("volume abaixo do mínimo → insuficiente", pouco.tipo, "insuficiente");
verifica("mas o piso sai, porque custo é fato e não projeção", pouco.pisoCents, 50000);

// Volume alto num prazo curto: pico de uma semana não vira mês.
const curto = sugerirPreco({ ...base, diasObservados: 5 });
verifica("5 dias com muito volume → insuficiente", curto.tipo, "insuficiente");
verifica(
  "e o motivo é a janela, não o volume",
  curto.motivos.some((m) => m.includes("dias de uso observado")) && curto.motivos.length === 1,
  true,
);

// Exatamente no limite: passa. O limite é limite, não sugestão.
const limite = sugerirPreco({ ...base, diasObservados: MIN_DIAS, atendimentos: MIN_ATENDIMENTOS });
verifica("exatamente no mínimo → sugere", limite.tipo, "faixa");

// ---------------------------------------------------------------------
// 2. A CONTA
// ---------------------------------------------------------------------

// 400 atendimentos em 60 dias = 200/mês. A R$ 1,25 cada = R$ 250,00.
// Custo de IA: R$ 200 em 60 dias = R$ 100/mês. Piso a 80% de margem =
// 100 / 0,2 = R$ 500,00. O piso é MAIOR que o porte — então quem manda é ele,
// e isso precisa aparecer, porque é o sinal de uma empresa cara de servir.
const caro = sugerirPreco(base);
verifica("projeta 200 atendimentos/mês", caro.atendimentosMes, 200);
verifica("piso manda quando o custo de IA é alto para o porte", caro.sugeridoCents, 50000);
verifica("e a tela sabe QUEM governou o preço", caro.governadoPor, "piso");

// Mesma empresa com custo de IA baixo: agora quem manda é o porte.
// R$ 20 em 60 dias = R$ 10/mês → piso R$ 50. Porte = R$ 250. Vence o porte.
const normal = sugerirPreco({ ...base, custoIaCents: 2000 });
verifica("porte manda quando o custo é baixo", normal.sugeridoCents, 25000);
verifica("e diz que foi o porte", normal.governadoPor, "porte");

// Empresa pequena: 40 atendimentos em 30 dias = 40/mês = R$ 50,00 de porte,
// abaixo do mínimo de contrato. O mínimo vence — e diz que venceu.
const pequena = sugerirPreco({ membros: 1, contatos: 15, atendimentos: 40, custoIaCents: 500, diasObservados: 30 });
// R$ 199 é ponto de preço escolhido, não resultado de divisão: sai inteiro,
// sem virar R$ 200 no arredondamento.
verifica("mínimo de contrato vence o porte pequeno", pequena.sugeridoCents, POLITICA_PADRAO.minimoContratoCents);
verifica("e o número escrito pelo fundador não é arredondado", pequena.sugeridoCents, 19900);

// PISO NUNCA ARREDONDA PARA BAIXO — piso que cede não é piso. Custo de
// R$ 100,40/mês a 80% de margem dá R$ 502,00; tem que virar R$ 510, não R$ 500.
const quebrado = sugerirPreco({ ...base, custoIaCents: 20080, diasObservados: 60 });
verifica("piso arredonda para cima", quebrado.pisoCents, 51000);

// Confiança: 60 dias E 200 atendimentos é o corte para "alta".
verifica("janela e volume grandes → confiança alta", caro.confianca, "alta");
verifica("no mínimo → confiança média", limite.confianca, "media");

// Margem real de um preço já praticado.
verifica("margem de R$ 500 com R$ 100 de custo", margemDe(50000, 10000), 0.8);

console.log(falhou ? `\n✗ FALHOU — ${ok}/${ok + falhou}` : `\n✓ PASSOU — ${ok}/${ok}`);
process.exitCode = falhou ? 1 : 0;
