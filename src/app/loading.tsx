import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="space-y-5 animate-slide-up">
      <div className="glass-card-gold p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-gold" />
          <div>
            <p className="font-display text-sm font-bold uppercase tracking-wide text-white">Cargando...</p>
            <p className="mt-1 text-sm text-gray-500">Preparando la información de tu quiniela.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        {[0, 1, 2].map((item) => (
          <div key={item} className="glass-card h-28 animate-pulse bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
