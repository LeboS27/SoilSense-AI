import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoilSense AI",
  description: "Dashboard for managing AI-powered soil testing devices for smallholder farmers in Zimbabwe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
