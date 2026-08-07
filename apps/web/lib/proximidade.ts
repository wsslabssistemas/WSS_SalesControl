// PROXIMIDADE NA PROSPECÇÃO — sem banco e sem imports.
//
// POR QUE NÃO EXISTE RAIO EM QUILÔMETROS, e por que dizer isso importa mais
// que entregar um número bonito:
//
// A busca pública de CNPJ devolve **cnpj, razão social, nome fantasia e
// situação**. Só isso — verificado chamando a API em ago/2026. Não há
// endereço, não há CEP, não há coordenada. Filtrar por raio no momento da
// BUSCA é impossível com esta fonte, e prometer "empresas num raio de 3 km"
// seria inventar precisão que o dado não tem.
//
// O que existe é o ENRIQUECIMENTO, uma chamada por CNPJ, que traz endereço,
// bairro e CEP. Então a proximidade acontece DEPOIS da busca, sobre a lista
// que voltou — e é por isso que ela é uma ordenação, não um filtro de busca.
//
// E O SINAL É O CEP, com uma ressalva honesta: no Brasil o CEP é atribuído por
// logradouro em blocos aproximadamente geográficos DENTRO do mesmo município.
// Isso faz `|cepA − cepB|` correlacionar com distância, mas NÃO é distância:
// dois CEPs vizinhos podem estar em lados opostos de um rio, e a numeração
// salta em áreas novas. Por isso a tela chama de "por proximidade de CEP" e
// nunca de "raio", e por isso o BAIRRO — que é exato — aparece do lado.
//
// A alternativa cara seria geocodificar cada endereço. Fica anotado como
// decisão adiada com motivo: custa por requisição, precisa de chave, e o ganho
// sobre "ordenar por CEP e mostrar o bairro" é pequeno para o uso real, que é
// escolher 20 empresas para visitar oferecendo convênio.

/** Só os 8 dígitos. `null` quando não dá para ler. */
export function cepDigits(v: string | null | undefined): string | null {
  const d = (v ?? "").replace(/\D/g, "");
  return d.length === 8 ? d : null;
}

/**
 * Distância CRUA entre dois CEPs, em unidades de CEP — não em metros.
 *
 * `null` quando um dos dois falta, e `null` NÃO é zero: sem CEP a empresa vai
 * para o fim da lista, e não para o topo. Tratar ausência como proximidade
 * máxima colocaria justamente as empresas sem endereço como as mais próximas.
 */
export function distanciaCep(a: string | null, b: string | null): number | null {
  const x = cepDigits(a);
  const y = cepDigits(b);
  if (!x || !y) return null;
  return Math.abs(Number(x) - Number(y));
}

export type EmpresaComEndereco = {
  cnpj: string;
  razao: string;
  fantasia: string | null;
  bairro: string | null;
  cep: string | null;
  municipio: string | null;
};

export type EmpresaOrdenada = EmpresaComEndereco & {
  /** `null` = sem CEP para comparar. Vai para o fim. */
  distancia: number | null;
};

/**
 * Ordena por proximidade de CEP à referência.
 *
 * Sem referência, devolve na ordem em que veio — ordenar por CEP absoluto sem
 * um ponto de partida ordenaria por bairro alfabético disfarçado de distância.
 */
export function ordenarPorProximidade(
  empresas: EmpresaComEndereco[],
  cepReferencia: string | null,
): EmpresaOrdenada[] {
  const ref = cepDigits(cepReferencia);
  const com = empresas.map((e) => ({ ...e, distancia: ref ? distanciaCep(e.cep, ref) : null }));
  if (!ref) return com;
  return com.sort((a, b) => {
    if (a.distancia === null && b.distancia === null) return 0;
    if (a.distancia === null) return 1;
    if (b.distancia === null) return -1;
    return a.distancia - b.distancia;
  });
}

/** Os bairros que apareceram, com quantas empresas em cada. Exato, ao contrário do CEP. */
export function bairrosEncontrados(empresas: EmpresaComEndereco[]): { bairro: string; n: number }[] {
  const conta = new Map<string, number>();
  for (const e of empresas) {
    const b = (e.bairro ?? "").trim();
    if (!b) continue;
    conta.set(b, (conta.get(b) ?? 0) + 1);
  }
  return [...conta.entries()]
    .map(([bairro, n]) => ({ bairro, n }))
    .sort((a, b) => b.n - a.n || a.bairro.localeCompare(b.bairro, "pt-BR"));
}
