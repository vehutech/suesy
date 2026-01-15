// app/layout.tsx

import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'SUESY - Students\' Used Items Exchange System',
  description: 'Exchange used items with fellow students seamlessly',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}