import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./globals.css";
import ClientLayout from "./components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nova Invest",
  description: "Enterprise Data & Logistics Gateway",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use a dummy client ID for demo purposes if none is provided
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "dummy-client-id-for-demo-purposes.apps.googleusercontent.com";

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <GoogleOAuthProvider clientId={googleClientId}>
          <ClientLayout>
            {children}
          </ClientLayout>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
