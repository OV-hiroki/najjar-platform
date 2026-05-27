import type { Metadata } from "next";
import "./compiled.css";
import { Providers } from "@/components/layout/Providers";

export const metadata: Metadata = {
  title:       "محمود النجار — منصة التعليم الإلكتروني",
  description: "منصة الأستاذ محمود النجار للتعليم الإلكتروني — فيزياء للثانوية العامة",
  icons:       { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
