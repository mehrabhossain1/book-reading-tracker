import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { geistMono, geistSans, instrumentSerif } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Book Tracker",
    template: "%s \u00b7 Book Tracker",
  },
  description:
    "Track how far you are through every book you are reading at once, and always know the page to resume from.",
};

/**
 * `viewportFit: "cover"` is what makes env(safe-area-inset-*) non-zero on
 * iPhone. Without it the bottom tab bar's home-indicator padding silently
 * evaluates to 0 and the bar sits under the gesture area.
 *
 * Zoom is deliberately NOT disabled (no maximumScale/userScalable) — that
 * breaks pinch-to-zoom for low-vision users. Inputs are 16px on mobile
 * instead, which is what actually stops iOS auto-zooming on focus.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Tints the Safari toolbar / Android status bar. Computed from the --background
  // OKLCH tokens in globals.css, so the bar and the page are the same colour.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#110e0b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
