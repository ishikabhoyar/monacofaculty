import "./globals.css";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

const inter = Inter({ subsets: ["latin"] });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400"]
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
      <head>
        <style>{`
          :root {
            /* Light theme variables */
            --background: #ffffff;
            --foreground: #0a0a0a;
            --card: #ffffff;
            --card-foreground: #0a0a0a;
            --popover: #ffffff;
            --popover-foreground: #0a0a0a;
            --primary: #0f172a;
            --primary-foreground: #f8fafc;
            --secondary: #f1f5f9;
            --secondary-foreground: #0f172a;
            --muted: #f1f5f9;
            --muted-foreground: #64748b;
            --accent: #f1f5f9;
            --accent-foreground: #0f172a;
            --destructive: #dc2626;
            --destructive-foreground: #ffffff;
            --border: #e2e8f0;
            --input: #e2e8f0;
            --ring: #94a3b8;
          }

          .dark {
            /* Dark theme variables */
            --background: #000000;
            --foreground: #ffffff;
            --card: #1a1a1a;
            --card-foreground: #e5e5e5;
            --popover: #1a1a1a;
            --popover-foreground: #e5e5e5;
            --primary: #262626;
            --primary-foreground: #ffffff;
            --secondary: #1a1a1a;
            --secondary-foreground: #ffffff;
            --muted: #1a1a1a;
            --muted-foreground: #a1a1a1;
            --accent: #1a1a1a;
            --accent-foreground: #ffffff;
            --destructive: #991b1b;
            --destructive-foreground: #ffffff;
            --border: rgba(255, 255, 255, 0.1);
            --input: rgba(255, 255, 255, 0.1);
            --ring: #525252;
          }

          /* Global styles */
          * {
            border-color: hsl(var(--border));
          }

          body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
          }

          /* Light theme specific overrides */
          :root .bg-slate-50, :root .bg-slate-100 {
            background-color: #f8fafc !important;
          }
          
          :root .bg-white {
            background-color: #ffffff !important;
          }

          /* Dark theme specific overrides */
          .dark body {
            background-color: #000000 !important;
          }
          
          .dark .bg-slate-50, .dark .bg-slate-800, .dark .bg-slate-900, 
          .dark .dark\\:bg-slate-800, .dark .dark\\:bg-slate-900 {
            background-color: #000000 !important;
          }
          
          .dark .bg-white, .dark .dark\\:bg-slate-800, .dark .card, .dark [class*="Card"] {
            background-color: #1a1a1a !important;
          }
          
          .dark [class*="blue"], .dark [class*="indigo"], .dark [class*="sky"] {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
        `}</style>
      </head>
      {/* Hello world */}
      <body className={`${inter.className} ${ibmPlexMono.variable} relative min-h-screen`}>
        <GoogleOAuthProvider clientId="586378657128-smg8t52eqbji66c3eg967f70hsr54q5r.apps.googleusercontent.com">
          <ThemeProvider>
            {children}
            <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200/40 dark:border-gray-800/20 bg-white/80 backdrop-blur-md dark:bg-[#070c1f]/80">
              <div className="flex items-center justify-center h-7">
                <span className="text-xs text-slate-500 dark:text-gray-500 flex items-center">
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