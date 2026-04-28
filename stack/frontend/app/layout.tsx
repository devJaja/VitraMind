import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VitraMind — Personal Growth on Bitcoin",
  description: "Privacy-first habit tracking with verifiable on-chain proofs. Secured by Bitcoin via Stacks.",
  keywords: ["habit tracking", "personal growth", "Bitcoin", "Stacks", "privacy", "blockchain", "wellness"],
  authors: [{ name: "VitraMind" }],
  openGraph: {
    title: "VitraMind — Personal Growth on Bitcoin",
    description: "Track habits, moods & reflections. Only cryptographic proofs touch the blockchain.",
    type: "website",
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VitraMind" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f97316",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-black text-white min-h-screen`}>
        <Providers>
          <Header />
          <main className="max-w-lg mx-auto px-4 py-6">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
