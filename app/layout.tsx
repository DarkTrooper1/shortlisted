import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shortlisted - AI UCAS Personal Statement Reviewer",
  description:
    "Get expert AI feedback on your UCAS personal statement. Scored rigorously by an AI trained on 15 years of UK university admissions experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  );
}
