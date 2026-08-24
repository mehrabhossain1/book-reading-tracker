"use client";

import { useEffect, useId, useRef, useState } from "react";
import { RiBookmarkFill, RiCheckboxCircleFill, RiLoader4Line } from "react-icons/ri";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { EditionSuggestion } from "@/modules/catalogue/queries";

/** Wrap the typed run inside the title so the match is visible at a glance. */
function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;

  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, at)}
      <mark className="bg-primary/20 text-foreground rounded-[3px] px-0.5">
        {text.slice(at, at + term.length)}
      </mark>
      {text.slice(at + term.length)}
    </>
  );
}

export function TitleCombobox({
  value,
  onChange,
  onSelect,
  invalid,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (edition: EditionSuggestion) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const listId = useId();
  const inputId = "title";
  /**
   * Results are stored together with the query that produced them, so what is
   * shown can be *derived* rather than cleared in an effect. That kills two
   * problems at once: no synchronous setState cascade, and results from an
   * earlier query can never linger under a newer one.
   */
  const [result, setResult] = useState<{ query: string; items: EditionSuggestion[] }>({
    query: "",
    items: [],
  });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  /** Set on pick so choosing a suggestion doesn't immediately re-search it. */
  const skipNextSearch = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(value, 250);
  const term = debounced.trim();
  const searchable = term.length >= 2;

  // Both derived — no state, so they can never disagree with the input.
  const suggestions = searchable && result.query === term ? result.items : [];
  const loading = searchable && result.query !== term;

  useEffect(() => {
    if (!searchable) return;
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    // Abort in-flight requests so a slow early keystroke can't land after a
    // later one and overwrite it.
    const controller = new AbortController();

    fetch(`/api/catalogue/search?q=${encodeURIComponent(term)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { suggestions: [] }))
      .then((data: { suggestions: EditionSuggestion[] }) => {
        setResult({ query: term, items: data.suggestions ?? [] });
        setActive(-1);
        setOpen(true);
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setResult({ query: term, items: [] });
      });

    return () => controller.abort();
  }, [term, searchable]);

  // Close when focus or a click leaves the whole combobox.
  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pick = (edition: EditionSuggestion) => {
    skipNextSearch.current = true;
    onSelect(edition);
    setOpen(false);
    setActive(-1);
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={inputId}
          autoFocus
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid}
          disabled={disabled}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          onKeyDown={(event) => {
            if (!showList) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => (index + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
            } else if (event.key === "Enter" && active >= 0) {
              // Only swallow Enter when a suggestion is highlighted, so the
              // form can still be submitted normally.
              event.preventDefault();
              pick(suggestions[active]);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        {loading && (
          <RiLoader4Line
            className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
            aria-hidden
          />
        )}
      </div>

      {showList && (
        <div className="bg-popover border-border absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border shadow-lg">
          <p className="text-muted-foreground border-border/70 border-b px-3 py-2 text-[0.6875rem] tracking-wide uppercase">
            Already in the catalogue
          </p>

          <ul id={listId} role="listbox" aria-label="Book suggestions" className="max-h-72 overflow-y-auto py-1">
            {suggestions.map((edition, index) => (
              <li key={edition.id}>
                <button
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => pick(edition)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    index === active ? "bg-accent" : "bg-transparent",
                  )}
                >
                  <span className="bg-muted text-muted-foreground ring-border/70 flex h-11 w-8 shrink-0 items-center justify-center overflow-hidden rounded ring-1">
                    {edition.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote host
                      <img
                        src={edition.coverUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <RiBookmarkFill className="size-3.5" aria-hidden />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      <Highlight text={edition.title} query={value} />
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {edition.author ?? "Unknown author"} · {edition.totalPages} pages
                      {edition.usageCount > 1 && ` · ${edition.usageCount} readers`}
                    </span>
                  </span>

                  {edition.onShelf && (
                    <span className="text-success inline-flex shrink-0 items-center gap-1 text-[0.6875rem] font-medium">
                      <RiCheckboxCircleFill className="size-3.5" aria-hidden />
                      On your shelf
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground border-border/70 border-t px-3 py-2 text-[0.6875rem]">
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to
            navigate · <kbd className="font-sans">↵</kbd> to use · keep typing to add a
            new one
          </p>
        </div>
      )}
    </div>
  );
}
