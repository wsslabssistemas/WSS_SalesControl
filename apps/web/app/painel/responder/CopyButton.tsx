"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        marginTop: 10,
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: copied ? "#1e8449" : "#111",
        color: "#fff",
        font: "inherit",
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {copied ? "Copiado ✓" : "Copiar resposta"}
    </button>
  );
}
