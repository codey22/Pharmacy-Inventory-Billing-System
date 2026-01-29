import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/Navbar";
import { checkAuthorization } from "@/lib/auth-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pharmacy Inventory & Billing",
  description: "Efficient inventory and billing management for small pharmacies",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  let isAuthorized = true;
  let warning = null;

  if (userId) {
    const authResult = await checkAuthorization();
    isAuthorized = authResult.authorized;
    // @ts-ignore
    warning = authResult.warning;
  }

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <Navbar />
          {warning === 'NO_WHITELIST_CONFIGURED' && (
             <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '10px', textAlign: 'center', borderBottom: '1px solid #ffeeba' }}>
               <strong>Security Warning:</strong> Access is currently open to everyone. 
               Please set the <code>ALLOWED_EMAILS</code> environment variable in your Vercel project settings to restrict access.
             </div>
          )}
          <main className="main-content">
            {isAuthorized ? children : (
              <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
                <h1 style={{ color: '#e11d48' }}>Access Denied</h1>
                <p>You are not authorized to access this application.</p>
                <p>Please contact the administrator to request access.</p>
              </div>
            )}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}


