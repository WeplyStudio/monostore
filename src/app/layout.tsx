import type { Metadata } from 'next';
import { AppProvider } from '@/context/app-context';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';
import SiteHeader from '@/components/site-header';
import SiteFooter from '@/components/site-footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'MonoStore',
  description: 'Premium digital assets for modern creators.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AppProvider>
            <div className="flex flex-col min-h-screen bg-background">
              <SiteHeader />
              <main className="flex-grow">
                {children}
              </main>
              <SiteFooter />
            </div>
            <Toaster />
          </AppProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
