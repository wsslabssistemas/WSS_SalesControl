/**
 * A RAÇÃO DO DIA — o teto do que o sistema pede. Sem banco e sem chave.
 *
 * ⚠ POR QUE ESTE TESTE EXISTE.
 *
 * A ração nasceu de um problema de operação, não de código. O fundador:
 * *"eu peço para os vendedores mandarem mensagem, cadastrarem as pessoas, e em
 * determinado momento eles param de executar, sem motivo algum... quando eu
 * percebo, já tem semanas."* E a tela alimentava isso — abria com 245
 * combinados vencidos e 352 pessoas sem contato há 30 dias.
 *
 * O que ela guarda, em ordem de custo se quebrar:
 *
 *   1. **Ração inválida não pode virar zero.** Zero desliga a fila inteira em
 *      silêncio: o vendedor abre a tela vazia e conclui que está tudo em dia.
 *      É a falha na direção que PARECE segura, a mesma classe do
 *      `required_facts` com typo. Valor ruim volta ao padrão, nunca a zero.
 *   2. **Existe um teto de sanidade.** Ração alta demais não é ração, é
 *      rajada — e rajada de mensagem é o que faz o WhatsApp banir o número da
 *      empresa, que é o ativo do cliente pagante.
 *   3. **Resposta do cliente não conta como trabalho de quem atende**, e o
 *      toque conta para QUEM registrou (`created_by`) — vendedor neste produto
 *      é um `membership`, não uma tabela.
 *
 * ESPERADO: 12/12.
 *
 *   node packages/db/tests/racao_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { lerRacao, estadoDaRacao, toquesDeHoje, RACAO_PADRAO, RACAO_MAXIMA } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/racao.ts")).href
);

let ok = 0;
const falhas = [];
const eq = (nome, calcular, esperado) => {
  let obtido;
  try { obtido = typeof calcular === "function" ? calcular() : calcular; }
  catch (e) { obtido = `ERRO: ${e.message}`; }
  if (JSON.stringify(obtido) === JSON.stringify(esperado)) { ok++; console.log(`✓ ${nome}`); }
  else { falhas.push(`${nome}\n    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`); console.log(`✗ ${nome}`); }
};

// ------------------------------------------------- LER O QUE ESTÁ CONFIGURADO
eq("empresa sem configuração usa o padrão", () => lerRacao(null), RACAO_PADRAO);
eq("empresa com valor usa o valor", () => lerRacao({ racao_dia: 25 }), 25);

// ⚠ O CASO QUE MAIS IMPORTA: nada aqui pode virar zero.
eq("zero volta ao padrão — ração zero apagaria a fila em silêncio",
  () => lerRacao({ racao_dia: 0 }), RACAO_PADRAO);
eq("negativo volta ao padrão", () => lerRacao({ racao_dia: -5 }), RACAO_PADRAO);
eq("texto sem número volta ao padrão", () => lerRacao({ racao_dia: "muito" }), RACAO_PADRAO);
eq("acima do teto de sanidade, corta no teto",
  () => lerRacao({ racao_dia: 5000 }), RACAO_MAXIMA);

// ------------------------------------------------------------- O DIA DA PESSOA
eq("começo do dia: cabe a ração inteira",
  () => estadoDaRacao({ teto: 10, feitos: 0, naFila: 40 }).restam, 10);

eq("e o resto da fila fica esperando a vez, sem virar dívida na tela",
  () => estadoDaRacao({ teto: 10, feitos: 0, naFila: 40 }).aguardando, 30);

eq("meio do dia: sobra o que falta",
  () => estadoDaRacao({ teto: 10, feitos: 7, naFila: 40 }).restam, 3);

eq("ração cumprida",
  () => estadoDaRacao({ teto: 10, feitos: 10, naFila: 40 }).cumprida, true);

// Quem trabalhou além do teto não fica com número negativo na tela.
eq("passou do teto por conta própria: continua cumprida, sem negativo",
  () => {
    const r = estadoDaRacao({ teto: 10, feitos: 14, naFila: 40 });
    return [r.restam, r.cumprida];
  }, [0, true]);

// -------------------------------------------------- QUEM FEZ, E O QUE CONTA
eq("conta só o que saiu, por quem registrou, e só de hoje",
  () => toquesDeHoje([
    { created_by: "m1", direction: "outbound", occurred_at: "2026-08-14T09:00:00Z" },
    { created_by: "m1", direction: "outbound", occurred_at: "2026-08-14T18:00:00Z" },
    // resposta do cliente não é trabalho de quem atende
    { created_by: "m1", direction: "inbound", occurred_at: "2026-08-14T10:00:00Z" },
    // ontem não conta para hoje
    { created_by: "m1", direction: "outbound", occurred_at: "2026-08-13T10:00:00Z" },
    // outra pessoa, outra conta
    { created_by: "m2", direction: "outbound", occurred_at: "2026-08-14T11:00:00Z" },
    // registro sem autor não pode ser creditado a ninguém
    { created_by: null, direction: "outbound", occurred_at: "2026-08-14T12:00:00Z" },
  ], "2026-08-14"), { m1: 2, m2: 1 });

console.log();
if (falhas.length) {
  console.log(`✗ FALHOU — ${ok}/${ok + falhas.length}`);
  for (const f of falhas) console.log(`  ✗ ${f}`);
  process.exit(1);
}
console.log(`✓ PASSOU — ${ok}/${ok}`);
