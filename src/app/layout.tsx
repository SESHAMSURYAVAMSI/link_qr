
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QR Studio | Free QR Code Generator",
  description:
    "Create, customize, preview, and download QR codes from website links and text for free.",
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
