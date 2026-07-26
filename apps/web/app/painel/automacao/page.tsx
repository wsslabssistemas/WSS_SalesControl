import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { readAutomation, MODE_LABEL, MODE_HINT, type AutomationMode } from "@/lib/automation";
import { saveAutomation } from "./actions";

const FIELDS: { key: keyof ReturnType<typeof readAutomation>; label: string; hint: string; min: number; max: number }[] = [
  { key: "max_per_day", label: "Máx. de mensagens por dia", hint: "Limite total gerado pela automação em 24h", min: 0, max: 1000 },
  { key: "min_hours_between", label: "Horas mín. entre contatos", hint: "Espera mínima desde o último contato (sem resposta)", min: 0, max: 720 },
  { key: "max_no_reply", label: "Máx. de não-respostas", hint: "Após N mensagens sem resposta, para de incomodar", min: 0, max: 50 },
  { key: "cooldown_hours", label: "Cooldown após resposta (h)", hint: "Espera após o cliente responder/engajar", min: 0, max: 720 },
  { key: "window_start", label: "Início da janela (h)", hint: "Horário a partir do qual a automação opera", min: 0, max: 23 },
  { key: "window_end", label: "Fim da janela (h)", hint: "Horário em que a automação para", min: 0, max: 23 },
  { key: "stop_after_days", label: "Parar de incomodar (dias)", hint: "Sem engajamento por N dias → bloqueia", min: 0, max: 365 },
  { key: "monthly_budget_credits", label: "Orçamento mensal (créditos)", hint: "0 = sem limite. Ao atingir, suspende até a virada do mês", min: 0, max: 100000000 },
];

export default async function AutomacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string; erro?: string }>;
}) {
  const { salvo, erro } = await searchParams;
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) {
    return (
      <main>
        <h1>Automação</h1>
        <p className="text-dim">Sem empresa vinculada.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const a = readAutomation(data?.settings);
  const canEdit = ["owner", "admin"].includes(membership!.role);

  const banner: Record<AutomationMode, { cls: string; txt: string }> = {
    off: { cls: "badge", txt: "A automação está desligada — nenhuma mensagem é gerada ou enviada." },
    simulation: { cls: "badge badge-warn", txt: "Modo simulação — mensagens são geradas e contadas, mas não enviadas." },
    auto: { cls: "badge badge-success", txt: "Modo automático — mensagens geradas e enviadas dentro das regras." },
  };

  return (
    <main style={{ maxWidth: 820 }}>
      <h1>Automação</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Controle da versão automática: modo de operação, regras anti-bloqueio e teto
        de orçamento. O manual continua disponível o tempo todo.
      </p>

      <div className="card mt-16 row" style={{ gap: 12 }}>
        <span className={banner[a.mode].cls}>Modo atual: {MODE_LABEL[a.mode]}</span>
        <span className="text-dim" style={{ fontSize: 14 }}>{banner[a.mode].txt}</span>
      </div>

      {salvo && <p className="badge badge-success mt-16">Regras salvas.</p>}
      {erro && <p className="badge badge-danger mt-16">{erro}</p>}

      <form action={saveAutomation} className="card mt-24">
        <p className="eyebrow">Modo de operação</p>
        <div className="seg mt-8" role="radiogroup" aria-label="Modo de operação">
          {(["off", "simulation", "auto"] as AutomationMode[]).map((m) => (
            <label key={m}>
              <input type="radio" name="mode" value={m} defaultChecked={a.mode === m} disabled={!canEdit} />
              {MODE_LABEL[m]}
            </label>
          ))}
        </div>
        <p className="text-faint mt-8" style={{ fontSize: 13 }}>{MODE_HINT[a.mode]}</p>

        <hr className="divider" />
        <p className="eyebrow" style={{ marginBottom: 14 }}>Regras anti-bloqueio</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label" htmlFor={f.key}>{f.label}</label>
              <input
                id={f.key}
                name={f.key}
                type="number"
                min={f.min}
                max={f.max}
                defaultValue={a[f.key]}
                disabled={!canEdit}
              />
              <p className="text-faint" style={{ fontSize: 12, marginTop: 4 }}>{f.hint}</p>
            </div>
          ))}
        </div>

        {canEdit ? (
          <button type="submit" className="btn btn-primary mt-24">Salvar regras</button>
        ) : (
          <p className="text-faint mt-16" style={{ fontSize: 13 }}>
            Só quem é dono ou admin da empresa pode alterar estas regras.
          </p>
        )}
      </form>

      <div className="card mt-24">
        <p className="eyebrow" style={{ marginBottom: 8 }}>Histórico de execuções</p>
        <p className="text-dim" style={{ margin: 0, fontSize: 14 }}>
          Cada execução (mensagens geradas, bloqueadas, tokens e créditos) aparece aqui
          quando a versão automática estiver ligada. Enquanto o motor de IA não está
          conectado, o modo fica em <strong>Desligado</strong> e nada é gerado — as
          regras acima já ficam guardadas e valem no dia em que ligar.
        </p>
      </div>
    </main>
  );
}
