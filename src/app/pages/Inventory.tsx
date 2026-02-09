"use client";

import React, { useState } from 'react';
import { useData, Product, Service } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Plus, Search, Package, AlertTriangle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { BarcodeScanner } from '../components/BarcodeScanner';

export function Inventory() {
  const { products, services, addProduct, addService, getProductLedger } = useData();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Add product form state
  const [newProduct, setNewProduct] = useState({
    name: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    lowStockThreshold: '',
  });
  const [newService, setNewService] = useState({
    name: '',
    price: '',
    durationMinutes: '',
  });

  const handleScanBarcode = (barcode: string) => {
    setNewProduct((prev) => ({ ...prev, barcode }));
    setShowBarcodeScanner(false);
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast.error('请填写商品名称和售价');
      return;
    }

    addProduct({
      name: newProduct.name,
      barcode: newProduct.barcode || undefined,
      price: parseFloat(newProduct.price),
      cost: newProduct.cost ? parseFloat(newProduct.cost) : undefined,
      stock: newProduct.stock ? parseInt(newProduct.stock) : 0,
      lowStockThreshold: newProduct.lowStockThreshold
        ? parseInt(newProduct.lowStockThreshold)
        : undefined,
    });

    setNewProduct({
      name: '',
      barcode: '',
      price: '',
      cost: '',
      stock: '',
      lowStockThreshold: '',
    });
    setShowAddProduct(false);
    toast.success('商品添加成功');
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) {
      toast.error('请填写服务名称和售价');
      return;
    }

    addService({
      name: newService.name,
      price: parseFloat(newService.price),
      durationMinutes: newService.durationMinutes
        ? parseInt(newService.durationMinutes)
        : undefined,
    });

    setNewService({
      name: '',
      price: '',
      durationMinutes: '',
    });
    setShowAddService(false);
    toast.success('服务添加成功');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'low-stock')
      return matchesSearch && p.lowStockThreshold && p.stock <= p.lowStockThreshold;
    if (activeTab === 'out-of-stock') return matchesSearch && p.stock === 0;

    return matchesSearch;
  });
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = products.filter(
    (p) => p.lowStockThreshold && p.stock <= p.lowStockThreshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">库存</h1>
            <Button
              onClick={() =>
                activeTab === 'services'
                  ? setShowAddService(true)
                  : setShowAddProduct(true)
              }
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              {activeTab === 'services' ? '添加服务' : '添加商品'}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索商品名称或条码"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              全部 ({products.length})
            </TabsTrigger>
            <TabsTrigger value="low-stock">
              低库存 ({lowStockCount})
            </TabsTrigger>
            <TabsTrigger value="out-of-stock">
              缺货 ({outOfStockCount})
            </TabsTrigger>
            <TabsTrigger value="services">
              服务 ({services.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3 mt-4">
            {activeTab === 'services' ? (
              filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="bg-white border rounded-lg p-4 cursor-pointer active:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-gray-900">{service.name}</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ¥{service.price.toFixed(2)}
                      </div>
                    </div>
                    {service.durationMinutes && (
                      <div className="text-sm text-gray-500">
                        时长: {service.durationMinutes} 分钟
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Package className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500">
                    {searchQuery ? '未找到相关服务' : '暂无服务'}
                  </p>
                </div>
              )
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white border rounded-lg p-4 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.barcode && (
                        <div className="text-sm text-gray-500 mt-1">
                          条码: {product.barcode}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {product.stock}
                      </div>
                      <div className="text-xs text-gray-500">库存</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      售价: ¥{product.price.toFixed(2)}
                      {product.cost && (
                        <span className="ml-2">成本: ¥{product.cost.toFixed(2)}</span>
                      )}
                    </div>
                    {product.lowStockThreshold &&
                      product.stock <= product.lowStockThreshold && (
                        <Badge
                          variant="destructive"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
                        >
                          {product.stock === 0 ? '缺货' : '低库存'}
                        </Badge>
                      )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {searchQuery ? '未找到相关商品' : '暂无商品'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加商品</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">商品名称 *</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="例如：狗粮 5kg"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="barcode">条码</Label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="barcode"
                  value={newProduct.barcode}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, barcode: e.target.value })
                  }
                  placeholder="扫码或手动输入"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  className="shrink-0"
                >
                  <Camera className="h-4 w-4 mr-1" />
                  扫码
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">售价 *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newProduct.price}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, price: e.target.value })
                  }
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="cost">成本</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={newProduct.cost}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, cost: e.target.value })
                  }
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="stock">初始库存</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: e.target.value })
                  }
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="threshold">低库存阈值</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newProduct.lowStockThreshold}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      lowStockThreshold: e.target.value,
                    })
                  }
                  placeholder="10"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddProduct(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button onClick={handleAddProduct} className="flex-1">
                确认添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加服务</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceName">服务名称 *</Label>
              <Input
                id="serviceName"
                value={newService.name}
                onChange={(e) =>
                  setNewService({ ...newService, name: e.target.value })
                }
                placeholder="例如：洗澡美容"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="servicePrice">售价 *</Label>
                <Input
                  id="servicePrice"
                  type="number"
                  step="0.01"
                  value={newService.price}
                  onChange={(e) =>
                    setNewService({ ...newService, price: e.target.value })
                  }
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="serviceDuration">时长（分钟）</Label>
                <Input
                  id="serviceDuration"
                  type="number"
                  value={newService.durationMinutes}
                  onChange={(e) =>
                    setNewService({ ...newService, durationMinutes: e.target.value })
                  }
                  placeholder="60"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddService(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button onClick={handleAddService} className="flex-1">
                确认添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleScanBarcode}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Product Detail Dialog */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>商品详情</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedProduct.name}
                </div>
                {selectedProduct.barcode && (
                  <div className="text-sm text-gray-500">
                    条码: {selectedProduct.barcode}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <div className="text-sm text-gray-500 mb-1">售价</div>
                  <div className="text-lg font-semibold">
                    ¥{selectedProduct.price.toFixed(2)}
                  </div>
                </div>
                {selectedProduct.cost && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">成本</div>
                    <div className="text-lg font-semibold">
                      ¥{selectedProduct.cost.toFixed(2)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-500 mb-1">当前库存</div>
                  <div className="text-lg font-semibold">
                    {selectedProduct.stock} 件
                  </div>
                </div>
                {selectedProduct.lowStockThreshold && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">预警阈值</div>
                    <div className="text-lg font-semibold">
                      {selectedProduct.lowStockThreshold} 件
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Ledger */}
              <div>
                <div className="font-medium mb-3">库存流水</div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getProductLedger(selectedProduct.id)
                    .slice(0, 10)
                    .map((ledger) => (
                      <div
                        key={ledger.id}
                        className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                      >
                        <div>
                          <div className="font-medium">
                            {ledger.type === 'stock_in'
                              ? '入库'
                              : ledger.type === 'stock_out'
                              ? '出库'
                              : '调整'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ledger.date).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div
                          className={`font-semibold ${
                            ledger.quantity > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {ledger.quantity > 0 ? '+' : ''}
                          {ledger.quantity}
                        </div>
                      </div>
                    ))}
                  {getProductLedger(selectedProduct.id).length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      暂无流水记录
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Detail Dialog */}
      <Dialog
        open={!!selectedService}
        onOpenChange={() => setSelectedService(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>服务详情</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div className="text-2xl font-bold text-gray-900">
                {selectedService.name}
              </div>
              <div className="grid grid-cols-2 gap-4 py-4 border-y">
                <div>
                  <div className="text-sm text-gray-500 mb-1">售价</div>
                  <div className="text-lg font-semibold">
                    ¥{selectedService.price.toFixed(2)}
                  </div>
                </div>
                {selectedService.durationMinutes && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">时长</div>
                    <div className="text-lg font-semibold">
                      {selectedService.durationMinutes} 分钟
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
