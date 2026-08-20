import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "MyAIStation — Duolingo-style AI Chat",
  description: "Chat with OpenCode Zen models, full GitHub tools, file uploads — built like Duolingo meets ChatGPT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="antialiased font-sans h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
