"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Loader2, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser, isLoaded && user ? {} : "skip");
  const updateDisplayName = useMutation(api.users.updateDisplayName);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (convexUser) {
      setDisplayName(convexUser.displayName?.trim() || convexUser.name || "");
    }
  }, [convexUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await updateDisplayName({ displayName });
      setMessage({ type: "success", text: "Nombre actualizado correctamente." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  const trimmed = displayName.trim();
  const isValid = trimmed.length === 0 || (trimmed.length >= 2 && trimmed.length <= 30);
  const hasChanged = convexUser && (convexUser.displayName?.trim() || "") !== trimmed;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
        <div className="glass-card p-8 sm:p-12 text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Perfil</h2>
          <p className="text-gray-400 mb-6">Inicia sesión para editar tu nombre mostrado en la tabla.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Mi Perfil</h2>
        <p className="text-gray-400 font-medium">Personaliza el nombre que aparece en la tabla de posiciones</p>
      </div>

      <div className="glass-card p-4 sm:p-6 md:p-8 max-w-md w-full">
        {convexUser === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-400 mb-2">
                Nombre mostrado en la tabla
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={convexUser?.name || "Tu nombre"}
                maxLength={30}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">
                Entre 2 y 30 caracteres. Déjalo vacío para usar tu nombre de cuenta.
              </p>
              {!isValid && trimmed.length > 0 && (
                <p className="mt-1 text-xs text-amber-400">El nombre debe tener entre 2 y 30 caracteres.</p>
              )}
            </div>

            {message && (
              <p
                className={`text-sm ${message.type === "success" ? "text-green-400" : "text-red-400"}`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !isValid || !hasChanged}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 disabled:hover:bg-blue-600"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
