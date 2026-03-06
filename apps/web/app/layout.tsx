import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "inneedit - One Stop Solution For Your Business Needs",
  description: "Professional fleet and rider management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
