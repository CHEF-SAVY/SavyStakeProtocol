import "@rainbow-me/rainbowkit/styles.css";
import type { Metadata } from "next";
import "./globals.css";
import ClientProviders from "../components/ClientProviders";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "SavyStake — Survey Corps Protocol",
  description: "Stake SVX. Earn Freedom.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientProviders>
          <Navbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
