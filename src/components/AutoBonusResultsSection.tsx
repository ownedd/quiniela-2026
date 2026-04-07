import type { AutoBonusDisplay } from "@/lib/autoBonusLines";
import { cn } from "@/lib/utils";

function AutoBonusResultCard({
  title,
  lines,
  footer,
}: {
  title: string;
  lines: string[];
  footer?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-[11px] font-display uppercase tracking-[0.2em] text-gold/60">{title}</div>
      {lines.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Aun sin resultado definido</p>
      ) : (
        <ul className="mt-2 list-none space-y-1">
          {lines.map((line, idx) => (
            <li key={`${title}-${idx}-${line}`} className="text-sm font-semibold text-white">
              {line}
            </li>
          ))}
        </ul>
      )}
      {footer ? <div className="mt-2 text-xs text-gray-500">{footer}</div> : null}
    </div>
  );
}

export function AutoBonusResultsSection({
  display,
  variant = "admin",
  subtitle,
}: {
  display: AutoBonusDisplay;
  variant?: "admin" | "home";
  subtitle?: string;
}) {
  const isGold = variant === "admin";

  return (
    <div
      className={cn(
        "p-4 sm:p-5",
        isGold ? "glass-card-gold" : "glass-card border border-white/8"
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-bold font-display uppercase tracking-wide">Predicciones especiales automaticas</h3>
          <p className="mt-1 text-sm text-gray-400">
            {subtitle ??
              "Se calculan automaticamente con los partidos finalizados y los goleadores registrados en cada resultado."}
          </p>
        </div>
        {isGold ? (
          <div className="text-xs text-gold/80 font-display uppercase tracking-[0.2em] shrink-0">Ranking en vivo</div>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <AutoBonusResultCard
          title="Mejor goleador"
          lines={display.topScorerLines}
          footer={display.topScorerFooter}
        />
        <AutoBonusResultCard
          title="Equipo con mas goles"
          lines={display.mostGoalsLines}
          footer={display.mostGoalsFooter}
        />
        <AutoBonusResultCard
          title="Equipo con menos goles recibidos"
          lines={display.leastConcededLines}
          footer={display.leastConcededFooter}
        />
      </div>
    </div>
  );
}
