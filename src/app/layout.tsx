import type { Metadata } from 'next';
import { Inter as FontSans, Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { DataProvider } from '@/app/context/data-context';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Score Markas B7',
  description: 'Scoreboard for Markas B7',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable,
          fontPoppins.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
            <DataProvider>
              {children}
              <Toaster />
            </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
