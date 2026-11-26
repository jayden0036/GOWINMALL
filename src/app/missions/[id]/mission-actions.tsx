"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ghostButton, primaryButton } from "../../dashboard/styles";

type Fn = "apply_to_mission" | "assign_mission_worker" | "deliver_mission" | "validate_mission" | "cancel_mission";

function useRpc() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function run(fn: Fn, args: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setMessage("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.rpc(fn, args);
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    router.refresh();
  }
  return { loading, message, run };
}

function Message({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p role="status" style={{ marginTop: "12px", padding: "12px", background: "#fff4df", borderRadius: "8px", fontSize: "14px" }}>
      {text}
    </p>
  );
}

export function ApplyForm({ missionId }: { missionId: string }) {
  const { loading, message, run } = useRpc();
  const [text, setText] = useState("");
  return (
    <div>
      <label htmlFor="apply-message" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#26352d", marginBottom: "6px" }}>
        Votre message au client (facultatif)
      </label>
      <textarea
        id="apply-message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        rows={4}
        placeholder="Présentez-vous et expliquez pourquoi vous êtes la bonne personne."
        style={{ padding: "12px", border: "1px solid #d5ded9", borderRadius: "10px", fontSize: "15px", fontFamily: "inherit", width: "100%", resize: "vertical", marginBottom: "12px" }}
      />
      <button style={{ ...primaryButton, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run("apply_to_mission", { p_mission_id: missionId, p_message: text.trim() || null })}>
        Postuler à cette mission
      </button>
      <Message text={message} />
    </div>
  );
}

export function ChooseButton({ missionId, workerId, name }: { missionId: string; workerId: string; name: string }) {
  const { loading, message, run } = useRpc();
  return (
    <div>
      <button
        style={{ ...primaryButton, padding: "9px 14px", fontSize: "13px", opacity: loading ? 0.7 : 1 }}
        disabled={loading}
        onClick={() => run("assign_mission_worker", { p_mission_id: missionId, p_worker_id: workerId }, `Choisir ${name} pour cette mission ? Vous devrez ensuite payer la commande.`)}
      >
        Choisir
      </button>
      <Message text={message} />
    </div>
  );
}

export function StepButton({ missionId, fn, label, confirmText, ghost }: { missionId: string; fn: "deliver_mission" | "validate_mission" | "cancel_mission"; label: string; confirmText?: string; ghost?: boolean }) {
  const { loading, message, run } = useRpc();
  return (
    <div>
      <button style={{ ...(ghost ? ghostButton : primaryButton), opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={() => run(fn, { p_mission_id: missionId }, confirmText)}>
        {label}
      </button>
      <Message text={message} />
    </div>
  );
}
