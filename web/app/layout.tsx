import type { Metadata, Viewport } from "next";
import { Fredoka, Figtree } from "next/font/google";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import NotificationGate from "@/components/NotificationGate";
import WhatsAppFloatButton from "@/components/ui/WhatsAppFloatButton";
import { ToastProvider } from "@/components/ui/Toast";

const display = Fredoka({
  variable: "--font-display-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const body = Figtree({
  variable: "--font-body-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Repeat Calories — Rep. Eat. Repeat.",
  description: "Healthy cloud-kitchen meals delivered in Coimbatore.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repeat Calories",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5EFE7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-body">
        <ToastProvider>
          <SessionProviderWrapper>
            <NotificationGate>
              {children}
              <WhatsAppFloatButton />
            </NotificationGate>
          </SessionProviderWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
