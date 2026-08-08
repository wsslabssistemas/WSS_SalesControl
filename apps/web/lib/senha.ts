// Regra da senha, num módulo comum.
//
// Mora aqui e não junto da action porque arquivo `"use server"` só pode
// exportar função async — constante ali quebra o build. E o número precisa
// ser o MESMO na validação do servidor e no `minLength` do formulário: se
// divergirem, o navegador aceita e o servidor recusa, e a pessoa vê a tela
// recarregar com erro sem entender o que fez de errado.

/** Piso do Supabase é 6; 8 é o mínimo razoável para quem vê dado de cliente. */
export const SENHA_MINIMA = 8;
