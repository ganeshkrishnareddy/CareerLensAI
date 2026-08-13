import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { appUrl } from "@/lib/utils";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: "CareerLens AI — AI Skill-Gap Analysis & Placement Readiness",
    template: "%s · CareerLens AI"
  },
  description:
    "CareerLens AI is an AI-powered skill-gap analysis and placement readiness ecosystem. Assess → Analyze → Recommend → Track. Know your gap. Build your skill. Get placement-ready.",
  keywords: [
    "CareerLens AI",
    "AI career coach",
    "student skill gap analysis",
    "placement readiness",
    "AI placement preparation",
    "student career readiness",
    "skill gap analysis platform"
  ],
  openGraph: {
    title: "CareerLens AI — AI Skill-Gap Analysis & Placement Readiness",
    description: "Know your gap. Build your skill. Get placement-ready. The AI ecosystem that turns student data into targeted placement preparation.",
    type: "website",
    siteName: "CareerLens AI",
    images: [{ url: "/logo-mark.svg", width: 512, height: 512, alt: "CareerLens AI" }]
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/logo-mark.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable}`}>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
