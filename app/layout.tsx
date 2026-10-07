import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SprintFlow",
  description:
    "A modern SaaS platform for managing software projects, teams, tasks, and sprints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}