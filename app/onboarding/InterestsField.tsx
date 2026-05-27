"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  name: string;
  predefined: readonly string[];
  defaultSelected: string[];
};

// All chips behave the same once added: tap to toggle selection.
// Custom chips have an extra "×" to remove them entirely.
export function InterestsField({ name, predefined, defaultSelected }: Props) {
  const predefinedSet = new Set(predefined);
  const initialCustom = defaultSelected.filter((d) => !predefinedSet.has(d));

  const [custom, setCustom] = useState<string[]>(initialCustom);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSelected),
  );
  const [inputValue, setInputValue] = useState("");

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function addCustom(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (!tag) return;
    if (predefinedSet.has(tag) || custom.includes(tag)) {
      // Already in the list — just select it
      setSelected((prev) => new Set(prev).add(tag));
    } else {
      setCustom((prev) => [...prev, tag]);
      setSelected((prev) => new Set(prev).add(tag));
    }
    setInputValue("");
  }

  function removeCustom(tag: string) {
    setCustom((prev) => prev.filter((t) => t !== tag));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      // Always block — Enter inside a form otherwise submits it
      e.preventDefault();
      if (inputValue.trim()) addCustom(inputValue);
      return;
    }
    if (e.key === "Tab" && inputValue.trim()) {
      e.preventDefault();
      addCustom(inputValue);
      return;
    }
    if (e.key === "Backspace" && !inputValue && custom.length > 0) {
      // Pop the last custom chip
      const last = custom[custom.length - 1];
      removeCustom(last);
    }
  }

  const allTags = [...predefined, ...custom];

  return (
    <div>
      <div className="flex flex-wrap gap-2 items-center">
        {allTags.map((tag) => {
          const isSelected = selected.has(tag);
          const isCustom = !predefinedSet.has(tag);
          return (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full border text-sm capitalize transition ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(tag)}
                className="px-3 py-1.5 cursor-pointer"
              >
                {tag}
              </button>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => removeCustom(tag)}
                  aria-label={`Remove ${tag}`}
                  className={`pr-2.5 pl-0 leading-none cursor-pointer ${
                    isSelected ? "opacity-80 hover:opacity-100" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  ×
                </button>
              )}
            </span>
          );
        })}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add your own…"
          className="rounded-full border border-dashed border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] min-w-[160px]"
          aria-label="Add a custom interest. Press Enter or Tab to add."
        />
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Press Enter or Tab to add your own.
      </p>

      {/* Hidden inputs so the parent <form> submits the right values */}
      {[...selected].map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
    </div>
  );
}
