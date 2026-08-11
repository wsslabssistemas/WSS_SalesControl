"use client";

import { useState } from "react";
import { AvisoDeCota } from "@/app/painel/AvisoDeCota";
import { linkDeEnvio, ROTULO, type MotivoDaFila } from "@/lib/fila";
import { prepararToque, marcarEnviado } from "./actions";

/**
 * UMA LINHA DA FILA — preparar, enviar, marcar.
 *
 * A GERAÇÃO É SOB DEMANDA, uma por clique, e isso é decisão de custo, não de
 * preguiça: gerar a fila inteira de uma vez transformaria uma tela aberta por
 * engano em dezenas de reais. Com a cota de IA no ar, o teto age de qualquer
 * jeito — mas gastar só no que a pessoa vai realmente enviar é melhor que
 * gastar e bloquear.
 *
 * O ENVIO CONTINUA HUMANO. O `wa.me` abre o WhatsApp com o texto escrito; a
 * pessoa lê, ajusta e envia. Não é limitação temporária: é o que dispensa
 * template aprovado pela Meta e o que protege o número do cliente pagante de
 * ser banido por padrão de disparo.
 */
export function ItemDaFila({
  contactId,
  nome,
  numero,
  ajusteNoNumero,
  motivo,
  intencao,
  observacao,
  atraso,
}: {
  contactId: string;
  nome: string;
  numero: string | null;
  /**
   * Preenchido quando o telefone guardado precisou ser INTERPRETADO para
   * virar E.164 — hoje, na prática, o celular antigo que ganhou o nono
   * dígito. Na base da Be Fitness isso é 39% dos contatos, e é justamente
   * por ser tanta gente que o aviso não pode ficar só no log: quem clica
   * precisa ver o que foi deduzido ANTES de a mensagem sair.
   */
  ajusteNoNumero?: string | null;
  motivo: MotivoDaFila;
  intencao: string;
  /**
   * O que alguém anotou na ficha — contexto para quem vai escrever, **nunca o
   * pretexto**. Aparece em cinza e entre aspas de propósito: é citação, não
   * instrução. Ver a regra do pretexto em `lib/fila.ts`.
   */
  observacao?: string;
  atraso: number;
}) {
  const [texto, setTexto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [limite, setLimite] = useState<string | null>(null);
  const [escalar, setEscalar] = useState(false);
  const [faltam, setFaltam] = useState<string[]>([]);
  const [enviado, setEnviado] = useState(false);

  const preparar = async () => {
    setCarregando(true);
    setErro(null);
    setLimite(null);
    try {
      const r = await prepararToque(contactId, motivo, intencao, observacao);
      if (r.ok) {
        setTexto(r.texto);
        setEscalar(r.escalar);
        setFaltam(r.faltam);
      } else if ("limite" in r) setLimite(r.mensagem);
      else setErro(r.error);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setCarregando(false);
    }
  };

  const link = texto && !escalar ? linkDeEnvio(numero, texto) : null;

  return (
    <li style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
        <span
          className={atraso > 3 ? "badge badge-danger" : atraso > 0 ? "badge badge-warn" : "badge badge-brand"}
          style={{ minWidth: 58, justifyContent: "center" }}
        >
          {atraso > 0 ? `+${atraso}d` : "hoje"}
        </span>
        <a href={`/painel/contatos/${contactId}`} className="grow" style={{ minWidth: 130, fontSize: 14 }}>
          {nome}
        </a>
        <span className="text-faint" style={{ fontSize: 12 }}>{ROTULO[motivo]}</span>
        {!texto && !enviado && (
          <button type="button" className="btn btn-sm" onClick={preparar} disabled={carregando}>
            {carregando ? "preparando…" : "✨ Preparar mensagem"}
          </button>
        )}
        {enviado && <span className="badge badge-success">enviado</span>}
      </div>

      <p className="text-faint" style={{ fontSize: 12, margin: "6px 0 0" }}>{intencao}</p>
      {observacao && (
        <p className="text-faint" style={{ fontSize: 12, margin: "4px 0 0", fontStyle: "italic", opacity: 0.75 }}>
          {observacao} — anotação antiga, pode não valer mais. Confira antes de usar.
        </p>
      )}

      {limite && <AvisoDeCota mensagem={limite} />}
      {erro && <p className="badge badge-danger" style={{ marginTop: 8 }}>{erro}</p>}

      {texto && !enviado && (
        <div className="card" style={{ marginTop: 10, background: "var(--bg-elev)" }}>
          {escalar ? (
            <>
              <span className="badge badge-warn">Escalar — falta fato no DNA</span>
              <p className="text-dim" style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                O motor não escreveu porque a biblioteca exige um fato que a empresa
                não cadastrou — e ele não inventa.
              </p>
              {faltam.length > 0 && (
                <ul className="text-dim" style={{ fontSize: 13, margin: "6px 0 0", paddingLeft: 18 }}>
                  {faltam.map((f) => <li key={f}>{f}</li>)}
                </ul>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14 }}>{texto}</p>
              {link && ajusteNoNumero && (
                <p className="badge badge-warn" style={{ marginTop: 10, whiteSpace: "normal", textAlign: "left" }}>
                  {ajusteNoNumero}
                </p>
              )}
              <div className="row wrap" style={{ gap: 8, marginTop: 12, alignItems: "center" }}>
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ background: "#25D366", color: "#0b2e13", border: "none" }}
                  >
                    Abrir no WhatsApp
                  </a>
                ) : (
                  <span className="text-faint" style={{ fontSize: 12 }}>
                    Sem telefone válido — copie e envie por onde falar com ele.
                  </span>
                )}
                <form
                  action={marcarEnviado}
                  onSubmit={() => setEnviado(true)}
                  style={{ display: "inline" }}
                >
                  <input type="hidden" name="contact_id" value={contactId} />
                  <input type="hidden" name="texto" value={texto} />
                  <button type="submit" className="btn btn-sm btn-ghost">Marquei como enviado</button>
                </form>
                <button type="button" className="btn btn-sm btn-ghost" onClick={preparar} disabled={carregando}>
                  Gerar outra
                </button>
              </div>
              <p className="text-faint" style={{ fontSize: 11, marginTop: 10, marginBottom: 0 }}>
                Leia antes de enviar. O sistema escreve; quem manda é você.
              </p>
            </>
          )}
        </div>
      )}
    </li>
  );
}
