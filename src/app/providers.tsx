"use client";

import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <DataProvider>{children}</DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
