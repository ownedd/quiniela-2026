"use client";

import { SignIn } from "@clerk/nextjs";
import { Trophy } from "lucide-react";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-in fade-in zoom-in duration-500 gap-8">
      <div className="flex flex-col items-center gap-4">
        <div className="bg-blue-500/20 p-4 rounded-full">
          <Trophy className="text-blue-400 w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-center">Únete a la Quiniela</h2>
        <p className="text-gray-400 text-center max-w-sm">
          Crea tu cuenta segura con Clerk para empezar a predecir resultados del Mundial 2026
        </p>
      </div>

      <div className="glass-card p-2 border-t-4 border-t-blue-500">
        <SignIn 
          routing="hash" 
          appearance={{
            elements: {
              card: "shadow-none bg-transparent",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white",
              formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-sm font-bold",
              footer: "hidden"
            }
          }}
        />
      </div>

      <p className="text-center text-xs text-gray-500">
        Al ingresar, aceptas los términos y condiciones de la quiniela.
      </p>
    </div>
  );
}

