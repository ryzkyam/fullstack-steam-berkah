
import "./globals.css";
import type { ReactNode } from "react";
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}