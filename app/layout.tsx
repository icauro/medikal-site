import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SignupFlowManager from "./components/SignupFlowManager";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "./components/Toast";
import { AuthProvider } from "@/lib/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Medikal Portal - Healthcare Directory",
  description: "Plastic Surgery & Dermatology specialist directory with medical facilities and agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <SignupFlowManager>
            <ScrollToTop />
            <Navbar />
            <ToastContainer />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </SignupFlowManager>
        </AuthProvider>
      </body>
    </html>
  );
}
