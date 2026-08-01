// Disponibilidade: quais horários estão livres.
//
// É o que permite o motor dizer "sábado 10h está livre, confirmo?" em vez de
// escalar para um humano. Sem isto, o modo automático não fecha agendamento.
//
// O núcleo calcula; a duração do serviço e se o segmento agenda vêm do
// manifesto (Lei 1 — nenhum vocabulário de mercado aqui).

const MIN = 60000;

export type RegraJornada = {
  membership_id: string | null;
  weekday: number; // 0 = domingo
  starts_at: string; // "09:00:00"
  ends_at: string;
};

export type Bloqueio = {
  membership_id: string | null;
  starts_at: string; // ISO
  ends_at: string;
};

export type Compromisso = {
  membership_id: string | null;
  starts_at: string; // ISO
  duration_min: number;
};

export type Vaga = {
  inicio: Date;
  fim: Date;
  membershipId: string | null;
};

export type SchedulingConfig = {
  /** O segmento trabalha com hora marcada? */
  enabled?: boolean;
  /** Duração padrão quando o serviço não define. */
  default_duration_min?: number;
  /** De quanto em quanto tempo os horários começam (ex.: 30 = 9h, 9h30…). */
  slot_step_min?: number;
  /** Antecedência mínima para marcar (evita oferecer daqui a 5 minutos). */
  min_advance_min?: number;
};

function hhmmParaMinutos(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function noDia(base: Date, minutos: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + minutos * MIN);
}

function conflita(inicio: Date, fim: Date, oIni: Date, oFim: Date): boolean {
  return inicio < oFim && oIni < fim;
}

/**
 * Horários livres nos próximos `dias`, respeitando jornada, bloqueios e o que
 * já está marcado. Se `membershipId` for informado, calcula a agenda daquele
 * profissional (usando a regra dele ou, na falta, a da empresa).
 */
export function calcularVagas(input: {
  regras: RegraJornada[];
  bloqueios: Bloqueio[];
  compromissos: Compromisso[];
  duracaoMin: number;
  cfg?: SchedulingConfig | null;
  dias?: number;
  membershipId?: string | null;
  agora?: Date;
  limite?: number;
}): Vaga[] {
  const {
    regras, bloqueios, compromissos, duracaoMin,
    cfg, dias = 14, membershipId = null, limite = 60,
  } = input;

  const agora = input.agora ?? new Date();
  const passo = cfg?.slot_step_min ?? 30;
  const antecedencia = cfg?.min_advance_min ?? 60;
  const minimo = new Date(agora.getTime() + antecedencia * MIN);

  // Regra do profissional tem prioridade; sem ela, vale a da empresa.
  const doProfissional = regras.filter((r) => r.membership_id === membershipId && membershipId);
  const daEmpresa = regras.filter((r) => r.membership_id === null);
  const aplicaveis = doProfissional.length ? doProfissional : daEmpresa;
  if (aplicaveis.length === 0) return [];

  // Só interessam bloqueios/compromissos do profissional em questão (ou gerais).
  const meusBloqueios = bloqueios.filter((b) => !membershipId || !b.membership_id || b.membership_id === membershipId);
  const meusCompromissos = compromissos.filter((c) => !membershipId || c.membership_id === membershipId || !c.membership_id);

  const vagas: Vaga[] = [];

  for (let d = 0; d < dias && vagas.length < limite; d++) {
    const dia = new Date(agora.getTime() + d * 24 * 60 * MIN);
    const weekday = dia.getDay();

    for (const regra of aplicaveis.filter((r) => r.weekday === weekday)) {
      const abre = hhmmParaMinutos(regra.starts_at);
      const fecha = hhmmParaMinutos(regra.ends_at);

      for (let m = abre; m + duracaoMin <= fecha; m += passo) {
        if (vagas.length >= limite) break;

        const inicio = noDia(dia, m);
        const fim = new Date(inicio.getTime() + duracaoMin * MIN);

        if (inicio < minimo) continue;

        const bloqueado = meusBloqueios.some((b) =>
          conflita(inicio, fim, new Date(b.starts_at), new Date(b.ends_at)),
        );
        if (bloqueado) continue;

        const ocupado = meusCompromissos.some((c) => {
          const cIni = new Date(c.starts_at);
          const cFim = new Date(cIni.getTime() + (c.duration_min || 30) * MIN);
          return conflita(inicio, fim, cIni, cFim);
        });
        if (ocupado) continue;

        vagas.push({ inicio, fim, membershipId });
      }
    }
  }

  vagas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  return vagas;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

/** "sábado, 09/08 às 10h" — como a pessoa fala, não como o banco guarda. */
export function descreverVaga(v: Vaga | Date): string {
  const d = v instanceof Date ? v : v.inicio;
  const dia = DIAS[d.getDay()];
  const data = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  const h = d.getHours();
  const min = d.getMinutes();
  const hora = min === 0 ? `${h}h` : `${h}h${String(min).padStart(2, "0")}`;
  return `${dia}, ${data} às ${hora}`;
}

/**
 * Poucas opções convertem melhor que muitas: espalha as vagas ao longo dos
 * dias para oferecer alternativas realmente diferentes, não três horários
 * seguidos da mesma manhã.
 */
export function escolherOpcoes(vagas: Vaga[], quantas = 3): Vaga[] {
  const porDia = new Map<string, Vaga[]>();
  for (const v of vagas) {
    const chave = v.inicio.toDateString();
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push(v);
  }
  const escolhidas: Vaga[] = [];
  for (const lista of porDia.values()) {
    if (escolhidas.length >= quantas) break;
    escolhidas.push(lista[0]);
  }
  // Se só há um dia disponível, completa com horários daquele dia.
  if (escolhidas.length < quantas) {
    for (const v of vagas) {
      if (escolhidas.length >= quantas) break;
      if (!escolhidas.includes(v)) escolhidas.push(v);
    }
  }
  return escolhidas.slice(0, quantas);
}
