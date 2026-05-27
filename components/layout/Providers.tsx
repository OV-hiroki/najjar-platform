"use client";
import { SessionProvider }  from "next-auth/react";
import { ThemeProvider }    from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster }          from "react-hot-toast";
import { useState }         from "react";
import Toast                from "@/components/ui/Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={qc}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { direction: "rtl", fontFamily: "Cairo, sans-serif" },
              success: { style: { background:"#1e2640", color:"#fff", border:"1px solid rgba(232,25,124,.3)" } },
              error:   { style: { background:"#2a1020", color:"#fff", border:"1px solid rgba(232,25,124,.4)" } },
            }}
          />
          <Toast />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
