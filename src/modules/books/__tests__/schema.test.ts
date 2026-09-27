import { describe, expect, it } from "vitest";

import { createBookSchema } from "../schema";

const base = { title: "Middlemarch", totalPages: 900 };

/**
 * The URL fields are the only place reader input becomes an `href`, so the
 * protocol rule is pinned here rather than trusted to stay in place.
 */
describe("createBookSchema URL fields", () => {
  for (const field of ["coverUrl", "fileUrl"] as const) {
    describe(field, () => {
      it("is optional, and an empty field becomes null", () => {
        expect(createBookSchema.parse(base)[field]).toBeNull();
        expect(createBookSchema.parse({ ...base, [field]: "" })[field]).toBeNull();
        expect(createBookSchema.parse({ ...base, [field]: "   " })[field]).toBeNull();
      });

      it("accepts and trims an http(s) URL", () => {
        expect(
          createBookSchema.parse({ ...base, [field]: "  https://drive.example/f.pdf " })[field],
        ).toBe("https://drive.example/f.pdf");
        expect(createBookSchema.parse({ ...base, [field]: "http://x.test/a" })[field]).toBe(
          "http://x.test/a",
        );
      });

      it("refuses anything that is not http(s) — javascript: and data: above all", () => {
        for (const bad of [
          "javascript:alert(1)",
          "JavaScript:alert(1)",
          "data:text/html,<script>alert(1)</script>",
          "file:///etc/passwd",
          "drive.example/f.pdf",
        ]) {
          expect(createBookSchema.safeParse({ ...base, [field]: bad }).success).toBe(false);
        }
      });

      it("refuses a URL longer than the column allows", () => {
        const tooLong = `https://x.test/${"a".repeat(2048)}`;
        expect(createBookSchema.safeParse({ ...base, [field]: tooLong }).success).toBe(false);
      });
    });
  }
});
