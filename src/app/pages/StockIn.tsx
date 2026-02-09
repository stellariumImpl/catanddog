"use client";

import React, { useState } from "react";
import { useData, StockInItem } from "../contexts/DataContext";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Camera, Plus, Minus, Trash2, Search, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function StockIn() {
  const {
    products,
    getProductByBarcode,
    getProductById,
    createStockIn,
    confirmStockIn,
    suppliers,
    addSupplier,
  } = useData();
  const [items, setItems] = useState<Map<string, StockInItem>>(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [note, setNote] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastStockInCount, setLastStockInCount] = useState(0);

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      addItem(product.id);
      toast.success(`已添加：${product.name}`);
    } else {
      toast.error("未找到该商品，请先添加商品信息");
    }
  };

  const addItem = (productId: string, cost?: number) => {
    const newItems = new Map(items);
    const existing = newItems.get(productId);

    if (existing) {
      newItems.set(productId, {
        ...existing,
        quantity: existing.quantity + 1,
      });
    } else {
      newItems.set(productId, {
        productId,
        quantity: 1,
        cost,
      });
    }

    setItems(newItems);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newItems = new Map(items);
    const existing = newItems.get(productId);
    if (!existing) return;

    const newQuantity = existing.quantity + delta;

    if (newQuantity <= 0) {
      newItems.delete(productId);
    } else {
      newItems.set(productId, {
        ...existing,
        quantity: newQuantity,
      });
    }

    setItems(newItems);
  };

  const updateCost = (productId: string, cost: string) => {
    const newItems = new Map(items);
    const existing = newItems.get(productId);
    if (!existing) return;

    const costValue = parseFloat(cost);
    newItems.set(productId, {
      ...existing,
      cost: isNaN(costValue) ? undefined : costValue,
    });

    setItems(newItems);
  };

  const removeItem = (productId: string) => {
    const newItems = new Map(items);
    newItems.delete(productId);
    setItems(newItems);
  };

  const handleConfirm = () => {
    if (items.size === 0) {
      toast.error("请添加入库商品");
      return;
    }

    const itemsArray = Array.from(items.values());
    const trimmedSupplier = supplierName.trim();
    const supplierId = trimmedSupplier
      ? suppliers.find((supplier) => supplier.name === trimmedSupplier)?.id ||
        addSupplier({ name: trimmedSupplier }).id
      : undefined;

    const count = itemsArray.reduce((sum, item) => sum + item.quantity, 0);
    setLastStockInCount(count);

    const record = createStockIn(itemsArray, note || undefined, {
      supplierId,
      batchNo: batchNo.trim() || undefined,
      expiresAt: expiresAt || undefined,
    });
    confirmStockIn(record.id, record);

    setItems(new Map());
    setNote("");
    setSupplierName("");
    setBatchNo("");
    setExpiresAt("");
    setShowSuccess(true);
    toast.success("入库成功！");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalQuantity = Array.from(items.values()).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const totalCost = Array.from(items.values()).reduce(
    (sum, item) => sum + (item.cost || 0) * item.quantity,
    0,
  );

  return (
    <div className="pb-[240px]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-semibold">入库</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowScanner(true)}
            className="h-14 flex items-center justify-center gap-2"
          >
            <Camera className="h-5 w-5" />
            扫码添加商品
          </Button>
          <Button
            onClick={() => setShowSearch(true)}
            variant="outline"
            className="h-14 flex items-center justify-center gap-2"
          >
            <Search className="h-5 w-5" />
            搜索添加商品
          </Button>
        </div>

        {/* Items List */}
        {items.size > 0 ? (
          <div className="space-y-3">
            <h2 className="font-medium text-gray-700">
              入库清单 ({totalQuantity} 件)
            </h2>
            {Array.from(items.values()).map((item) => {
              const product = getProductById(item.productId);
              if (!product) return null;

              return (
                <div
                  key={item.productId}
                  className="bg-white border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        当前库存: {product.stock} 件
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">入库数量</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor={`cost-${item.productId}`}
                        className="text-xs"
                      >
                        进价（选填）
                      </Label>
                      <Input
                        id={`cost-${item.productId}`}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.cost || ""}
                        onChange={(e) =>
                          updateCost(item.productId, e.target.value)
                        }
                        className="mt-1 h-8"
                      />
                    </div>
                  </div>

                  {item.cost && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      小计成本: ¥{(item.cost * item.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Stock In Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="supplierName">供应商（选填）</Label>
                <Input
                  id="supplierName"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="例如：宠物用品批发"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="batchNo">批次号（选填）</Label>
                <Input
                  id="batchNo"
                  value={batchNo}
                  onChange={(e) => setBatchNo(e.target.value)}
                  placeholder="例如：B2024-01"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="expiresAt">有效期（选填）</Label>
              <div className="relative mt-1">
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                />
                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="note">备注（选填）</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="入库备注信息"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Camera className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-500">扫码或搜索添加入库商品</p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {items.size > 0 && (
        <div
          className="fixed left-0 right-0 bg-white border-t p-4 z-20"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}
        >
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">入库数量</span>
              <span className="font-medium">{totalQuantity} 件</span>
            </div>
            {totalCost > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">总成本</span>
                <span className="font-medium">¥{totalCost.toFixed(2)}</span>
              </div>
            )}
          </div>
          <Button onClick={handleConfirm} className="w-full h-12 text-lg">
            确认入库
          </Button>
        </div>
      )}

      {/* Scanner Dialog */}
      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />

      {/* Search Dialog */}
      <Dialog open={showSearch} onOpenChange={setShowSearch}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>搜索商品</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="搜索商品名称或条码"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    addItem(product.id, product.cost);
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    当前库存: {product.stock} 件
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  未找到相关商品
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>入库成功</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div className="text-lg font-medium mb-2">库存已更新</div>
              <div className="text-sm text-gray-600">
                已入库 {lastStockInCount} 件商品
              </div>
            </div>

            <Button onClick={() => setShowSuccess(false)} className="w-full">
              继续入库
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
