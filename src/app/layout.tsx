import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/layout/AppProviders";

export const metadata: Metadata = {
  title: "OptumRx - Chart Checker",
  description: "GLP-1 audit accuracy, coaching compliance, and performance analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
