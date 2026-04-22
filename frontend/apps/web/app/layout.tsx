import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Panchavati Mart — Fresh Groceries in Bodhan",
  description:
    "Order fresh produce, dairy, snacks, and daily essentials online. Fast delivery across Bodhan with AI-powered grocery lists.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 2500,
              style: {
                background: "#18181b",
                color: "#f4f4f5",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: "600",
                padding: "12px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              },
              success: {
                iconTheme: { primary: "#10b981", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
          <Navbar />
          <main className="flex-1">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
