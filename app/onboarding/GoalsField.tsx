"use client";

import { useState, type KeyboardEvent } from "react";

type Props = {
  name: string;
  predefined: readonly string[];
  defaultSelected: string[];
};

const MAX_GOALS = 3;

// Goals field with two constraints the InterestsField doesn't have:
//   1. At MOST 3 selected (clicking a fourth is blocked, with feedback)
//   2. At LEAST 1 selected (form-level required via a hidden sentinel input)
// Otherwise mirrors InterestsField: predefined chips + space to add custom.
//
// Server-side cap also exists in readProfileFromForm — defense in depth.
export function GoalsField({ name, predefined, defaultSelected }: Props) {
  const predefinedSet = new Set(predefined);
  // Cap whatever was previously saved at 3 so existing-user editing
  // doesn't get stuck above the new limit.
  const capped = defaultSelected.slice(0, MAX_GOALS);
  const initialCustom = capped.filter((d) => !predefinedSet.has(d));

  const [custom, setCustom] = useState<string[]>(initialCustom);
  const [selected, setSelected] = useState<Set<string>>(new Set(capped));
  const [inputValue, setInputValue] = useState("");

  const atMax = selected.size >= MAX_GOALS;

  function toggle(tag: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        if (next.size >= MAX_GOALS) return prev; // hard cap
        next.add(tag);
      }
      return next;
    });
  }

  function addCustom(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (predefinedSet.has(tag) || custom.includes(tag)) {
      setSelected((prev) => {
        if (prev.size >= MAX_GOALS && !prev.has(tag)) return prev;
        return new Set(prev).add(tag);
      });
    } else {
      if (selected.size >= MAX_GOALS) {
        setInputValue("");
        return;
      }
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
          const blocked = !isSelected && atMax;
          return (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full border text-sm transition ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : blocked
                    ? "border-[var(--border)] bg-[var(--card)] opacity-40"
                    : "border-[var(--border)] bg-[var(--card)]"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(tag)}
                disabled={blocked}
                aria-disabled={blocked}
                title={blocked ? `Pick at most ${MAX_GOALS}` : undefined}
                className={`px-3 py-1.5 ${
                  blocked ? "cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                {tag}
              </button>
              {isCustom && (
                <button
                  type="button"
                  onClick={() => removeCustom(tag)}
                  aria-label={`Remove ${tag}`}
                  className={`pr-2.5 pl-0 leading-none cursor-pointer ${
                    isSelected
                      ? "opacity-80 hover:opacity-100"
                      : "opacity-60 hover:opacity-100"
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
          placeholder={atMax ? `Limit ${MAX_GOALS} reached` : "Add your own…"}
          disabled={atMax}
          className="rounded-full border border-dashed border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-sm outline-none focus:border-[var(--accent)] min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Add a custom goal. Press Enter or Tab to add."
        />
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--muted-foreground)]">
          Press Enter or Tab to add your own.
        </p>
        <p
          className={`text-xs tabular-nums ${
            selected.size === 0
              ? "text-red-600"
              : "text-[var(--muted-foreground)]"
          }`}
        >
          {selected.size} / {MAX_GOALS} selected
          {selected.size === 0 && " — pick at least one"}
        </p>
      </div>

      {/* Hidden inputs so the parent <form> submits the selected goals */}
      {[...selected].map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}

      {/* HTML5-validation sentinel. When zero goals are selected this
          input is empty + required → form submission is blocked by the
          browser. Visually hidden but kept in the DOM so validation runs. */}
      <input
        type="text"
        required
        value={selected.size > 0 ? String(selected.size) : ""}
        onChange={() => {}}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      />
    </div>
  );
}
