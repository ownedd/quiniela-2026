"use client";

import { SignIn } from "@clerk/nextjs";
import { Trophy } from "lucide-react";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up gap-6 sm:gap-8 px-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <div className="bg-gold/15 p-5 rounded-full animate-pulse-glow">
          <Trophy className="text-gold w-10 h-10 drop-shadow-[0_0_8px_rgba(212,168,67,0.4)]" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center font-display uppercase tracking-wide">
          Únete a la Quiniela
        </h2>
        <p className="text-gray-400 text-center max-w-sm">
          Crea tu cuenta segura con Clerk para empezar a predecir resultados del Mundial 2026
        </p>
      </div>

      <div className="glass-card-gold p-2 sm:p-4 w-full max-w-sm">
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              card: "shadow-none bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
              formButtonPrimary: "bg-[#d4a843] hover:bg-[#c49a38] text-[#0a0a0a] text-sm font-bold",
              footer: "hidden",
            },
          }}
        />
      </div>

      <p className="text-center text-xs text-gray-500">
        Al ingresar, aceptas los términos y condiciones de la quiniela.
      </p>
    </div>
  );
}
