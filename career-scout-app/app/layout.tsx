import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Scout — Your profile, your next role",
  description: "Build and review a source-backed profile, then prepare an application for a job you supply.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
