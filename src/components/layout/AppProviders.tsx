"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuthStore } from "@/store/authStore";
import { useDataStore } from "@/store/dataStore";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { Shell } from "./Shell";

function Bootstrap({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  const fetchAll = useDataStore((s) => s.fetchAll);

  useEffect(() => {
    const unsubscribe = init();
    fetchAll();
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeSync();

  return <Shell>{children}</Shell>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Bootstrap>{children}</Bootstrap>
    </ThemeProvider>
  );
}
