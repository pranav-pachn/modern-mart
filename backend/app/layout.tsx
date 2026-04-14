import type { ReactNode } from "react";

export const metadata = {
  title: "Supermart Backend",
  description: "Backend status and API entry point for Supermart.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}