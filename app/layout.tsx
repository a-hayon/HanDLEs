import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "HanDLEs — devine le joueur NBA",
  description: "Un jeu à la Wordle : trouve le joueur NBA mystère en 8 essais.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${archivo.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
