// Regras da automação por empresa. Guardadas em tenants.settings.automation.
// O núcleo não sabe de canal (WhatsApp/Facebook são plugues no fim) — aqui
// mora só a política: modo e regras anti-bloqueio. Espelha o piloto Base44.

export type AutomationMode = "off" | "simulation" | "auto";

export type AutomationSettings = {
  mode: AutomationMode;
  max_per_day: number; // limite total gerado em 24h
  min_hours_between: number; // espera mínima desde o último contato sem resposta
  max_no_reply: number; // para após N mensagens sem resposta
  cooldown_hours: number; // espera após o cliente responder/engajar
  window_start: number; // hora em que a automação começa a operar
  window_end: number; // hora em que a automação para
  stop_after_days: number; // sem engajamento por N dias → bloqueia
  monthly_budget_credits: number; // 0 = sem limite; ao atingir, suspende até virar o mês
};

export const AUTOMATION_DEFAULTS: AutomationSettings = {
  mode: "off",
  max_per_day: 30,
  min_hours_between: 24,
  max_no_reply: 3,
  cooldown_hours: 48,
  window_start: 9,
  window_end: 19,
  stop_after_days: 14,
  monthly_budget_credits: 0,
};

const MODES: AutomationMode[] = ["off", "simulation", "auto"];

export function readAutomation(settings: unknown): AutomationSettings {
  const a = (settings as { automation?: Partial<AutomationSettings> } | null)?.automation ?? {};
  const num = (v: unknown, def: number, min: number, max: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
  };
  return {
    mode: MODES.includes(a.mode as AutomationMode) ? (a.mode as AutomationMode) : "off",
    max_per_day: num(a.max_per_day, AUTOMATION_DEFAULTS.max_per_day, 0, 1000),
    min_hours_between: num(a.min_hours_between, AUTOMATION_DEFAULTS.min_hours_between, 0, 720),
    max_no_reply: num(a.max_no_reply, AUTOMATION_DEFAULTS.max_no_reply, 0, 50),
    cooldown_hours: num(a.cooldown_hours, AUTOMATION_DEFAULTS.cooldown_hours, 0, 720),
    window_start: num(a.window_start, AUTOMATION_DEFAULTS.window_start, 0, 23),
    window_end: num(a.window_end, AUTOMATION_DEFAULTS.window_end, 0, 23),
    stop_after_days: num(a.stop_after_days, AUTOMATION_DEFAULTS.stop_after_days, 0, 365),
    monthly_budget_credits: num(a.monthly_budget_credits, 0, 0, 100000000),
  };
}

export const MODE_LABEL: Record<AutomationMode, string> = {
  off: "Desligado",
  simulation: "Simulação",
  auto: "Automático",
};

export const MODE_HINT: Record<AutomationMode, string> = {
  off: "A automação não roda. Operação 100% manual.",
  simulation: "Gera e conta as mensagens, mas não envia. Serve para calibrar as regras.",
  auto: "Gera e envia dentro das regras. (Exige a versão automática e um canal ligado.)",
};
