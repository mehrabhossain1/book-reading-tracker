"use client";

import { useEffect, useId, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { RiBookmarkFill, RiCheckboxCircleFill, RiLoader4Line } from "react-icons/ri";

import { Input } from "@/components/ui/input";
import { fetchJson } from "@/lib/api-client";
import { queryKeys } from "@/lib/query/keys";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { libraryQuery } from "@/modules/books/query-options";
import { normalizeTitle } from "@/modules/catalogue/normalize";
import type { CatalogueMatch, EditionSuggestion } from "@/modules/catalogue/types";

/** Wrap the typed run inside the title so the match is visible at a glance. */
function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  const at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
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
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const debounced = useDebouncedValue(value, 250);
  // Keyed on the *normalised* term, so "The Power" and "the power " share one
  // cache entry — retyping or backspacing to an earlier query is instant.
  const term = normalizeTitle(debounced);
  const searchable = debounced.trim().length >= 2 && term.length > 0;

  // TanStack Query replaces the hand-rolled fetch/abort/race logic: it passes
  // an AbortSignal (a superseded query is cancelled), dedupes identical
  // in-flight requests, and caches every term for the session.
  const search = useQuery<CatalogueMatch[]>({
    queryKey: queryKeys.catalogue(term),
    queryFn: ({ signal }) =>
      fetchJson<{ suggestions: CatalogueMatch[] }>(
        `/api/catalogue/search?q=${encodeURIComponent(debounced.trim())}`,
        signal,
      ).then((data) => data.suggestions),
    enabled: searchable,
    staleTime: 5 * 60_000,
    // While the next term loads, keep showing the last results rather than
    // collapsing the list and re-opening it on every pause.
    placeholderData: keepPreviousData,
  });

  // "On your shelf" is answered from the reader's shelf, which the client
  // already holds — that's what lets the server cache search for everyone.
  const shelf = useQuery(libraryQuery());
  const onShelf = new Set(shelf.data?.books.map((book) => book.editionId).filter(Boolean));

  const suggestions: EditionSuggestion[] = searchable
    ? (search.data ?? []).map((match) => ({ ...match, onShelf: onShelf.has(match.id) }))
    : [];
  const loading = searchable && search.isFetching;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pick = (edition: EditionSuggestion) => {
    onSelect(edition);
    setOpen(false);
    setActive(-1);
  };

  const showList = open && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id="title"
          autoFocus
          autoComplete="off"
          // iOS: keep the keyboard's autocorrect from rewriting book titles.
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
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
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!showList) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => (index + 1) % suggestions.length);
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
            } else if (event.key === "Enter" && active >= 0) {
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

          <ul
            id={listId}
            role="listbox"
            aria-label="Book suggestions"
            // overscroll-contain: on iOS, scrolling to the end of this list must
            // not start scrolling the page underneath it.
            className="max-h-72 overflow-y-auto overscroll-contain py-1"
          >
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
                    "flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    index === active ? "bg-accent" : "bg-transparent",
                  )}
                >
                  <span className="bg-muted text-muted-foreground ring-border/70 flex h-11 w-8 shrink-0 items-center justify-center overflow-hidden rounded ring-1">
                    {edition.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- arbitrary remote host
                      <img src={edition.coverUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
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
            <kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> to navigate ·{" "}
            <kbd className="font-sans">↵</kbd> to use · keep typing to add a new one
          </p>
        </div>
      )}
    </div>
  );
}
