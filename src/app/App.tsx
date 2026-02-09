"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Checkout } from './pages/Checkout';
import { StockIn } from './pages/StockIn';
import { Inventory } from './pages/Inventory';
import { More } from './pages/More';
import { TabBar } from './components/TabBar';
import { Toaster } from './components/ui/sonner';

function AuthScreen() {
  const [showLogin, setShowLogin] = useState(true);

  return showLogin ? (
    <Login onSwitchToRegister={() => setShowLogin(false)} />
  ) : (
    <Register onSwitchToLogin={() => setShowLogin(true)} />
  );
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const activeTab = useMemo(() => {
    const segment = pathname.split("/")[1] || "home";
    if (["home", "checkout", "stock-in", "inventory", "more"].includes(segment)) {
      return segment;
    }
    return "home";
  }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (pathname === "/") {
      router.replace("/home");
    }
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    router.prefetch("/home");
    router.prefetch("/checkout");
    router.prefetch("/stock-in");
    router.prefetch("/inventory");
    router.prefetch("/more");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {activeTab === "home" && <Home />}
        {activeTab === "checkout" && <Checkout />}
        {activeTab === "stock-in" && <StockIn />}
        {activeTab === "inventory" && <Inventory />}
        {activeTab === "more" && <More />}
      </div>

      {/* Tab Bar */}
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <>
      <MainApp />
      <Toaster position="top-center" />
    </>
  );
}
