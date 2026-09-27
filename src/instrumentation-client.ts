/**
 * Runs before the app hydrates, on every page.
 *
 * Down-levelling (see `browserslist` in package.json) rewrites *syntax* the
 * target browser can't parse, but it cannot conjure up missing *methods*. This
 * file fills in the ones our dependencies call that the oldest browser we
 * support does not have.
 *
 * Keep it to what the build actually contains: `pnpm check:legacy-safari`
 * scans the built chunks and names anything new that creeps in.
 */

// Array.prototype.toSorted — Safari 16.4, and an iPhone 7 Plus stops at 15.8.
// Radix's collection (every dropdown, select and tab list in the app) sorts
// with it, so without this every menu throws the moment it opens.
if (typeof Array.prototype.toSorted !== "function") {
  Object.defineProperty(Array.prototype, "toSorted", {
    value: function toSorted<T>(this: T[], compare?: (a: T, b: T) => number): T[] {
      return Array.prototype.slice.call(this).sort(compare);
    },
    writable: true,
    configurable: true,
  });
}
