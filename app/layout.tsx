import type { Metadata } from "next";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
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
          <header style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", padding: "1rem" }}>
            <SignedOut>
              <SignInButton>Sign In</SignInButton>
              <SignUpButton>Sign Up</SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}