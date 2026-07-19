import type { Metadata } from "next";
import { Spectral, IBM_Plex_Mono } from "next/font/google";
// The design tokens live in docs/design/ (single source, no copy to drift);
// a relative import from outside src/ is valid for global CSS here.
import "../../docs/design/tokens.css";
import "./globals.css";

// Amendment to direction.md's sourcing note: next/font downloads at build
// time and self-hosts the output, so no runtime third-party requests and no
// committed font binaries. tokens.css bridges these scoped variables into
// --font-serif / --font-mono.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "learn-sociology",
  description:
    "An open, concept-node approach to learning sociology — course, hierarchy, network, and sociologists views over one shared content graph.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spectral.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
