import type { Metadata } from "next";
import { Suspense } from "react";
import { Epilogue, JetBrains_Mono, Inter, Lora, Noto_Sans_TC, Noto_Sans_HK, Noto_Serif_TC, Noto_Serif_HK } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: "variable",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: "variable",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], preload: false });
const notoSansTC = Noto_Sans_TC({ variable: "--font-noto-sans-tc", preload: false });
const notoSansHK = Noto_Sans_HK({ variable: "--font-noto-sans-hk", preload: false });
const notoSerifTC = Noto_Serif_TC({ variable: "--font-noto-serif-tc", preload: false });
const notoSerifHK = Noto_Serif_HK({ variable: "--font-noto-serif-hk", preload: false });

export const metadata: Metadata = {
  title: "RepoStudio — Turn one post into a Reel and two carousels",
  description:
    "Paste a link or a transcript. RepoStudio writes the angles in that post's language, then a script you can schedule to Buffer.",
  other: {
    "page-type": "software",
    "site-kind": "software",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="soft"
      className={`${epilogue.variable} ${jetbrains.variable} ${inter.variable} ${lora.variable} ${notoSansTC.variable} ${notoSansHK.variable} ${notoSerifTC.variable} ${notoSerifHK.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Suspense
          fallback={
            <header className="sticky top-0 z-40 h-16 border-b bg-background" />
          }
        >
          <AppNav />
        </Suspense>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
