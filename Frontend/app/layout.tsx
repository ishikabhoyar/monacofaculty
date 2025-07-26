import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark" style={{
      colorScheme: "dark"
    }}>
      <head>
        <style>{`
          :root.dark {
            --background: #000000;
            --foreground: #ffffff;
            --card: #0a0a0a;
            --card-foreground: #ffffff;
            --popover: #0a0a0a;
            --popover-foreground: #ffffff;
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

          /* Force black backgrounds for specific elements */
          body {
            background-color: #000000 !important;
          }
          
          .bg-slate-50, .bg-slate-800, .bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-900 {
            background-color: #000000 !important;
          }
          
          /* Cards and sidebars - darker than background but still very dark */
          .bg-white, .dark\\:bg-slate-800, .card, [class*="Card"] {
            background-color: #0a0a0a !important;
          }
          
          /* Override any blue-specific colors */
          [class*="blue"], [class*="indigo"], [class*="sky"] {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.1) !important;
          }
        `}</style>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
