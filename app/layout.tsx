import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arc Options — Decision-improvement journal for options traders",
  description:
    "Capture your thesis, score your process, and surface the behavioral patterns that cost you money.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
