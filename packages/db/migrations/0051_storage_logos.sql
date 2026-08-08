-- 0051 — LOGO POR ARQUIVO, NÃO POR ENDEREÇO
--
-- POR QUE ESTA MIGRATION EXISTE
-- A tela de Aparência pedia um endereço `https://` da logo. Isso presume que
-- a empresa TEM a logo hospedada em algum lugar com endereço direto — e uma
-- academia de bairro não tem. Ela tem um PNG no computador, ou a arte no
-- Instagram, ou um link do Drive. Nenhum dos três é endereço de imagem: o do
-- Instagram e o do Drive devolvem uma PÁGINA, não o arquivo, e a tag <img>
-- mostra imagem quebrada sem explicar por quê.
--
-- O fundador tentou, não funcionou, e a pergunta dele foi a certa: "não dá
-- apenas para colocar um arquivo de imagem?". Dá — e é o único caminho que
-- não exige que o dono da academia saiba o que é hospedagem de arquivo.
--
-- POR QUE `public` = true
-- A logo aparece no cabeçalho de toda página do painel. URL assinada teria
-- que ser renovada a cada carregamento, e uma logo não é segredo: ela já está
-- na fachada, no Instagram e no cartão. O que protege aqui é a ESCRITA, não a
-- leitura — e é por isso que as policies abaixo existem.
--
-- POR QUE SVG FICA DE FORA
-- SVG é XML e aceita <script> dentro. Arquivo enviado por usuário e servido
-- de volta é a definição de XSS armazenado. O Supabase serve o Storage de um
-- domínio diferente do app, o que já limita o estrago, mas não há nenhuma
-- logo de academia que precise de SVG — png, jpeg e webp cobrem 100% do caso
-- real. Recusar um formato custa nada; aceitar um vetor de script custa caro.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  524288, -- 512 KB. Logo de cabeçalho tem 30px de altura; mais que isso é
          -- foto mandada por engano, e o limite recusa antes de gastar banda.
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- QUEM PODE ESCREVER
--
-- O caminho do arquivo é `<tenant_id>/<nome>`, e a primeira pasta é a chave
-- da autorização: `storage.foldername(name))[1]` tem que ser um tenant do
-- qual a pessoa é dono ou administrador. Sem isso, qualquer pessoa logada
-- sobrescreveria a logo de qualquer empresa — que é adulteração de marca
-- alheia dentro do produto, não um bug de aparência.
--
-- `is_admin_of` é a mesma função que governa o UPDATE de `tenants`. Uma regra
-- só, num lugar só: se um dia o critério de administrador mudar, ele muda
-- aqui junto e não fica uma porta velha aberta.
-- ---------------------------------------------------------------------

drop policy if exists "logos_leitura_publica" on storage.objects;
create policy "logos_leitura_publica"
  on storage.objects for select
  using (bucket_id = 'logos');

drop policy if exists "logos_insert_admin" on storage.objects;
create policy "logos_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "logos_update_admin" on storage.objects;
create policy "logos_update_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "logos_delete_admin" on storage.objects;
create policy "logos_delete_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and public.is_admin_of(((storage.foldername(name))[1])::uuid)
  );
