"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Loader2, User, Camera } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser, isLoaded && user ? {} : "skip");
  const storeUser = useMutation(api.users.store);
  const updateDisplayName = useMutation(api.users.updateDisplayName);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [updatingImage, setUpdatingImage] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [imageMessage, setImageMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (convexUser) {
      setDisplayName(convexUser.displayName?.trim() || convexUser.name || "");
    }
  }, [convexUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMessage(null);
    setSaving(true);
    try {
      await updateDisplayName({ displayName });
      setNameMessage({ type: "success", text: "Nombre actualizado correctamente." });
    } catch (err) {
      setNameMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !user) {
      return;
    }

    setImageMessage(null);

    if (!file.type.startsWith("image/")) {
      setImageMessage({ type: "error", text: "Selecciona una imagen valida." });
      return;
    }

    setUpdatingImage(true);

    try {
      const imageResource = await user.setProfileImage({ file });
      await user.reload();
      await storeUser({
        name: user.fullName ?? user.username ?? undefined,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
        image: imageResource.publicUrl ?? user.imageUrl ?? undefined,
      });
      setImageMessage({ type: "success", text: "Foto de perfil actualizada." });
    } catch (err) {
      setImageMessage({
        type: "error",
        text: err instanceof Error ? err.message : "No se pudo actualizar la foto.",
      });
    } finally {
      setUpdatingImage(false);
    }
  };

  const trimmed = displayName.trim();
  const isValid = trimmed.length === 0 || (trimmed.length >= 2 && trimmed.length <= 30);
  const hasChanged = convexUser && (convexUser.displayName?.trim() || "") !== trimmed;

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-slide-up">
        <div className="glass-card p-8 sm:p-12 text-center">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2 font-display uppercase">Perfil</h2>
          <p className="text-gray-400 mb-6">Inicia sesión para editar tu nombre mostrado en la tabla.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-medium transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-slide-up">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-wide">Mi Perfil</h2>
        <p className="text-gray-400 font-medium">Personaliza el nombre que aparece en la tabla de posiciones</p>
      </div>

      <div className="glass-card-gold p-4 sm:p-6 md:p-8 max-w-md w-full space-y-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative">
            <img
              src={user.imageUrl}
              alt="Foto de perfil"
              className="w-24 h-24 rounded-full object-cover border-2 border-gold/30 bg-white/5"
            />
            <label
              htmlFor="profile-image"
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-black shadow-lg cursor-pointer hover:bg-gold-light transition-colors"
            >
              {updatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </label>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-white">{user.fullName || user.username || user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-sm text-gray-400">Haz clic en el icono para cambiar tu foto de perfil.</p>
          </div>

          <input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={updatingImage}
            className="sr-only"
          />

          {imageMessage && (
            <p
              className={`text-sm ${imageMessage.type === "success" ? "text-green" : "text-red-400"}`}
            >
              {imageMessage.text}
            </p>
          )}
        </div>

        {convexUser === undefined ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gold/60 mb-2 uppercase tracking-wider font-display">
                Nombre mostrado en la tabla
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={convexUser?.name || "Tu nombre"}
                maxLength={30}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
              />
              <p className="mt-1 text-xs text-gray-500">
                Entre 2 y 30 caracteres. Déjalo vacío para usar tu nombre de cuenta.
              </p>
              {!isValid && trimmed.length > 0 && (
                <p className="mt-1 text-xs text-amber-400">El nombre debe tener entre 2 y 30 caracteres.</p>
              )}
            </div>

            {nameMessage && (
              <p
                className={`text-sm ${nameMessage.type === "success" ? "text-green" : "text-red-400"}`}
              >
                {nameMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving || !isValid || !hasChanged}
              className="btn-gold w-full min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 text-sm cursor-pointer"
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
