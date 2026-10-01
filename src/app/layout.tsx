import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/shell";

export const metadata: Metadata = {
  title: "DecorReach AI — Discover. Qualify. Reach.",
  description: "API-powered U.S. buyer discovery and outreach for home-decor sellers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
