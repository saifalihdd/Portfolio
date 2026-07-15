import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: "Saif Ali — Full-Stack Developer & UI/UX Designer",
  description: "Portfolio of Saif Ali — Computer Science student, Full-Stack Developer and UI/UX Designer from Jakarta, Indonesia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} ${jetBrainsMono.variable} mode-dev`}>{children}</body>
    </html>
  );
}