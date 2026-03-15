import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { OfflineBanner } from '@/components/OfflineBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuizAI — AI-Powered Quiz Generator",
  description: "Generate, take, and master any topic with AI-powered quizzes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" className={inter.variable}>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('quizai-theme');
              document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
            } catch(e) {}
          })();
        `}} />
      </head>
      <body style={{ fontFamily: 'var(--font-body, Inter, system-ui, sans-serif)' }}>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing-client-id"}>
          <ThemeProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: '9px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  border: '1px solid var(--border-mid)',
                  fontFamily: 'var(--font-body)',
                  boxShadow: 'var(--shadow-md)',
                },
                success: {
                  iconTheme: { primary: 'var(--success)', secondary: 'var(--bg-surface)' },
                },
                error: {
                  iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-surface)' },
                },
              }}
            />
            <OfflineBanner />
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>

    </html>
  );
}
