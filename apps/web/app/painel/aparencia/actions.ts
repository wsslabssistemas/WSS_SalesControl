"use server";

import { createClient } from "@/lib/supabase/server";
import { getActiveTenant } from "@/lib/auth";
import { corValida, logoValida, checarLogoArquivo, caminhoDaLogo } from "@/lib/aparencia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const erroPara = (msg: string) => "/painel/aparencia?erro=" + encodeURIComponent(msg);

/**
 * Salva cor e logo da empresa.
 *
 * VALIDA NO SERVIDOR, sempre. O `<input type="color">` do navegador já entrega
 * hex, mas nada impede um POST direto — e a cor vai para um `style` inline.
 * Validação que só existe no cliente é decoração.
 *
 * Valor inválido volta como ERRO, não como silêncio. Salvar em silêncio o que
 * foi recusado é a pior combinação: a pessoa acha que configurou, olha a tela
 * e não vê mudança nenhuma.
 */
export async function salvarAparencia(formData: FormData) {
  const membership = await getActiveTenant();
  const tenant = membership?.tenant;
  if (!tenant) redirect("/painel");
  if (membership!.role !== "owner" && membership!.role !== "admin") {
    redirect(erroPara("Só o dono e o administrador mudam a aparência."));
  }

  const corBruta = String(formData.get("cor") ?? "").trim();
  const cor = corValida(corBruta);
  if (corBruta && !cor) redirect(erroPara("Cor inválida. Use o formato #RRGGBB."));

  const supabase = await createClient();
  const { data } = await supabase.from("tenants").select("settings").eq("id", tenant.id).maybeSingle();
  const settings = ((data?.settings as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const atual = ((settings.aparencia ?? {}) as Record<string, unknown>);
  const logoAtual = typeof atual.logo_url === "string" ? atual.logo_url : null;

  // ------------------------------------------------------------------
  // A LOGO TEM TRÊS CAMINHOS, e a ordem entre eles importa.
  //
  // 1. Remover  — botão explícito. Vem primeiro porque é o único que a
  //    pessoa pediu de forma inequívoca; qualquer outra leitura seria
  //    adivinhar.
  // 2. Arquivo enviado — o caminho normal. Quem tem a logo tem o arquivo,
  //    não um endereço.
  // 3. Endereço colado — segue existindo para quem TEM site com a logo
  //    publicada, mas deixou de ser o único jeito.
  //
  // Campo vazio NÃO apaga a logo: quem entra para mudar só a cor não pode
  // perder a marca por não ter mexido num campo que não era o assunto.
  // ------------------------------------------------------------------
  let logo: string | null = logoAtual;

  if (String(formData.get("remover") ?? "") === "1") {
    logo = null;
  } else {
    const arquivo = formData.get("logo_arquivo");
    const temArquivo = arquivo instanceof File && arquivo.size > 0;

    if (temArquivo) {
      const check = checarLogoArquivo(arquivo.type, arquivo.size);
      if (!check.ok) redirect(erroPara(check.erro));

      const caminho = caminhoDaLogo(tenant.id, check.extensao);
      const { error: upErr } = await supabase.storage
        .from("logos")
        .upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });

      // O ERRO DO UPLOAD NÃO PODE PASSAR EM SILÊNCIO. Se o Storage recusar
      // (limite, permissão, rede) e a gente seguisse, a tela diria "salva"
      // e o cabeçalho continuaria sem logo — o pior dos dois mundos.
      if (upErr) redirect(erroPara(`Não consegui guardar o arquivo: ${upErr.message}`));

      logo = supabase.storage.from("logos").getPublicUrl(caminho).data.publicUrl;
    } else {
      const logoBruta = String(formData.get("logo_url") ?? "").trim();
      if (logoBruta) {
        const valida = logoValida(logoBruta);
        if (!valida) {
          redirect(erroPara(
            "Esse endereço não serve. Ele precisa começar com https:// e apontar direto " +
            "para o arquivo da imagem (terminando em .png ou .jpg). Link de Instagram, " +
            "Google Drive ou Canva devolve uma página, não a imagem — nesse caso use o envio de arquivo.",
          ));
        }
        logo = valida;
      }
    }
  }

  const { error: saveErr } = await supabase
    .from("tenants")
    .update({ settings: { ...settings, aparencia: { cor, logo_url: logo } } })
    .eq("id", tenant.id);

  // Mesmo motivo do upload: a gravação em `tenants` passa por RLS, e RLS
  // recusa devolvendo erro, não exceção. Sem esta checagem a tela mostrava
  // "Aparência salva" para uma gravação que não aconteceu — foi exatamente
  // isso que o fundador viu ao tentar cadastrar a logo da Be Fitness.
  if (saveErr) redirect(erroPara(`Não consegui salvar: ${saveErr.message}`));

  // A logo antiga sai do bucket DEPOIS que a nova já está gravada. Na ordem
  // inversa, uma falha na gravação deixaria a empresa sem logo nenhuma.
  if (logoAtual && logoAtual !== logo) {
    const anterior = logoAtual.split("/logos/")[1];
    if (anterior) await supabase.storage.from("logos").remove([anterior]);
  }

  revalidatePath("/painel", "layout");
  redirect("/painel/aparencia?ok=1");
}
