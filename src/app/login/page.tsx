"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Trophy } from "lucide-react";

export default function Login() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userId = await getOrCreateUser({ name, email });
      // In a real app, we would set a cookie or JWT here.
      // For this demo, we'll just save to localStorage to simulate a session.
      localStorage.setItem("game_user_id", userId);
      localStorage.setItem("game_user_name", name);
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Error al iniciar sesión. ¿Ya configuraste Convex?");
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-500">
      <div className="glass-card p-10 w-full max-w-md border-t-4 border-t-blue-500">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-blue-500/20 p-4 rounded-full">
            <Trophy className="text-blue-400 w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-center">Únete a la Quiniela</h2>
          <p className="text-gray-400 text-center">Crea tu cuenta para empezar a predecir resultados del Mundial 2026</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Nombre Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Correo Electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-blue-500 outline-none transition-all"
              placeholder="ejemplo@correo.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            {isLoading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Ingresar</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Al ingresar, aceptas los términos y condiciones de la quiniela.
        </p>
      </div>
    </div>
  );
}
