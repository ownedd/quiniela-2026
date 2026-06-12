"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  subtitle?: string;
  imageUrl?: string | null;
  group?: string;
};

type SearchableSelectProps = {
  label: string;
  placeholder: string;
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  autoFocusSearch?: boolean;
  onCreateNew?: (name: string) => Promise<string | null>;
  createNewLabel?: string;
};

export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  autoFocusSearch = true,
  onCreateNew,
  createNewLabel = "Agregar",
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      [option.label, option.subtitle, option.group]
        .filter(Boolean)
        .some((part) => part!.toLowerCase().includes(normalizedQuery))
    );
  }, [options, search]);

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, SearchableSelectOption[]>();

    for (const option of filteredOptions) {
      const groupName = option.group ?? "";
      const existing = groups.get(groupName) ?? [];
      existing.push(option);
      groups.set(groupName, existing);
    }

    return Array.from(groups.entries());
  }, [filteredOptions]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative space-y-2", isOpen && "z-[80]")}>
      <label className="block text-[11px] font-medium text-gold/60 uppercase tracking-[0.2em] font-display">
        {label}
      </label>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (isOpen) {
              setSearch("");
            }
            setIsOpen((current) => !current);
          }}
          className={cn(
            "w-full min-h-14 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition-all",
            "flex items-center justify-between gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.22)]",
            "hover:border-gold/20 hover:bg-white/[0.07]",
            isOpen && "border-gold/30 bg-white/[0.08] shadow-[0_12px_32px_rgba(212,168,67,0.12)]",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <div className="min-w-0">
            {selectedOption ? (
              <OptionLabel option={selectedOption} compact />
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-gold/70 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              onChange(null);
            }}
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={`Limpiar ${label}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {isOpen && !disabled && (
          <div className="relative z-[80] mt-3 w-full overflow-hidden rounded-2xl border border-gold/15 bg-[#0a101c] shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:absolute">
            <div className="border-b border-white/8 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <Search className="h-4 w-4 text-gold/60" />
                <input
                  autoFocus={autoFocusSearch}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-base text-white outline-none placeholder:text-gray-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="max-h-[min(20rem,48dvh)] overflow-y-auto p-2">
              {groupedOptions.length === 0 && !onCreateNew ? (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {emptyMessage}
                </div>
              ) : (
                groupedOptions.map(([groupName, groupOptions]) => (
                  <div key={groupName || "default"} className="mb-1 last:mb-0">
                    {groupName ? (
                      <div className="px-3 pb-2 pt-3 text-[10px] font-display uppercase tracking-[0.24em] text-gold/45">
                        {groupName}
                      </div>
                    ) : null}

                    {groupOptions.map((option) => {
                      const isSelected = option.value === value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSearch("");
                            onChange(option.value);
                            setIsOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                            isSelected
                              ? "bg-gold/15 text-gold"
                              : "text-gray-200 hover:bg-white/6 hover:text-white"
                          )}
                        >
                          <OptionLabel option={option} />
                          {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}

              {onCreateNew && search.trim() && (
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={async () => {
                    setIsCreating(true);
                    try {
                      const newId = await onCreateNew(search.trim());
                      if (newId) {
                        onChange(newId);
                        setSearch("");
                        setIsOpen(false);
                      }
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all mt-1",
                    "border border-dashed border-gold/25 text-gold hover:bg-gold/10",
                    isCreating && "opacity-60 cursor-wait"
                  )}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">
                    {createNewLabel} &ldquo;{search.trim()}&rdquo;
                  </span>
                </button>
              )}

              {groupedOptions.length === 0 && onCreateNew && !search.trim() && (
                <div className="px-3 py-6 text-center text-sm text-gray-500">
                  {emptyMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OptionLabel({
  option,
  compact = false,
}: {
  option: SearchableSelectOption;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/6">
        {option.imageUrl ? (
          <Image
            src={option.imageUrl}
            alt={option.label}
            width={36}
            height={36}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <span className="font-display text-sm font-bold text-gray-400">
            {option.label[0] ?? "?"}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className={cn("truncate font-medium", compact ? "text-sm text-white" : "text-sm")}>
          {option.label}
        </div>
        {option.subtitle ? (
          <div className="truncate text-xs text-gray-500">{option.subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}
