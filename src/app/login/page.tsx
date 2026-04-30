"use client";

import { SignIn } from "@clerk/nextjs";
import { Trophy, Target, Users, Star } from "lucide-react";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-slide-up gap-8 sm:gap-10 px-4">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 w-full max-w-md text-center">
        <div className="bg-gold/15 p-6 rounded-full animate-pulse-glow">
          <Trophy className="text-gold w-12 h-12 drop-shadow-[0_0_12px_rgba(212,168,67,0.5)]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-display uppercase tracking-tight gradient-text">
          Quiniela 2026
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-sm leading-relaxed">
          Predice los resultados del Mundial, compite con tus amigos y demuestra quién sabe más de fútbol.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Target className="w-5 h-5 text-gold" />
          <span className="text-[11px] sm:text-xs text-gray-400 text-center">Predice partidos</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Users className="w-5 h-5 text-gold" />
          <span className="text-[11px] sm:text-xs text-gray-400 text-center">Compite en grupo</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <Star className="w-5 h-5 text-gold" />
          <span className="text-[11px] sm:text-xs text-gray-400 text-center">Gana puntos</span>
        </div>
      </div>

      {/* Sign In */}
      <div className="glass-card-gold p-2 sm:p-4 w-full max-w-sm">
        <SignIn
          routing="hash"
          fallbackRedirectUrl="/"
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
