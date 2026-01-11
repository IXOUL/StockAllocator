import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eazypezy stock allocator",
  description: "Compute weekly listing allocations across XHS, Taobao, and Youzan",
  icons: {
    icon: "/favicon.png"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="brand">
            <img src="/favicon.png" alt="logo" />
            <span>Eazypezy stock allocator</span>
          </div>
          <nav>
            <Link href="/">分配总览</Link>
            <Link href="/history">历史</Link>
          </nav>
        </header>
        <Providers>
          <div className="page-wrap">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
