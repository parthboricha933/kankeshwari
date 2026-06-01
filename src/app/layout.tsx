import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kankeshwar - The Indian Culture Restaurant | Diu",
  description:
    "Experience authentic Indian cuisine at Kankeshwar, The Indian Culture Restaurant in Diu. Order online from our diverse menu featuring Chinese, Paneer, Tandoor, Thalis and more.",
  keywords: [
    "Kankeshwar",
    "Indian Restaurant",
    "Diu",
    "Indian Culture",
    "Vegetarian Food",
    "Thali",
    "Tandoor",
    "Paneer",
  ],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
