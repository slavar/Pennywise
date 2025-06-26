import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "../styles/global.css";
import CustomHead from "./head";
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
      <html lang="en">
        <body>
          <CustomHead />
          {children}
          <footer className="pw-footer" style={{ textAlign: "center", color: "var(--color-secondary)", marginTop: "1rem", fontSize: "0.97rem", padding: "16px 0" }}>
            Questions or feedback? Reach us at <a href="mailto:info@pennywise.business">info@pennywise.business</a>
          </footer>
          <Analytics />
          <FloatingFeedback />
        </body>
      </html>
    </ClerkProvider>
  );
}
