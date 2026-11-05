import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REVIEWTAP - Google Review System",
  description:
    "Sistem QR Code dan NFC untuk memudahkan pelanggan memberikan Google Review.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
