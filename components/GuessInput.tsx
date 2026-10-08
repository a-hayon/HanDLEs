"use client";

import { useId, useMemo, useState } from "react";
import { normalize } from "@/lib/format";
import type { PlayerOption } from "@/lib/types";

interface Props {
  options: PlayerOption[];
  excluded: Set<number>;
  disabled?: boolean;
  onPick: (playerId: number) => void;
}

export function GuessInput({ options, excluded, disabled, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputId = useId();
  const listId = useId();

  const suggestions = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return options.filter((o) => !excluded.has(o.id) && normalize(o.name).includes(q)).slice(0, 6);
  }, [query, options, excluded]);

  function pick(o: PlayerOption) {
    onPick(o.id);
    setQuery("");
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && suggestions[active]) {
      e.preventDefault();
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  const open = suggestions.length > 0;

  return (
    <div className="relative flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-[#2b2f38]">
        Choisis un joueur
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        placeholder="Tape un nom… ex. Wembanyama"
        value={query}
        disabled={disabled}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        className="min-h-[52px] w-full rounded-xl border-[1.5px] border-line bg-[#fafafb] px-4 text-[17px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20 disabled:opacity-60"
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full right-0 left-0 z-10 mt-1.5 overflow-hidden rounded-xl border border-line bg-white shadow-[0_12px_32px_rgba(20,23,28,0.14)]"
        >
          {suggestions.map((o, i) => (
            <li
              key={o.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 border-b border-[#eef0f3] px-4 last:border-b-0 ${
                i === active ? "bg-accent-soft" : ""
              }`}
            >
              <span className="text-base font-semibold">{o.name}</span>
              <span className="text-[13px] text-[#5a606c]">{o.teamName}</span>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length > 1 && !open && (
        <span className="text-[13px] text-[#5a606c]">Aucun joueur trouvé (ou déjà proposé).</span>
      )}
    </div>
  );
}
