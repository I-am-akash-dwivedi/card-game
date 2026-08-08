import "./globals.css";
import { Bricolage_Grotesque, Inter } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata = {
  title: "Teen Do Paanch — 3-2-5 card game",
  description:
    "The trick-taking card game 3-2-5 (and its two-player variant 7-8), playable online with friends.",
};

export const viewport = {
  themeColor: "#0E1A2B",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body bg-ink text-chalk antialiased">{children}</body>
    </html>
  );
}
