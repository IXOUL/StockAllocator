import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
        <Providers>
          <div className="page-wrap">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
