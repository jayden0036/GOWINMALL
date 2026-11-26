"use client";

import { useState } from "react";
import { ghostButton } from "../dashboard/styles";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      window.prompt("Copiez ce texte :", text);
    }
  }
  return (
    <button type="button" onClick={copy} style={ghostButton}>
      {done ? "Copié" : label}
    </button>
  );
}
