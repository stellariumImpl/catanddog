"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingCart, Package, BoxIcon, Menu } from "lucide-react";

export function TabBar() {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] || "home";

  const tabs = [
    { id: "home", label: "首页", icon: Home, href: "/home" },
    { id: "checkout", label: "开单", icon: ShoppingCart, href: "/checkout" },
    { id: "stock-in", label: "入库", icon: Package, href: "/stock-in" },
    { id: "inventory", label: "库存", icon: BoxIcon, href: "/inventory" },
    { id: "more", label: "更多", icon: Menu, href: "/more" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = segment === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <Icon className={`h-6 w-6 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-xs mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
