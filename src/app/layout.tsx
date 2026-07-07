import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { SessionProvider } from "next-auth/react";
import { LangProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhidPOS - Multi-Tenant Retail POS System",
  description: "Professional POS system for wholesale and retail businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <LangProvider>
            {children}
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </LangProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
