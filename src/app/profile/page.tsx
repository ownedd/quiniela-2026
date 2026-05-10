"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Save, Loader2, User, Camera } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

const IMAGE_TYPES_BY_EXTENSION: Record<string, string> = {
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const CONVERTED_IMAGE_TYPE = "image/jpeg";
const CONVERTED_IMAGE_QUALITY = 0.9;
const SUPPORTED_IMAGE_TYPES = new Set(Object.keys(IMAGE_EXTENSION_BY_TYPE));
const HEIC_IMAGE_TYPES = new Set(["image/heic", "image/heif"]);
const HEIC_BRANDS = ["heic", "heix", "hevc", "hevx", "heif", "mif1", "msf1"];

function imageTypeFromExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension ? IMAGE_TYPES_BY_EXTENSION[extension] : undefined;
}

function fileNameForImageType(fileName: string, type: string) {
  const extension = IMAGE_EXTENSION_BY_TYPE[type];
  const name = fileName.trim();

  if (!extension) return name || "profile";
  if (imageTypeFromExtension(name) === type) return name;

  const nameWithoutExtension = name.replace(/\.[^/.]+$/, "");
  return `${nameWithoutExtension || "profile"}.${extension}`;
}

function isHeicType(type: string | undefined) {
  return !!type && HEIC_IMAGE_TYPES.has(type.toLowerCase());
}

async function imageTypeFromHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return undefined;
}

async function isHeicFromHeader(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());

  if (bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) {
    return false;
  }

  const header = String.fromCharCode(...bytes).toLowerCase();
  return HEIC_BRANDS.some((brand) => header.includes(brand));
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = document.createElement("img");

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

async function convertHeicToJpeg(file: File) {
  try {
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({
      blob: file,
      quality: CONVERTED_IMAGE_QUALITY,
      toType: CONVERTED_IMAGE_TYPE,
    });
    const blob = Array.isArray(converted) ? converted[0] : converted;

    if (!blob) return null;

    return new File([blob], fileNameForImageType(file.name, CONVERTED_IMAGE_TYPE), {
      lastModified: file.lastModified,
      type: CONVERTED_IMAGE_TYPE,
    });
  } catch {
    return null;
  }
}

async function convertImageToJpeg(file: File) {
  try {
    const image = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(image, 0, 0);

    const blob = await canvasToBlob(canvas, CONVERTED_IMAGE_TYPE, CONVERTED_IMAGE_QUALITY);
    if (!blob) return null;

    return new File([blob], fileNameForImageType(file.name, CONVERTED_IMAGE_TYPE), {
      lastModified: file.lastModified,
      type: CONVERTED_IMAGE_TYPE,
    });
  } catch {
    return null;
  }
}

async function normalizeImageFile(file: File) {
  const typeFromExtension = imageTypeFromExtension(file.name);

  if (isHeicType(file.type) || isHeicType(typeFromExtension) || await isHeicFromHeader(file)) {
    return convertHeicToJpeg(file);
  }

  const type = SUPPORTED_IMAGE_TYPES.has(file.type)
    ? file.type
    : typeFromExtension ?? await imageTypeFromHeader(file);

  if (!type) return convertImageToJpeg(file);

  return new File([await file.arrayBuffer()], fileNameForImageType(file.name, type), {
    lastModified: file.lastModified,
    type,
  });
}

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
    setUpdatingImage(true);

    try {
      const imageFile = await normalizeImageFile(file);

      if (!imageFile) {
        setImageMessage({ type: "error", text: "Selecciona una imagen valida." });
        return;
      }

      const imageResource = await user.setProfileImage({ file: imageFile });
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
            <Image
              src={user.imageUrl}
              alt="Foto de perfil"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-2 border-gold/30 bg-white/5"
              unoptimized
            />
            <label
              htmlFor="profile-image"
              aria-disabled={updatingImage}
              className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-gold text-black shadow-lg transition-colors ${
                updatingImage ? "cursor-wait opacity-80" : "cursor-pointer hover:bg-gold-light"
              }`}
            >
              {updatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </label>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-white">{user.fullName || user.username || user.primaryEmailAddress?.emailAddress}</p>
            <p className="text-sm text-gray-400">
              {updatingImage ? "Procesando imagen..." : "Haz clic en el icono para cambiar tu foto de perfil."}
            </p>
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
