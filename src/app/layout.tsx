import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyAIStation API",
  description: "OpenAI-compatible OpenCode Zen gateway with GitHub tools",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
