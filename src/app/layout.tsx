import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bawarchi Restaurant Diu | Best Pure Veg Restaurant Near Me | Diu",
  description: "Bawarchi Restaurant Diu – Best pure veg restaurant near Mahalaxmi Temple, Vijay Chowk, Diu. Indian, Chinese, Paneer, Tandoor, Thalis & more. Restaurant near me in Diu. Grand Party Hall for 900+ guests. Open 9 AM - 3 AM. Order online!",
  keywords: ["bawarchi restaurant diu", "restaurant in diu", "restaurant near me", "restaurant", "bawarchi diu", "pure veg restaurant diu", "vegetarian restaurant diu", "best veg restaurant diu", "best restaurant in diu", "veg restaurant near me", "indian restaurant diu", "veg food diu", "thali diu", "paneer diu", "party hall diu", "chinese restaurant diu", "tandoor diu", "food diu", "diu restaurant", "diu food", "family restaurant diu", "online food order diu", "veg thali diu", "restaurant near diu beach", "diu tourism food", "restaurant near mahalaxmi temple diu", "vijay chowk diu restaurant"],
  icons: {
    icon: "/favicon.ico",
  },
  metadataBase: new URL("https://bawarchirestaurantdiu.com"),
  openGraph: {
    title: "Bawarchi Restaurant Diu | Best Pure Veg Restaurant Near Me | Diu",
    description: "Bawarchi Restaurant Diu – Best pure veg restaurant in Diu. Indian, Chinese, Paneer, Tandoor, Thalis & more. Party Hall for 900+ guests. Restaurant near me in Diu. Order online!",
    url: "https://bawarchirestaurantdiu.com",
    siteName: "Bawarchi Restaurant Diu",
    images: [{ url: "/restaurant-bg.jpg", width: 1200, height: 630 }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bawarchi Restaurant Diu | Best Pure Veg Restaurant Near Me",
    description: "Best pure veg restaurant in Diu. Indian, Chinese, Paneer, Tandoor, Thalis & more. Restaurant near me in Diu. Order online!",
    images: ["/restaurant-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://bawarchirestaurantdiu.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
