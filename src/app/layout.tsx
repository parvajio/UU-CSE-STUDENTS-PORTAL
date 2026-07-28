import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSE Students Portal",
  description: "Department of Computer Science & Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}