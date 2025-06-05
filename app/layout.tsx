import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "../styles/global.css";

export const metadata: Metadata = {
  title: "Pennywise Investment Portfolio Recommendation",
  description: "Investment portfolio recommendation app with authentication",
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}