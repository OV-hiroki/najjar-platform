"use client";
import { useRouter }     from "next/navigation";
import CountdownBar      from "./CountdownBar";
import Navbar            from "./Navbar";
import Footer            from "./Footer";
import { useStore }      from "@/store/useStore";

interface Props {
  children:   React.ReactNode;
  showBack?:  boolean;
  backHref?:  string;
}

export default function PlatformLayout({ children, showBack, backHref = "/platform/dashboard" }: Props) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      <CountdownBar />
      <Navbar />

      {/* Back button — floating gold */}
      {showBack && (
        <button
          onClick={() => router.push(backHref)}
          className="fixed left-4 top-1/2 -translate-y-1/2 z-40
                     w-10 h-10 rounded-xl bg-gold text-gray-900 font-bold text-lg
                     shadow-lg shadow-gold/30 hover:scale-105 transition-transform flex items-center justify-center"
        >
          ←
        </button>
      )}

      {/* Main content */}
      <main className="flex-1">{children}</main>

      <Footer />

      {/* Chat FAB */}
      <button
        className="fixed left-4 bottom-5 z-40
                   w-12 h-12 rounded-full bg-primary text-white text-xl
                   shadow-lg shadow-primary/35 hover:scale-105 transition-transform flex items-center justify-center"
        title="الدعم الفني"
      >
        <i className="ti ti-message-circle" />
      </button>
    </div>
  );
}
