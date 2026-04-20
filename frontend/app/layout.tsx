import type { Metadata } from "next";
import { Outfit, Bebas_Neue } from "next/font/google";
import { AppProvider } from "../context/AppContext";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

export const metadata: Metadata = {
  title: "FitMind AI — Nutrition & Workout Planner",
  description: "AI-powered personalized nutrition and workout planner using RAG and Groq Llama 3.3.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${bebasNeue.variable}`}>
      <body className={outfit.className}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
