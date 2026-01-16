import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import SignupFlowManager from "./components/SignupFlowManager";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "./components/Toast";
import "../lib/firebase"; // Initialize Firebase at app startup
import { AuthProvider } from "@/lib/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedikaNexus - Healthcare Directory",
  description: "Plastic Surgery & Dermatology specialist directory with medical facilities and agencies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SignupFlowManager>
            <ScrollToTop />
            <Navbar />
            <ToastContainer />
            {children}
          </SignupFlowManager>
        </AuthProvider>
      </body>
    </html>
  );
}
