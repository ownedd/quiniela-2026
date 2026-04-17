"use client";

import { SignInButton } from "@clerk/nextjs";
import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";

export default function Login() {
  return (
    <div className="animate-slide-up flex min-h-[80vh] flex-col items-center justify-center gap-6 px-4 sm:gap-8">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
        <div className="animate-pulse-glow rounded-full bg-gold/15 p-5">
          <Trophy className="h-10 w-10 text-gold drop-shadow-[0_0_8px_rgba(212,168,67,0.4)]" />
        </div>
        <h2 className="text-center font-display text-2xl font-bold uppercase tracking-wide sm:text-3xl">
          Unete a la Quiniela
        </h2>
        <p className="max-w-sm text-center text-sm text-gray-400">
          Inicia sesion para empezar a predecir resultados del Mundial 2026.
        </p>
      </div>

      <div className="flex w-full max-w-[420px] flex-col items-center gap-4">
        <SignInButton mode="modal">
          <button
            type="button"
            className="btn-gold inline-flex w-full max-w-xs items-center justify-center gap-2 px-6 py-3 text-sm"
          >
            Iniciar sesion
            <ArrowRight className="h-4 w-4" />
          </button>
        </SignInButton>

        <p className="max-w-sm text-center text-xs text-gray-500">
          Se abrira una ventana segura para ingresar con tu cuenta.
        </p>
      </div>

      <p className="max-w-[380px] text-center text-xs text-gray-600">
        Al ingresar, aceptas los terminos y condiciones de la quiniela.
      </p>

      <Link href="/" className="text-sm text-gold transition-colors hover:text-gold-light">
        Volver a home
      </Link>
    </div>
  );
}
