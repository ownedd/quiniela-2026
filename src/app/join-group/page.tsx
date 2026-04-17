"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

function getReadableErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo unir al grupo";
  }

  const uncaughtMarker = "Uncaught Error:";
  if (error.message.includes(uncaughtMarker)) {
    const afterMarker = error.message.split(uncaughtMarker)[1]?.trim() ?? "";
    const firstLine = afterMarker.split("\n")[0]?.trim();
    if (firstLine) {
      return firstLine;
    }
  }

  const firstLine = error.message.split("\n")[0]?.trim();
  return firstLine || "No se pudo unir al grupo";
}

export default function JoinGroupPage() {
  const router = useRouter();
  const joinByInviteCode = useMutation(api.groups.joinByInviteCode);
  const [inviteCode, setInviteCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await joinByInviteCode({ inviteCode });
      setMessage({ type: "success", text: "Grupo asignado correctamente. Redirigiendo..." });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getReadableErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <div className="glass-card-gold w-full p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-gold/10 p-4">
            <Users className="h-8 w-8 text-gold" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Unirte a un grupo</h1>
            <p className="mt-2 text-sm text-gray-400">
              Ingresa el código que te compartió el organizador para completar tu acceso.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              El grupo debe existir previamente en Convex y el código debe coincidir exactamente.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="inviteCode" className="mb-2 block text-xs font-display uppercase tracking-[0.18em] text-gold/70">
              Código del grupo
            </label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej: DEMO2026"
              autoComplete="off"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          {message ? (
            <p className={`text-sm ${message.type === "success" ? "text-green" : "text-red-400"}`}>{message.text}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving || inviteCode.trim().length === 0}
            className="btn-gold flex w-full items-center justify-center gap-2 px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Validando código" : "Unirme al grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}
