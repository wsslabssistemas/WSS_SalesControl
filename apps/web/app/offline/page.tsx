import Image from "next/image";

export const metadata = { title: "Sem conexão" };

export default function Offline() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div>
        <Image
          src="/icons/icon-192.png"
          alt="WSS Kairós"
          width={72}
          height={72}
          style={{ borderRadius: 16 }}
        />
        <h1 style={{ marginTop: 20 }}>Você está sem conexão</h1>
        <p className="text-dim" style={{ maxWidth: 340 }}>
          Assim que a internet voltar, o WSS Kairós recarrega sozinho. Nenhum
          dado foi perdido.
        </p>
      </div>
    </main>
  );
}
