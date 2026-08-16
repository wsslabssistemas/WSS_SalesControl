-- ---------------------------------------------------------------------
-- O APP SECRET TAMBÉM É POR EMPRESA — e a falta disso deixava o webhook
-- recusando TUDO.
--
-- ⚠ ACHADO AO VIVO, ligando o canal da Be Fitness (16/ago/2026).
--
-- O `0056` moveu o token e o ID do número para cá, e deixou o `APP_SECRET`
-- como variável de ambiente. Sobrou uma inconsistência com consequência
-- imediata: `assinaturaConfere` RECUSA quando não há segredo configurado — a
-- regra certa, escrita no `webhook_test` — então **todo pacote da Meta voltava
-- 403**. Confirmação de entrega, status, e mais tarde a mensagem do cliente.
--
-- O sintoma na tela da Meta foi *"Não foi possível entregar a mensagem.
-- Confira seus webhooks"*, que aponta para o lugar certo e não diz a causa.
--
-- E o modelo é o mesmo do token: **cada cliente tem o próprio app na Meta**,
-- verificado no CNPJ dele, com o próprio segredo. Um segredo global só
-- funcionaria para a primeira empresa.
--
-- ⚠ A ORDEM DE VERIFICAÇÃO MUDA POR CAUSA DISTO, e vale registrar: o segredo
-- depende de saber DE QUEM é o pacote, e isso só está escrito dentro do corpo
-- (`phone_number_id`). Então o corpo passa a ser LIDO antes de a assinatura
-- ser conferida — e nada dele é usado para decidir nada até a conferência
-- passar. Ler para escolher a chave é diferente de confiar no conteúdo.
-- ---------------------------------------------------------------------

alter table public.tenant_secrets
  add column if not exists whatsapp_app_secret text;

comment on column public.tenant_secrets.whatsapp_app_secret is
  'App secret da Meta, por empresa: cada cliente tem o proprio app. Valida a assinatura do webhook.';
