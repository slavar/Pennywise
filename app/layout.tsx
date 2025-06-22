import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "../styles/global.css";
import CustomHead from "./head";

export const metadata: Metadata = {
  title: "Pennywise: Your Investment Guide",
  description:
    "Pennywise helps you build personalized ETF, stock & bond portfolios by balancing your risk tolerance and investment horizon.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <CustomHead />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}