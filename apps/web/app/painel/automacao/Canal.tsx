"use client";

import { useState } from "react";
import { salvarCanal, testarCanal } from "./canal-actions";

/**
 * LIGAR O CANAL OFICIAL — a credencial da empresa e o teste antes do primeiro
 * cliente real.
 *
 * ⚠ O TOKEN NUNCA VOLTA PARA A TELA, nem mascarado. Ele é guardado numa tabela
 * com RLS que nega a todos (`tenant_secrets`, 0056) e lido só no servidor; se
 * a tela o exibisse de volta, o segredo passaria pelo navegador de qualquer
 * administrador — que é exatamente o que a tabela separada existe para evitar.
 * O que a tela mostra é se ESTÁ configurado e os quatro últimos dígitos do ID
 * do número, que bastam para conferir se é a credencial certa.
 */
export function Canal({
  configurado,
  phoneIdFinal,
  temVerifyToken,
  temAppSecret,
  atualizadoEm,
  urlDoWebhook,
}: {
  configurado: boolean;
  phoneIdFinal: string | null;
  temVerifyToken: boolean;
  temAppSecret: boolean;
  atualizadoEm: string | null;
  urlDoWebhook: string;
}) {
  const [numero, setNumero] = useState("");
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensagem: string } | null>(null);

  const testar = async () => {
    setTestando(true);
    setResultado(null);
    try {
      setResultado(await testarCanal(numero));
    } catch (e) {
      setResultado({ ok: false, mensagem: e instanceof Error ? e.message : String(e) });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="card mt-24">
      <div className="row wrap" style={{ gap: 10, alignItems: "center" }}>
        <p className="eyebrow" style={{ margin: 0 }}>Canal oficial (WhatsApp Cloud API)</p>
        {configurado
          ? <span className="badge badge-success">configurado · número …{phoneIdFinal}</span>
          : <span className="badge">não configurado — envio segue pelo link</span>}
      </div>

      <p className="text-dim" style={{ fontSize: 13, marginTop: 10 }}>
        A credencial é <strong>desta empresa</strong>: o número é verificado no CNPJ dela e as
        mensagens saem dele. Sem credencial, nada quebra — a fila continua gerando o texto e
        abrindo o WhatsApp para alguém enviar.
      </p>

      <form action={salvarCanal} className="stack" style={{ gap: 10, marginTop: 14 }}>
        {/* ⚠ OS RÓTULOS SÃO OS DA META, PALAVRA POR PALAVRA — e a primeira
            versão inventou os próprios ("Token permanente", "ID do número").
            O fundador travou por causa disso: *"tem que usar a mesma
            nomenclatura do Meta, senão complica"*. Ele tem razão. Quem
            configura está com duas telas abertas e copia de uma para a outra;
            nome diferente vira um problema de tradução no meio de uma tarefa
            que já é difícil. */}
        <label className="text-dim" style={{ fontSize: 13 }}>
          Token de acesso
          <span className="text-faint" style={{ display: "block", fontSize: 11 }}>
            Na Meta: WhatsApp → Configuração da API → botão <strong>Gerar token</strong>
          </span>
          <input type="password" name="token" autoComplete="off"
            placeholder={configurado ? "já configurado — preencha só para trocar" : "EAAG..."} />
        </label>
        <label className="text-dim" style={{ fontSize: 13 }}>
          Phone Number ID
          <span className="text-faint" style={{ display: "block", fontSize: 11 }}>
            Na Meta: mesma tela, ao lado do número de teste
          </span>
          <input type="text" name="phone_id" autoComplete="off"
            placeholder={phoneIdFinal ? `…${phoneIdFinal}` : "1072873705913820"} />
        </label>
        <label className="text-dim" style={{ fontSize: 13 }}>
          Verificar token {temVerifyToken && <span className="badge badge-success">definido</span>}
          <span className="text-faint" style={{ display: "block", fontSize: 11 }}>
            Este VOCÊ inventa. É o mesmo texto que vai no campo <strong>Verificar token</strong> da Meta,
            em WhatsApp → Configuração → Webhook
          </span>
          <input type="text" name="verify_token" autoComplete="off"
            placeholder="ex.: befitness-kairos-2026" />
        </label>
        {/* ⚠ SEM ELE O WEBHOOK RECUSA TUDO — e recusar e o comportamento certo,
            porque liberar sem conferir a assinatura abriria o unico endereco
            publico do produto para qualquer um escrever no historico de um
            cliente. Enquanto isso era variavel de ambiente, a Meta dizia
            "nao foi possivel entregar a mensagem, confira seus webhooks". */}
        <label className="text-dim" style={{ fontSize: 13 }}>
          Chave Secreta do Aplicativo {temAppSecret && <span className="badge badge-success">definida</span>}
          <span className="text-faint" style={{ display: "block", fontSize: 11 }}>
            <strong>Não é o token.</strong> Fica noutro lugar: no menu da esquerda, lá embaixo,
            <strong> Configurações do app → Básico</strong>. O campo vem escondido — clique em{" "}
            <strong>Mostrar</strong> e confirme sua senha do Facebook.
          </span>
          <input type="password" name="app_secret" autoComplete="off"
            placeholder={temAppSecret ? "já configurada — preencha só para trocar" : "32 caracteres, letras e números"} />
        </label>
        <p className="text-faint" style={{ fontSize: 12, margin: 0 }}>
          Campo em branco <strong>não apaga</strong> o que já está salvo. Sem a chave
          secreta o sistema <strong>recusa tudo que a Meta manda</strong> — inclusive as
          respostas dos clientes.
        </p>
        <button type="submit" className="btn btn-sm" style={{ alignSelf: "flex-start" }}>
          Salvar credencial
        </button>
      </form>

      <div className="card mt-16" style={{ background: "var(--bg-elev)" }}>
        <p className="eyebrow" style={{ marginBottom: 6 }}>Na Meta, aponte o webhook para</p>
        <code style={{ fontSize: 12, wordBreak: "break-all" }}>{urlDoWebhook}</code>
      </div>

      {/* ⚠ O TESTE VEM ANTES DE QUALQUER CLIENTE REAL. O provedor foi escrito
          contra a documentação e nunca rodou contra a API — a primeira
          mensagem tem que ser para um número seu. */}
      <div className="mt-16">
        <p className="eyebrow" style={{ marginBottom: 6 }}>Testar antes de usar com cliente</p>
        <div className="row wrap" style={{ gap: 8, alignItems: "center" }}>
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="seu número, com DDD"
            style={{ width: 200 }}
          />
          <button type="button" className="btn btn-sm" onClick={testar} disabled={testando || !numero.trim()}>
            {testando ? "enviando…" : "Mandar teste para mim"}
          </button>
        </div>
        <p className="text-faint" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          Vai o modelo <code>hello_world</code>, que toda conta nova da Meta já traz aprovado.
          Texto livre só funciona com quem escreveu para a empresa nas últimas 24 horas — então
          um teste com texto falharia mesmo com a credencial certa, e o erro seria lido como
          credencial errada.
        </p>
        {resultado && (
          <p className={`badge ${resultado.ok ? "badge-success" : "badge-danger"}`}
             style={{ whiteSpace: "normal", textAlign: "left", marginTop: 10 }}>
            {resultado.mensagem}
          </p>
        )}
      </div>

      {atualizadoEm && (
        <p className="text-faint" style={{ fontSize: 11, marginTop: 14, marginBottom: 0 }}>
          Credencial atualizada em {new Date(atualizadoEm).toLocaleString("pt-BR")}.
        </p>
      )}
    </div>
  );
}
