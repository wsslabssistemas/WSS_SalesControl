/**
 * QUEM SÃO OS EX-ALUNOS — e quantos deles o sistema ainda não conhece.
 *
 * ⚠ NÃO ESCREVE NADA. É a metade "prever" da regra que vale para toda operação
 * destrutiva ou em massa neste repositório: mostrar o que aconteceria antes de
 * fazer. Uma importação de mil pessoas não se desfaz com um clique.
 *
 * O QUE ELE DECIDE, e por que a definição importa mais que o código:
 *
 *   ex-aluno = **pagou pelo menos uma vez** e **não é aluno hoje**.
 *
 * "Pagou pelo menos uma vez" é o filtro de qualidade que o fundador escolheu
 * em 14/ago: entram os ~1.200 do relatório de recebimentos, não os 9.158
 * cadastros. Quem pagou foi aluno de verdade; o resto é cadastro de qualidade
 * desconhecida, e base maior com qualidade menor é o caminho para "não poluir"
 * virar o problema principal.
 *
 * "Não é aluno hoje" sai do BANCO, não da planilha: quem está na aba de
 * matrículas já foi sincronizado e tem `custom.codigo_sistema` preenchido.
 *
 *   node scripts/diagnostico-ex-alunos.mjs "<caminho do Recebimentos.xls>" [slug]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { lerRecebimentos } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/planilha.ts")).href
);

const arquivo = process.argv[2];
const slug = process.argv[3] ?? "be-fitness";
if (!arquivo) {
  console.error("Uso: node scripts/diagnostico-ex-alunos.mjs \"<caminho>\" [slug]");
  process.exit(1);
}

// A chave de serviço mora no .env.local do app.
const env = fs.readFileSync(path.join(ROOT, "apps/web/.env.local"), "utf8");
const pega = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1] ?? "").trim();
const supabase = createClient(pega("NEXT_PUBLIC_SUPABASE_URL"), pega("SUPABASE_SERVICE_ROLE_KEY"));

const { data: tenant } = await supabase.from("tenants").select("id, name").eq("slug", slug).maybeSingle();
if (!tenant) { console.error(`Empresa "${slug}" não encontrada.`); process.exit(1); }

// ---------------------------------------------------------------- A PLANILHA
const texto = fs.readFileSync(arquivo, "utf8");
console.log(`\nArquivo: ${path.basename(arquivo)} · ${(texto.length / 1048576).toFixed(1)} MB`);

const rec = lerRecebimentos(texto);
if (rec.erro) { console.error(`\n✗ ${rec.erro}`); process.exit(1); }

console.log(`Colunas: chave "${rec.entendeu.chave}", pagamento "${rec.entendeu.pagamento}", valor "${rec.entendeu.valor}"`);
console.log(`${rec.entendeu.lidas} linhas → ${rec.pagantes.length} pagantes distintos`);
if (rec.descartadas.length) {
  console.log(`Descartadas na porta (dado sensível sem uso): ${rec.descartadas.join(", ")}`);
}

// -------------------------------------------------------------------- O BANCO
// PAGINADO: o PostgREST corta em 1.000 sem avisar, e aqui o corte inverteria a
// conclusão — quem não viesse na página apareceria como "não conhecido" e
// entraria como contato novo, duplicando gente que já existe.
const conhecidos = new Map();
for (let de = 0; ; de += 1000) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone, journey_stage, custom, contract_end")
    .eq("tenant_id", tenant.id)
    .is("deleted_at", null)
    .order("id")
    .range(de, de + 999);
  if (error) throw new Error(error.message);
  for (const c of data ?? []) {
    const cod = c.custom?.["codigo_sistema"];
    if (cod) conhecidos.set(String(cod), c);
  }
  if ((data ?? []).length < 1000) break;
}

// --------------------------------------------------------------- A COMPARAÇÃO
const hoje = new Date().toISOString().slice(0, 10);
const novos = [];      // pagou e o sistema não conhece
const jaExistem = [];  // pagou e já está cadastrado
for (const p of rec.pagantes) {
  const c = conhecidos.get(p.chave);
  if (c) jaExistem.push({ p, c });
  else novos.push(p);
}

/**
 * Sem telefone não dá para falar — contato mudo é linha na tela sem ação.
 *
 * ⚠ ESTA LINHA JÁ MENTIU. A primeira versão lia `p.telefone` de um `Pagante`
 * que não tinha esse campo, e anunciou **"1.200 sem telefone"** — plausível,
 * alarmante e falso: o relatório traz `Celular` e `Telefone-1-ou-2`, e quem
 * não lia era `lerRecebimentos`. Só apareceu porque os cabeçalhos do arquivo
 * foram conferidos antes de a conclusão virar recomendação.
 *
 * Fica a regra: **número que sai de um campo que talvez não exista tem que ser
 * conferido contra a fonte antes de virar decisão.** `undefined` em JavaScript
 * não reclama — ele vira "todos", e "todos" tem cara de descoberta.
 */
const semTelefone = novos.filter((p) => !p.telefone);

const porAno = {};
for (const p of novos) {
  const ano = (p.ultimoPagamento ?? "sem data").slice(0, 4);
  porAno[ano] = (porAno[ano] ?? 0) + 1;
}

console.log(`\n${"=".repeat(64)}`);
console.log(`JÁ CADASTRADOS (não entram de novo):        ${String(jaExistem.length).padStart(6)}`);
console.log(`NÃO CONHECIDOS — candidatos a ex-aluno:     ${String(novos.length).padStart(6)}`);
console.log(`${"=".repeat(64)}`);

console.log(`\nPor ano do ÚLTIMO pagamento — é o que vira a data de saída:`);
for (const ano of Object.keys(porAno).sort().reverse()) {
  const n = porAno[ano];
  console.log(`  ${ano}  ${String(n).padStart(5)}  ${"█".repeat(Math.round(n / 20))}`);
}

console.log(`\nQuanto cada um valeu enquanto foi cliente:`);
const faixas = [
  ["pagou 1 vez        ", (p) => p.pagamentos === 1],
  ["2 a 5 pagamentos   ", (p) => p.pagamentos >= 2 && p.pagamentos <= 5],
  ["6 a 11 pagamentos  ", (p) => p.pagamentos >= 6 && p.pagamentos <= 11],
  ["12 ou mais         ", (p) => p.pagamentos >= 12],
];
for (const [rotulo, teste] of faixas) {
  const g = novos.filter(teste);
  const soma = g.reduce((s, p) => s + p.totalCents, 0);
  console.log(`  ${rotulo} ${String(g.length).padStart(5)}  ·  R$ ${(soma / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
}

console.log(`\n⚠ O que precisa de decisão antes de importar:`);
console.log(`  · ${semTelefone.length} sem telefone no relatório — entrariam mudos.`);
const antigos = novos.filter((p) => (p.ultimoPagamento ?? "") < "2024-01-01").length;
console.log(`  · ${antigos} pararam de pagar antes de 2024 — reativação de 3+ anos é outra conversa.`);

console.log(`\nAmostra (confira contra o sistema da academia):`);
for (const p of novos.slice(0, 8)) {
  console.log(`  ${String(p.chave).padStart(6)}  ${(p.nome ?? "(sem nome)").slice(0, 34).padEnd(34)}  último: ${p.ultimoPagamento ?? "—"}  ${String(p.pagamentos).padStart(3)}x`);
}
console.log(`\nNada foi gravado. Hoje é ${hoje}.\n`);
