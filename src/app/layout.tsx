import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// The design tokens live in docs/design/ (single source, no copy to drift);
// a relative import from outside src/ is valid for global CSS here.
import "../../docs/design/tokens.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
