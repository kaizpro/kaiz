import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const inter = Geist({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = { title: { default: "KAIZ", template: "%s · KAIZ" }, description: "Kazakhstan's competitive AI community.", applicationName: "KAIZ", openGraph: { title: "KAIZ", description: "Kazakhstan's competitive AI community.", type: "website" }, icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body className={`${inter.variable} ${mono.variable} min-h-screen bg-background antialiased`}><ThemeProvider><SiteHeader/><main className="min-h-[calc(100vh-9rem)]">{children}</main><SiteFooter/></ThemeProvider></body></html>;
}
