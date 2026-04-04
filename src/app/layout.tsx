import type { Metadata, Viewport } from "next";
import { Geist, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/app/features/theme/model/theme-context";
import { isTheme } from "@/app/features/theme/model/theme.types";
import { Toaster } from "@/app/shared/ui/sonner";
import "./globals.css";
import { cn } from "@/app/shared/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("gw-theme")?.value;
  const initialTheme = isTheme(themeCookie) ? themeCookie : "dark";

  return (
    <html lang="en" className={cn("font-sans", geist.variable, spaceGrotesk.variable, ibmPlexMono.variable)}>
      <body
        data-theme={initialTheme}
        className="bg-bg-primary text-text-primary h-dvh w-screen overflow-hidden transition-colors duration-300"
      >
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
