import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThirdwebProvider } from "thirdweb/react";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blockpass",
  description: "Safely buy tickets to your favorite events in our dApp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "flex flex-col min-h-screen")}>
        <ThirdwebProvider>
          <Header />
          <Toaster />
          <main className="flex-grow container mx-auto p-4">{children}</main>
          <Footer />
        </ThirdwebProvider>
      </body>
    </html>
  );
}
