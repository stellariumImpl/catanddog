"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { ShoppingCart, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { getTodayStats, products } = useData();
  const stats = getTodayStats();

  const lowStockProducts = products.filter(
    p => p.lowStockThreshold && p.stock <= p.lowStockThreshold
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">
            {user?.storeName || '宠物店门店系统'}
          </h1>
          <p className="text-blue-100 text-sm mt-1">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
        </div>

        {/* Today Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">
              {stats.todayOrders}
            </div>
            <div className="text-xs text-blue-100 mt-1">今日订单</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">
              ¥{stats.todaySales.toFixed(0)}
            </div>
            <div className="text-xs text-blue-100 mt-1">今日销售额</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">
              {stats.lowStockCount}
            </div>
            <div className="text-xs text-blue-100 mt-1">低库存商品</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-3">快捷操作</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => router.push("/checkout")}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <ShoppingCart className="h-8 w-8" />
              <span>扫码开单</span>
            </Button>
            <Button
              onClick={() => router.push("/stock-in")}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Package className="h-8 w-8" />
              <span>快速入库</span>
            </Button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                库存预警
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/inventory")}
              >
                查看全部
              </Button>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{product.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      当前库存: {product.stock} 件
                    </div>
                  </div>
                  <div className="text-orange-600 font-semibold text-sm">
                    低库存
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Package className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              还没有商品
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              从添加商品开始，管理您的门店库存
            </p>
            <Button onClick={() => router.push("/inventory")}>
              添加商品
            </Button>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900">使用提示</div>
              <div className="text-sm text-blue-700 mt-1">
                点击"扫码开单"可使用相机或扫码枪快速添加商品，提升开单效率
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
