import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SolLens",
  description:
    "A modern expression engine and development toolkit for Solana developers.",
  keywords: [
    "Solana",
    "Rust",
    "Web3",
    "Compiler",
    "Expression Engine",
    "Developer Tools",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Add suppressHydrationWarning here to tell Next.js to ignore browser extension injections */}
      <body className={inter.variable} suppressHydrationWarning>
        <div className="background-grid" />
        <div className="background-glow glow-one" />
        <div className="background-glow glow-two" />

        {children}
      </body>
    </html>
  );
}