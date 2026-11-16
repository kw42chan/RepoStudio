import type { Metadata } from "next";
import { Suspense } from "react";
import { Epilogue, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppNav } from "@/components/app-nav";

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

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
      className={`${epilogue.variable} ${jetbrains.variable} h-full antialiased`}
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
