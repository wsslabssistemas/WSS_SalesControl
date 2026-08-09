import { createClient } from "@/lib/supabase/server";

// Módulos vendáveis à parte (add-ons). Abas do núcleo (Início, Responder etc.)
// NÃO entram aqui — são sempre disponíveis.
export type ModuleKey = "prospeccao" | "licitacoes" | "curso";

export const MODULES: Record<ModuleKey, { label: string; href: string; hint: string }> = {
  prospeccao: {
    label: "Oportunidades",
    href: "/painel/oportunidades",
    hint: "Empresas-alvo por segmento e região (B2B)",
  },
  licitacoes: {
    label: "Licitações",
    href: "/painel/licitacoes",
    hint: "Editais públicos do seu segmento",
  },
  // O curso é oferecido a TODO segmento — a técnica de venda não é
  // privilégio de ramo. Sendo uma chave de módulo, serve tanto para vender
  // à parte quanto para embutir na mensalidade: muda a cobrança, não o
  // produto. Por isso não entra em `capabilities` de manifesto nenhum e sim
  // pelo override do tenant, liberado no painel do fabricante.
  curso: {
    label: "Curso",
    href: "/painel/curso",
    hint: "Técnicas de venda aplicadas ao seu ramo",
  },
};

const isModule = (k: string): k is ModuleKey => k in MODULES;

export type Entitlements = {
  trialActive: boolean;
  trialDaysLeft: number | null;
  /** A data crua do fim do teste. Quem precisa saber "falta pouco?" ou "já
   *  acabou?" usa `lib/teste.ts` sobre ela — o booleano acima só diz se está
   *  valendo agora, e some justamente quando o aviso mais importa. */
  trialEndsAt: string | null;
  offered: ModuleKey[]; // aplicável ao segmento (manifesto + override do tenant)
  unlocked: ModuleKey[]; // offered ∩ (teste ativo ∪ comprado)
  has: (m: ModuleKey) => boolean;
};

export function computeEntitlements(
  manifestCapabilities: string[],
  settings: Record<string, unknown> | null,
): Entitlements {
  const s = settings ?? {};
  const extra = Array.isArray(s.capabilities) ? (s.capabilities as string[]) : [];
  const offered = [...new Set([...manifestCapabilities, ...extra])].filter(isModule);

  const trialEndsAt = typeof s.trial_ends_at === "string" ? s.trial_ends_at : null;
  const now = Date.now();
  const trialActive = !!trialEndsAt && new Date(trialEndsAt).getTime() > now;
  const trialDaysLeft = trialActive
    ? Math.ceil((new Date(trialEndsAt!).getTime() - now) / 86400000)
    : null;

  const purchased =
    s.entitlements && typeof s.entitlements === "object"
      ? (s.entitlements as Record<string, boolean>)
      : {};
  const unlocked = offered.filter((m) => trialActive || purchased[m] === true);

  return {
    trialActive,
    trialDaysLeft,
    trialEndsAt,
    offered,
    unlocked,
    has: (m) => unlocked.includes(m),
  };
}

// Carrega manifest.capabilities + settings do tenant e computa (server-side).
export async function loadEntitlements(
  tenantId: string,
  skillKey: string,
): Promise<Entitlements> {
  const supabase = await createClient();
  const [{ data: skill }, { data: t }] = await Promise.all([
    supabase.from("skills").select("manifest").eq("key", skillKey).maybeSingle(),
    supabase.from("tenants").select("settings").eq("id", tenantId).maybeSingle(),
  ]);
  const caps = (skill?.manifest as { capabilities?: string[] } | null)?.capabilities ?? [];
  return computeEntitlements(caps, (t?.settings as Record<string, unknown> | null) ?? null);
}
