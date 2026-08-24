import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

export const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
export const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

/**
 * One expressive face, used only for the emphasised word in marketing
 * headlines. A book product earns a serif; using it for body copy would not.
 */
export const instrumentSerif = Instrument_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});
