import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "../styles/global.css";
import Footer from "./Footer";
import FloatingFeedback from "./FloatingFeedback";

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
      {/* The suppressHydrationWarning prop is added to the html tag to prevent a warning from Next.js about a mismatch between the server and client rendered content. */}
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
          <Footer />
          <Analytics />
          <FloatingFeedback />
        </body>
      </html>
    </ClerkProvider>
  );
}
