import type { Metadata, Viewport } from "next";
import { Outfit, Nunito, Caveat } from "next/font/google";
import "./globals.css";
import RegisterSW from "./register-sw";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const handwritten = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2D5F3E",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://dailyforest.vercel.app"),
  title: {
    template: "%s | DailyForest",
    default: "DailyForest — Free Daily & Weekly Planner",
  },
  description:
    "Plan your day and week beautifully with DailyForest. A free, open-source planner featuring time blocking, shareable calendars, PWA offline support, and Ghibli-inspired aesthetic.",
  keywords: [
    "daily planner",
    "weekly planner",
    "task tracker",
    "time blocking",
    "shareable calendar",
    "free planner app",
    "offline planner",
    "PWA planner",
    "Ghibli planner",
  ],
  authors: [{ name: "DailyForest Team" }],
  creator: "DailyForest",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/icon-192.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://dailyforest.vercel.app",
    siteName: "DailyForest",
    title: "DailyForest — Free Daily & Weekly Planner",
    description:
      "Plan your day and week beautifully with DailyForest. Free, open-source daily & weekly planner with time blocking, shareable calendars, and offline support.",
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyForest — Free Daily & Weekly Planner",
    description:
      "Plan your day and week beautifully with DailyForest. Free, open-source daily & weekly planner.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DailyForest",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${nunito.variable} ${handwritten.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
