/**
 * Identity normalisation for the shared book catalogue.
 *
 * Two people typing "The Power Broker" and "the power-broker " must land on the
 * same catalogue entry, so both the unique index and the search query are built
 * on this function. It is pure so the rule can be tested directly.
 *
 * Deliberately uses NFC, not NFKD: NFKD would decompose Bengali conjuncts and
 * other non-Latin scripts, and folding Latin accents is not worth corrupting
 * every other writing system. Trigram similarity already absorbs "café" vs
 * "cafe" at search time.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFC")
    .toLowerCase()
    // Keep letters, numbers AND combining marks from any script; punctuation
    // becomes a space. \p{M} is essential: Bengali vowel signs (া ী ে), the
    // hasant, and the equivalent marks in Devanagari, Arabic and Thai are
    // Marks, not Letters. Without it "তাওহীদ" is shredded into "ত ওহ দ".
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Titles ignore a leading article so "The Hobbit" and "Hobbit" collide. */
export function normalizeTitle(title: string): string {
  return normalizeText(title).replace(/^(the|a|an)\s+/u, "");
}

export function normalizeAuthor(author: string | null | undefined): string {
  return author ? normalizeText(author) : "";
}

/** The catalogue's identity key — what the unique index is built on. */
export function editionKey(title: string, author: string | null | undefined) {
  return { normalizedTitle: normalizeTitle(title), normalizedAuthor: normalizeAuthor(author) };
}

/** Trigram matching needs 3 characters; below that we prefix-match instead. */
export const TRIGRAM_MIN_LENGTH = 3;
