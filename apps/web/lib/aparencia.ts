// APARÊNCIA POR EMPRESA — cor e logo, sem banco e sem imports.
//
// Pedido do fundador. Num produto multi-empresa isso vale mais do que parece:
// o vendedor ver a marca da PRÓPRIA academia muda a percepção de "sistema de
// terceiro que me obrigaram a usar" para "nosso sistema". Adoção de software
// em PME morre por essa distância, não por falta de recurso.
//
// O QUE **NÃO** É PERSONALIZÁVEL, e é decisão: o rodapé com "feito por WSS
// Labs" e a página Sobre. Marca branca completa esconderia o fabricante — e o
// fabricante é quem responde pela LGPD, por quem vê o dado e por quem conserta
// quando quebra. Esconder isso não é personalização, é confundir o cliente do
// cliente sobre com quem ele está falando.

/** Cor de marca da empresa. `null` = usa a do produto. */
export type Aparencia = {
  cor: string | null;
  logoUrl: string | null;
};

/**
 * Aceita só HEX de 6 dígitos.
 *
 * POR QUE NÃO ACEITAR QUALQUER CSS: a cor vai para um `style` inline no
 * servidor. `red; background: url(...)` num campo de texto livre é injeção de
 * CSS — e CSS injetado consegue esconder botão, cobrir aviso de limite e
 * redesenhar a tela inteira por cima. Um formato fechado custa nada e fecha a
 * porta.
 */
export function corValida(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return /^#[0-9a-fA-F]{6}$/.test(t) ? t.toLowerCase() : null;
}

/**
 * Aceita só `https://`.
 *
 * `http://` numa página `https` é bloqueado pelo navegador e a logo some sem
 * explicação — o cliente conclui que o sistema quebrou. E `javascript:` ou
 * `data:` num `src` é execução de código. Recusar cedo é mais honesto que
 * mostrar uma imagem quebrada.
 */
export function logoValida(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(t);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function lerAparencia(settings: Record<string, unknown> | null | undefined): Aparencia {
  const a = (settings?.aparencia ?? {}) as Record<string, unknown>;
  return {
    cor: corValida(typeof a.cor === "string" ? a.cor : null),
    logoUrl: logoValida(typeof a.logo_url === "string" ? a.logo_url : null),
  };
}

/**
 * As variáveis CSS que sobrescrevem a marca do produto.
 *
 * Só o GRADIENTE e o azul de destaque mudam. Fundo, texto e as cores de estado
 * (sucesso, alerta, perigo) ficam como estão — cor de estado personalizável é
 * como se cria um "erro" verde, e aviso que não parece aviso não é aviso.
 */
export function variaveisDaMarca(a: Aparencia): Record<string, string> {
  if (!a.cor) return {};
  return {
    "--brand-blue": a.cor,
    "--brand-gradient": `linear-gradient(115deg, ${a.cor} 0%, ${a.cor} 100%)`,
    "--brand-gradient-soft": `linear-gradient(115deg, ${a.cor}22, ${a.cor}12)`,
    "--border-brand": `${a.cor}59`,
  };
}
