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

/**
 * OS FORMATOS QUE ACEITAMOS NO ENVIO DE ARQUIVO.
 *
 * A mesma lista está no bucket (`0051`), de propósito: o bucket é a defesa
 * real — ele recusa mesmo que alguém poste direto na API do Storage sem
 * passar por esta tela. A daqui existe para o dono da academia receber uma
 * frase em português em vez de um erro de servidor.
 *
 * SVG está fora e o motivo é segurança, não capricho: SVG é XML e aceita
 * `<script>` dentro. Nenhuma logo de academia precisa de vetor.
 */
export const LOGO_TIPOS = ["image/png", "image/jpeg", "image/webp"] as const;
export const LOGO_TAMANHO_MAX = 524288; // 512 KB — igual ao limite do bucket

const EXTENSAO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Confere um arquivo enviado ANTES de gastar rede com ele.
 *
 * Devolve a extensão quando serve, ou a frase do problema quando não serve.
 * Recusa que não diz o motivo faz a pessoa tentar o mesmo arquivo de novo.
 */
export function checarLogoArquivo(
  tipo: string,
  tamanho: number,
): { ok: true; extensao: string } | { ok: false; erro: string } {
  if (!(LOGO_TIPOS as readonly string[]).includes(tipo)) {
    return { ok: false, erro: "A logo precisa ser PNG, JPG ou WEBP." };
  }
  if (tamanho <= 0) {
    return { ok: false, erro: "O arquivo chegou vazio. Tente enviar de novo." };
  }
  if (tamanho > LOGO_TAMANHO_MAX) {
    const kb = Math.round(tamanho / 1024);
    return { ok: false, erro: `A logo tem ${kb} KB e o limite é 512 KB. Reduza a imagem e envie de novo.` };
  }
  return { ok: true, extensao: EXTENSAO[tipo] };
}

/**
 * O caminho dentro do bucket. A PRIMEIRA PASTA É O `tenant_id`, e não é
 * organização: é a chave que as policies do `0051` leem para decidir quem
 * pode escrever. Mudar este formato sem mudar a policy abre a logo de uma
 * empresa para outra.
 *
 * O nome carrega o instante do envio porque a logo é servida por CDN pública:
 * regravar o mesmo nome deixaria a logo antiga no cache, e o cliente veria a
 * troca "não funcionar" por horas.
 */
export function caminhoDaLogo(tenantId: string, extensao: string, agora = Date.now()): string {
  return `${tenantId}/logo-${agora}.${extensao}`;
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
