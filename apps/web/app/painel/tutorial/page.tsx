import Tutorial from "./Tutorial";

export const metadata = { title: "Tutorial" };

export default function TutorialPage() {
  return (
    <main style={{ maxWidth: 780 }}>
      <h1>Tutorial</h1>
      <p className="text-dim" style={{ marginTop: 4 }}>
        Guia para vender com o WSS Kairós — como usar cada tela e o porquê de cada
        resposta. Leia na ordem ou salte direto para o que precisa.
      </p>
      <Tutorial />
    </main>
  );
}
