import type { Metadata } from "next";
import { Archivo, Space_Grotesk } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caption lab | Ritvik Sharma",
  description: "A Supabase-backed caption list for Design for Generative AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <div className="blob-a absolute -top-32 -left-24 h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl" />
          <div className="blob-b absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-secondary/20 blur-3xl" />
          <div className="blob-c absolute bottom-0 left-1/4 h-[26rem] w-[26rem] rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative z-10 flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}
