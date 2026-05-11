"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2 } from "lucide-react";

function getReadableErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo validar el código.";
  }

  const uncaughtMessage = error.message.match(/Uncaught Error:\s*([^\n]+)/)?.[1];
  if (uncaughtMessage) {
    return uncaughtMessage.replace(/\s+at\s+handler.*$/, "").trim();
  }

  return error.message || "No se pudo validar el código.";
}

export function JoinGroupGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const { isAuthenticated } = useConvexAuth();
  const convexUser = useQuery(api.users.getCurrentUser, isLoaded && user && isAuthenticated ? {} : "skip");

  if (!isLoaded) {
    return <GateLoadingState />;
  }

  if (!user) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <GateLoadingState />;
  }

  if (convexUser === undefined) {
    return <GateLoadingState message="Cargando tus datos..." />;
  }

  if (convexUser === null) {
    return <GateLoadingState message="Sincronizando tu cuenta..." />;
  }

  if (convexUser.groupId) {
    return <>{children}</>;
  }

  return <JoinGroupScreen />;
}

function GateLoadingState({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
      <Loader2 className="w-10 h-10 animate-spin text-gold" />
      {message ? <p className="text-sm text-gray-500">{message}</p> : null}
    </div>
  );
}

function JoinGroupScreen() {
  const joinByCode = useMutation(api.quinielaGroups.joinByInvitationCode);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setMessage(null);
  }, [code]);

  const trimmed = code.trim();
  const canSubmit = trimmed.length >= 3 && trimmed.length <= 32;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await joinByCode({ code: trimmed });
      setMessage({ type: "success", text: "Grupo asignado. Ya puedes continuar." });
    } catch (err) {
      setMessage({ type: "error", text: getReadableErrorMessage(err) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center animate-slide-up gap-4 px-4">
      <div className="glass-card-gold w-full max-w-sm p-5 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-wide">Ingresar a un grupo</h2>
        <p className="text-sm text-gray-400 mt-2 max-w-prose">
          Para usar la app necesitas un código de invitación válido. Pídeselo al organizador de tu grupo.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="invitationCode" className="block text-xs font-medium text-gold/60 mb-2 uppercase tracking-wider font-display">
              Código de invitación
            </label>
            <input
              id="invitationCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: MI-GRUPO-2026"
              autoComplete="off"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all uppercase"
            />
            <p className="mt-2 text-xs text-gray-500">Se acepta entre 3 y 32 caracteres.</p>
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green" : "text-red-400"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className={`btn-gold w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 text-sm cursor-pointer ${
              (!canSubmit || submitting) && "opacity-60 cursor-not-allowed"
            }`}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Unirme al grupo"}
          </button>
        </form>
      </div>
    </div>
  );
}

