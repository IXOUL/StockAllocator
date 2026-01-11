import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Weekly Listing Allocation",
  description: "Compute weekly listing allocations across XHS, Taobao, and Youzan"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="topbar">
            <div className="brand">Weekly Allocation</div>
            <nav>
              <Link href="/">分配总览</Link>
              <Link href="/low-stock">低库存预警</Link>
              <Link href="/history">历史</Link>
            </nav>
          </header>
          <div className="page-wrap">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
