import "./globals.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Footer, Navbar } from "@/components/layout";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "AirRx",
  description:
    "Predict and visualize cleaner, safer skies across North America.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "From Earthdata to Action",
    description: "See smoke, NO2, and fires with Past/Now/+1h time slices.",
    url: "/",
    siteName: "Earthdata → Action",
    // images: [{ url: "/og.png", width: 1200, height: 630, alt: "Earthdata → Action" }],
    type: "website",
  },
  themeColor: "#0B0F19",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
