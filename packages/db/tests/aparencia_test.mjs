/**
 * A APARÊNCIA POR EMPRESA — sem banco e sem chave.
 *
 * Por que existe: a cor vai para um `style` inline e a logo para um `src`.
 * Campo de texto livre nesses dois lugares é injeção — CSS injetado esconde
 * botão e cobre aviso de limite; `javascript:` num `src` executa código. Nada
 * disso dá erro na tela de quem configurou: dá na tela de quem usa.
 *
 * ESPERADO: 12/12.
 *
 *   node packages/db/tests/aparencia_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { corValida, logoValida, lerAparencia, variaveisDaMarca } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/aparencia.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

// ------------------------------------------------------------------- cor
verifica("hex de 6 dígitos passa", corValida("#2E8DF2"), "#2e8df2");
verifica("hex curto não passa", corValida("#fff"), null);
verifica("nome de cor não passa", corValida("red"), null);
// A injeção que o formato fechado existe para barrar.
verifica("injeção de CSS não passa", corValida("red; background: url(https://x/y)"), null);
verifica("vazio vira null, não string vazia", corValida(""), null);

// ------------------------------------------------------------------ logo
verifica("https passa", logoValida("https://exemplo.com/logo.png"), "https://exemplo.com/logo.png");
// http numa página https é bloqueado pelo navegador: a logo some SEM erro, e o
// cliente conclui que o sistema quebrou.
verifica("http não passa", logoValida("http://exemplo.com/logo.png"), null);
verifica("javascript: não passa", logoValida("javascript:alert(1)"), null);
verifica("data: não passa", logoValida("data:image/svg+xml,<svg onload=alert(1)>"), null);
verifica("lixo não passa", logoValida("logo.png"), null);

// --------------------------------------------------------------- leitura
verifica(
  "settings sujo não derruba a tela",
  lerAparencia({ aparencia: { cor: "vermelho", logo_url: 42 } }),
  { cor: null, logoUrl: null },
);

// ------------------------------------------------------ o que NÃO muda
// Cor de estado não é personalizável: um "erro" verde é um aviso que não
// parece aviso, e aviso que não parece aviso não é aviso.
const vars = variaveisDaMarca({ cor: "#123456", logoUrl: null });
verifica(
  "só a marca muda — sucesso, alerta e perigo ficam de fora",
  Object.keys(vars).some((k) => /success|warn|danger|text|bg-/.test(k)),
  false,
);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 12/12");
process.exit(falhas ? 1 : 0);
