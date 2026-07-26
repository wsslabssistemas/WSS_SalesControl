"use client";

import { useEffect } from "react";

// Registra o service worker (torna o app instalável e resiliente offline).
// Só em produção: em dev o SW atrapalha o hot-reload do Next.
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
