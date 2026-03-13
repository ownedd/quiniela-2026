"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, BarChart3, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayoutContext } from "@/components/LayoutClient";

const baseTabs = [
  { href: "/#ranking", label: "Posiciones", icon: BarChart3 },
  { href: "/predictions", label: "Predicciones", icon: Trophy },
  { href: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAdmin } = useLayoutContext();

  const adminTab = { href: "/admin/results", label: "Admin", icon: ShieldCheck };
  const tabs = isAdmin ? [...baseTabs, adminTab] : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d0d1a]/95 backdrop-blur-xl border-t border-white/10" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/#ranking" ? pathname === "/" : pathname.startsWith(href.split("#")[0]);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-colors min-w-[64px]",
                isActive
                  ? "text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
