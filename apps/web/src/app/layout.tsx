import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "resPOS — NextGen Restaurant POS",
    template: "%s | resPOS",
  },
  description:
    "The only restaurant POS that grows with your business. Offline-first, multi-tenant, AI-powered insights.",
  manifest: "/manifest.json",
  keywords: ["restaurant POS", "billing", "KOT", "KDS", "inventory", "analytics"],
  authors: [{ name: "resPOS Team" }],
  robots: "noindex",
};

export const viewport: Viewport = {
  themeColor: "#0A0D14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-background text-content-primary`}
      >
        {children}
      </body>
    </html>
  );
}
