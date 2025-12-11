import "./globals.css";
import { Figtree, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const figtree = Figtree({ 
  subsets: ["latin"],
  variable: "--font-figtree",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "Monaco Faculty Portal",
  description: "Faculty portal for test management and assessment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} ${geistMono.variable} font-sans antialiased relative min-h-screen`}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "586378657128-smg8t52eqbji66c3eg967f70hsr54q5r.apps.googleusercontent.com"}>
          <ThemeProvider>
            {children}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-md">
              <div className="flex items-center justify-center h-7">
                <span className="text-xs text-muted-foreground flex items-center">
                  Copyright © 2025. Made with
                  ♡ by Ishika and Arnab.
                </span>
              </div>
            </footer>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}