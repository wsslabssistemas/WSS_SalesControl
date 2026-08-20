// A HORA LOCAL DE UMA EMPRESA.
//
// ⚠ POR QUE ISTO EXISTE — o defeito de 20/ago/2026.
//
// O executor do motor passava `new Date().getHours()` como "hora local". O
// servidor da Vercel roda em **UTC**, e o Brasil é UTC-3: às 18h de Porto
// Alegre o processo acredita que são 21h. Com a janela de operação padrão
// (9h–19h), o efeito era duplo e invisível:
//
//   • à tarde, quando a recepção está trabalhando, o motor se considerava
//     FORA da janela e não fazia nada;
//   • às 6h da manhã (9h UTC) ele se considerava DENTRO e dispararia.
//
// O sintoma que chegou foi o fundador dizendo *"não estou conseguindo puxar a
// simulação, não está gerando lista nenhuma"*. Nada quebrou, nada deu erro: a
// lista voltava vazia com um motivo que parecia razoável.
//
// ⚠ E o pior: o tipo em `lib/motor.ts` já dizia "quem converte o fuso é quem
// chama". Quem chamava não convertia. **Comentário e código discordando em
// silêncio** — a forma de erro que mais custou neste projeto.

/** O fuso padrão. Todo cliente do produto está no Brasil hoje. */
export const FUSO_PADRAO = "America/Sao_Paulo";

/**
 * Lê o fuso da empresa de `tenants.settings.timezone`.
 *
 * Fuso inválido cai no padrão em vez de explodir: um erro de digitação na
 * configuração não pode derrubar o motor de todo mundo, e o padrão está certo
 * para 100% da base atual.
 */
export function lerFuso(settings: unknown): string {
  const v = (settings as { timezone?: unknown } | null)?.timezone;
  if (typeof v !== "string" || !v.trim()) return FUSO_PADRAO;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: v.trim() });
    return v.trim();
  } catch {
    return FUSO_PADRAO;
  }
}

/**
 * A hora (0–23) num fuso, para um instante.
 *
 * Usa `Intl` de propósito, e não uma subtração de 3 horas: o Brasil já teve
 * horário de verão e pode voltar a ter. Deslocamento fixo é a mesma classe de
 * erro que este arquivo existe para consertar, só que mais difícil de achar.
 */
export function horaLocal(quando: Date, fuso: string = FUSO_PADRAO): number {
  const h = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour: "numeric",
    hour12: false,
  }).format(quando);
  const n = Number(h);
  // `24` aparece em algumas implementações para meia-noite.
  return Number.isFinite(n) ? n % 24 : quando.getUTCHours();
}

/** O dia (`AAAA-MM-DD`) num fuso — o "hoje" da empresa, não o do servidor. */
export function diaLocalISO(quando: Date, fuso: string = FUSO_PADRAO): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(quando);
  return p.slice(0, 10);
}
