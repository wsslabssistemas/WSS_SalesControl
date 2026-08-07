/**
 * PROXIMIDADE NA PROSPECÇÃO — sem banco e sem chave.
 *
 * Por que existe: aqui a tentação é prometer precisão que o dado não tem. A
 * busca pública de CNPJ devolve cnpj, razão social, fantasia e situação — só
 * isso, verificado chamando a API. Não há coordenada, e "empresas num raio de
 * 3 km" seria invenção com cara de recurso.
 *
 * O caso que mais importa é o da AUSÊNCIA: empresa sem CEP não pode ser tratada
 * como distância zero. Se fosse, justamente as empresas sem endereço apareceriam
 * como as mais próximas — e o vendedor sairia visitando quem não dá para achar.
 *
 * ESPERADO: 10/10.
 *
 *   node packages/db/tests/proximidade_test.mjs
 */
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { cepDigits, distanciaCep, ordenarPorProximidade, bairrosEncontrados } = await import(
  pathToFileURL(path.join(ROOT, "apps/web/lib/proximidade.ts")).href
);

let falhas = 0;
function verifica(nome, obtido, esperado) {
  const ok = JSON.stringify(obtido) === JSON.stringify(esperado);
  if (!ok) falhas++;
  console.log(`${ok ? "✓" : "✗"} ${nome}`);
  if (!ok) console.log(`    esperado: ${JSON.stringify(esperado)}\n    obtido:   ${JSON.stringify(obtido)}`);
}

const e = (cnpj, cep, bairro) => ({ cnpj, razao: cnpj, fantasia: null, bairro, cep, municipio: "PORTO ALEGRE" });

// ------------------------------------------------------------------- CEP
verifica("CEP com máscara vira dígitos", cepDigits("90035-190"), "90035190");
verifica("CEP curto não passa", cepDigits("9003519"), null);
verifica("vazio vira null", cepDigits(""), null);
verifica("distância é diferença crua", distanciaCep("90035190", "90035000"), 190);

// A AUSÊNCIA NÃO É ZERO. Sem CEP, `null` — e `null` vai para o fim.
verifica("sem CEP a distância é null, não zero", distanciaCep(null, "90035190"), null);

const ordenadas = ordenarPorProximidade(
  [e("longe", "91787000", "Restinga"), e("semCep", null, "—"), e("perto", "90035200", "Farroupilha")],
  "90035190",
);
verifica("ordena do mais perto ao mais longe", ordenadas.map((x) => x.cnpj), ["perto", "longe", "semCep"]);
verifica("quem não tem CEP fica no FIM, nunca no topo", ordenadas.at(-1).cnpj, "semCep");

// Sem referência, não inventa ordem: ordenar por CEP absoluto sem ponto de
// partida ordenaria por bairro alfabético disfarçado de distância.
verifica(
  "sem CEP de referência, mantém a ordem que veio",
  ordenarPorProximidade([e("b", "91787000", "x"), e("a", "90035200", "y")], null).map((x) => x.cnpj),
  ["b", "a"],
);

// ---------------------------------------------------------------- bairros
// Bairro é EXATO, ao contrário do CEP — é o filtro em que dá para confiar.
const bairros = bairrosEncontrados([e("1", "1", "Centro"), e("2", "2", "Centro"), e("3", "3", "Moinhos")]);
verifica("agrupa por bairro, do maior para o menor", bairros, [
  { bairro: "Centro", n: 2 },
  { bairro: "Moinhos", n: 1 },
]);
verifica("bairro vazio não vira grupo", bairrosEncontrados([e("1", "1", null), e("2", "2", "  ")]), []);

console.log(falhas ? `\n✗ FALHOU — ${falhas} caso(s)` : "\n✓ PASSOU — 10/10");
process.exit(falhas ? 1 : 0);
