// O TESTE GRÁTIS — duração, avisos e o que acontece quando acaba.
//
// Sem banco e sem imports, para ser testável em Node puro. E mora fora das
// actions porque arquivo `"use server"` só pode exportar função async — uma
// constante ali quebra o build.
//
// A DECISÃO DO FUNDADOR (ago/2026), registrada porque tem contrapartida:
// avisos em 7, 3 e 1 dia e, no dia seguinte ao fim, **trava**. Os dados
// continuam salvos; o que para é a geração com IA.
//
// A ressalva que fica escrita para o dia em que alguém revisar: travar tende a
// fazer a pessoa sumir em vez de conversar — quem perde o acesso não negocia,
// só vai embora. Os três avisos são o que reduz esse risco, e é por isso que
// eles não são enfeite: são a única chance de a conversa acontecer com ela
// ainda dentro. Se a conversão do teste vier baixa, este é o primeiro lugar
// para olhar, não o preço.

/** Quantos dias o teste dura. Um lugar só — a tela e a criação leem daqui. */
export const DIAS_DE_TESTE = 30;

/** Quando avisar, em dias restantes. Do mais folgado para o mais urgente. */
export const AVISOS = [7, 3, 1] as const;

export type EstadoDoTeste =
  | { fase: "sem_teste" }
  /** Rodando e ainda longe do fim: nenhum aviso, para não virar ruído. */
  | { fase: "tranquilo"; diasRestantes: number }
  /** Dentro de uma janela de aviso. */
  | { fase: "avisando"; diasRestantes: number; texto: string; urgente: boolean }
  /** Acabou: IA suspensa, dados intactos. */
  | { fase: "encerrado"; diasAtras: number; texto: string };

/**
 * Em que pé está o teste desta empresa.
 *
 * `diasRestantes` conta dias INTEIROS até o fim. Faltando 30 horas, restam 1
 * dia — arredondar para cima aqui faria o aviso de "último dia" aparecer no
 * penúltimo e o de "acabou" chegar com a IA ainda funcionando, que é a pior
 * combinação: o aviso perde a credibilidade e ninguém age no dia certo.
 */
export function estadoDoTeste(
  trialEndsAt: string | Date | null | undefined,
  agora: Date = new Date(),
): EstadoDoTeste {
  if (!trialEndsAt) return { fase: "sem_teste" };

  const fim = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt);
  if (Number.isNaN(fim.getTime())) return { fase: "sem_teste" };

  const ms = fim.getTime() - agora.getTime();

  if (ms <= 0) {
    const diasAtras = Math.floor(-ms / 86400000);
    return {
      fase: "encerrado",
      diasAtras,
      texto:
        "Seu teste terminou. A geração com IA está suspensa — seus dados, contatos e " +
        "histórico continuam aqui, intactos. Para voltar a usar, é só contratar.",
    };
  }

  const diasRestantes = Math.floor(ms / 86400000);
  const janela = AVISOS.find((d) => diasRestantes < d);
  if (janela === undefined) return { fase: "tranquilo", diasRestantes };

  const quanto =
    diasRestantes <= 0 ? "Hoje é o último dia"
    : diasRestantes === 1 ? "Falta 1 dia"
    : `Faltam ${diasRestantes} dias`;

  return {
    fase: "avisando",
    diasRestantes,
    urgente: diasRestantes <= 1,
    texto:
      `${quanto} de teste. Quando acabar, a geração com IA para e seus dados ` +
      "continuam salvos — o que muda é o motor, não o cadastro.",
  };
}

/**
 * O curso no teste vai só até o módulo 1.
 *
 * Decisão do fundador: dá para conhecer o método sem entregar as 45 lições de
 * graça. É demonstração, e demonstração que entrega o produto inteiro não é
 * demonstração — é o produto.
 *
 * A regra é por ORDEM do módulo, não por chave: amarrar em `"modulo_1"` faria
 * a liberação depender do nome, e renomear um módulo mudaria silenciosamente o
 * que é gratuito.
 */
export const MODULOS_NO_TESTE = 1;

export function moduloLiberado(
  ordem: number,
  opcoes: { emTeste: boolean; cursoComprado: boolean },
): boolean {
  if (opcoes.cursoComprado) return true;
  if (opcoes.emTeste) return ordem <= MODULOS_NO_TESTE;
  return false;
}
