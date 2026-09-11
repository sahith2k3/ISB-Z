import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "ISBusy — Who's free right now?",
  description: "Campus companion for ISB students to check live schedules and see who is free right now.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ISBusy",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a365d",
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
      <body className="min-h-[100dvh] bg-background antialiased selection:bg-primary/20 selection:text-primary">
        <Providers>
          <div className="min-h-[100dvh] max-w-md mx-auto bg-background shadow-xl shadow-black/5 relative overflow-hidden flex flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
