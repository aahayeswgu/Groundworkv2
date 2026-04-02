import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#D4712A",
};

export const metadata: Metadata = {
  title: "Groundwork",
  description: "Field Sales CRM for Construction Staffing Teams",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Groundwork",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body data-theme="dark" className="bg-bg-primary text-text-primary h-dvh w-screen overflow-hidden transition-colors duration-300" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('gw-theme');if(t==='gray'||t==='dark')document.body.setAttribute('data-theme',t)}catch(e){}` }} />
        {children}
      </body>
    </html>
  );
}
