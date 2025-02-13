import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthContainer from "./components/auth-container";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liqwik",
  description: "Bill Factorizing App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="cupcake">
      <body
        className={`${inter.className} min-h-screen bg-base-100 text-base-content`}
      >
        <AuthContainer>{children}</AuthContainer>
      </body>
    </html>
  );
}
