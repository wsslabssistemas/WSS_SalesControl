// Geração de calendário no formato iCalendar (.ics).
//
// Por que .ics e não a API do Google: um arquivo .ics publicado numa URL pode
// ser ASSINADO por Google Agenda, Apple, Outlook e qualquer outro — o dono
// adiciona a URL uma vez e os toques passam a aparecer no celular dele,
// atualizando sozinhos. Sem OAuth, sem conta de desenvolvedor, sem custo, e
// funciona em qualquer app de calendário.

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string;
  /** Dia do evento (evento de dia inteiro). */
  date: Date;
  url?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** AAAAMMDD na data local (evento de dia inteiro). */
function ymd(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function stamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escapa conforme o RFC 5545: vírgula, ponto-e-vírgula, barra e quebra. */
function esc(s: string): string {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Linhas de no máximo 75 octetos, conforme exige o formato. */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const partes: string[] = [];
  let resto = line;
  partes.push(resto.slice(0, 75));
  resto = resto.slice(75);
  while (resto.length > 74) {
    partes.push(" " + resto.slice(0, 74));
    resto = resto.slice(74);
  }
  if (resto) partes.push(" " + resto);
  return partes.join("\r\n");
}

export function buildIcs(nomeAgenda: string, eventos: IcsEvent[]): string {
  const agora = new Date();
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WSS Labs//Kairos//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(nomeAgenda)}`,
    "X-WR-TIMEZONE:America/Sao_Paulo",
    // Sugere ao app do calendário atualizar a cada 1h.
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const e of eventos) {
    const fim = new Date(e.date.getTime() + 86400000); // DTEND é exclusivo
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${esc(e.uid)}`,
      `DTSTAMP:${stamp(agora)}`,
      `DTSTART;VALUE=DATE:${ymd(e.date)}`,
      `DTEND;VALUE=DATE:${ymd(fim)}`,
      `SUMMARY:${esc(e.title)}`,
    );
    if (e.description) linhas.push(`DESCRIPTION:${esc(e.description)}`);
    if (e.url) linhas.push(`URL:${esc(e.url)}`);
    linhas.push("END:VEVENT");
  }

  linhas.push("END:VCALENDAR");
  return linhas.map(fold).join("\r\n") + "\r\n";
}
