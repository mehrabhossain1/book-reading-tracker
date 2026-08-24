import { describe, expect, it } from "vitest";

import { editionKey, normalizeAuthor, normalizeText, normalizeTitle } from "../normalize";

describe("normalizeText", () => {
  it("folds case and collapses whitespace", () => {
    expect(normalizeText("  The   POWER  Broker ")).toBe("the power broker");
  });

  it("treats punctuation as a separator", () => {
    expect(normalizeText("Pride & Prejudice")).toBe("pride prejudice");
    expect(normalizeText("Gödel, Escher, Bach")).toBe("gödel escher bach");
    expect(normalizeText("The Power-Broker")).toBe("the power broker");
  });

  it("keeps non-Latin scripts intact", () => {
    // The regression that matters here: NFKD would decompose these.
    expect(normalizeText("তাওহীদ রেসালাত ও আখেরাত")).toBe("তাওহীদ রেসালাত ও আখেরাত");
    expect(normalizeText("পরার্থপরতার অর্থনীতি")).toBe("পরার্থপরতার অর্থনীতি");
    expect(normalizeText("  যথাশব্দ  ")).toBe("যথাশব্দ");
  });

  it("keeps digits", () => {
    expect(normalizeText("1984")).toBe("1984");
    expect(normalizeText("Catch-22")).toBe("catch 22");
  });

  it("survives empty and punctuation-only input", () => {
    expect(normalizeText("")).toBe("");
    expect(normalizeText("!!! ??")).toBe("");
  });
});

describe("normalizeTitle", () => {
  it("ignores a leading article so variants collide", () => {
    expect(normalizeTitle("The Hobbit")).toBe("hobbit");
    expect(normalizeTitle("Hobbit")).toBe("hobbit");
    expect(normalizeTitle("A Tale of Two Cities")).toBe("tale of two cities");
    expect(normalizeTitle("An Ember in the Ashes")).toBe("ember in the ashes");
  });

  it("only strips the article at the start", () => {
    expect(normalizeTitle("Portrait of the Artist")).toBe("portrait of the artist");
  });

  it("does not strip a word that merely begins with an article", () => {
    expect(normalizeTitle("Theory of Everything")).toBe("theory of everything");
    expect(normalizeTitle("Animal Farm")).toBe("animal farm");
  });
});

describe("normalizeAuthor", () => {
  it("normalises like text", () => {
    expect(normalizeAuthor("Robert A. Caro")).toBe("robert a caro");
  });

  it("treats a missing author as an empty key, never null", () => {
    // The unique index spans (title, author); NULL would defeat it, because in
    // Postgres NULL != NULL and duplicates would slip through.
    expect(normalizeAuthor(null)).toBe("");
    expect(normalizeAuthor(undefined)).toBe("");
    expect(normalizeAuthor("")).toBe("");
  });
});

describe("editionKey", () => {
  it("maps obvious variants of the same book to one key", () => {
    const a = editionKey("The Power Broker", "Robert A. Caro");
    const b = editionKey("  the power-broker ", "robert a. caro");
    expect(a).toEqual(b);
  });

  it("keeps different books apart", () => {
    expect(editionKey("Middlemarch", "George Eliot")).not.toEqual(
      editionKey("Middlemarch", "Someone Else"),
    );
  });
});
