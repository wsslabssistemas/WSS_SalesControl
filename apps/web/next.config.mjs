/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    /**
     * ⚠ O CORPO DA SERVER ACTION PRECISA CABER O RELATÓRIO DA ACADEMIA.
     *
     * O padrão do Next é **1 MB**, e a tela de sincronização manda o TEXTO do
     * arquivo para o servidor. O relatório "Recebimentos Detalhados" da Be
     * Fitness tem **4,3 MB** — ele estourava o limite e a gravação não
     * acontecia, **sem erro visível na tela**. O fundador só disse "não está
     * salvando", que é exatamente como esse defeito se apresenta.
     *
     * É a classe de sempre neste produto: falha que se parece com silêncio.
     *
     * 12 MB dá folga para a base crescer (o arquivo cobre desde 2023 e ganha
     * ~2.500 linhas por ano) sem virar porta aberta: é limite de UPLOAD de
     * relatório, não de API pública.
     */
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
