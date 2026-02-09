"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useData, OrderItem } from "../contexts/DataContext";
import { BarcodeScanner } from "../components/BarcodeScanner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Camera, Plus, Minus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

export function Checkout() {
  const router = useRouter();
  const {
    products,
    services,
    getProductByBarcode,
    getProductById,
    getServiceById,
    createOrder,
    confirmOrder,
    addCustomer,
    updateCustomer,
    findCustomerByPhone,
    recordCustomerLedger,
    discountRules,
    coupons,
    storeSettings,
    incrementCouponUsage,
  } = useData();
  const [cart, setCart] = useState<Map<string, OrderItem>>(new Map());
  const [showScanner, setShowScanner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<"guest" | "member">("guest");
  const [customerName, setCustomerName] = useState("散客");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCreateMember, setShowCreateMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [newMemberBalance, setNewMemberBalance] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("余额");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAmountTouched, setPaymentAmountTouched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTab, setSearchTab] = useState<"products" | "services">(
    "products",
  );
  const [selectedCouponId, setSelectedCouponId] = useState<string>("auto");

  useEffect(() => {
    if (customerType === "guest") {
      setCustomerName((prev) => (prev.trim() ? prev : "散客"));
      setCustomerPhone("");
    }
  }, [customerType]);

  const normalizedPhone = customerPhone.trim().replace(/\s+/g, "");
  const isMemberPhoneValid =
    customerType !== "member" || /^1\d{10}$/.test(normalizedPhone);
  const existingMember =
    customerType === "member" && normalizedPhone
      ? findCustomerByPhone(normalizedPhone)
      : undefined;

  useEffect(() => {
    if (customerType !== "member") return;
    if (!normalizedPhone) return;
    if (existingMember?.name) {
      setCustomerName(existingMember.name);
    }
  }, [normalizedPhone, customerType, existingMember]);

  const handleCreateMember = () => {
    const phone = newMemberPhone.trim().replace(/\s+/g, "");
    if (!/^1\d{10}$/.test(phone)) {
      toast.error("请输入正确的手机号");
      return;
    }
    const exists = findCustomerByPhone(phone);
    if (exists) {
      toast.error("该手机号已是会员");
      return;
    }
    const name = newMemberName.trim();
    if (!name) {
      toast.error("请输入会员姓名");
      return;
    }
    const balanceValue = newMemberBalance.trim()
      ? parseFloat(newMemberBalance)
      : 0;
    if (Number.isNaN(balanceValue) || balanceValue < 0) {
      toast.error("余额金额无效");
      return;
    }

    const created = addCustomer({
      name,
      phone,
      balance: 0,
    });
    setCustomerType("member");
    setCustomerName(created.name || "");
    setCustomerPhone(created.phone || "");
    setShowCreateMember(false);
    setNewMemberName("");
    setNewMemberPhone("");
    setNewMemberBalance("");
    if (balanceValue > 0) {
      recordCustomerLedger(
        created.id,
        "recharge",
        balanceValue,
        "开卡充值",
        undefined,
        created
      );
    }
    toast.success("会员已创建");
  };

  const handleScan = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      addProductToCart(product.id);
      toast.success(`已添加：${product.name}`);
    } else {
      toast.error("未找到该商品，请先添加商品信息");
    }
  };

  const makeCartKey = (type: OrderItem["type"], id: string) => `${type}:${id}`;

  const addProductToCart = (productId: string) => {
    const product = getProductById(productId);
    if (!product) return;

    const newCart = new Map(cart);
    const key = makeCartKey("product", productId);
    const existing = newCart.get(key);

    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error("库存不足");
        return;
      }
      newCart.set(key, {
        ...existing,
        quantity: existing.quantity + 1,
      });
    } else {
      if (product.stock <= 0) {
        toast.error("库存不足");
        return;
      }
      newCart.set(key, {
        type: "product",
        productId: product.id,
        name: product.name,
        quantity: 1,
        price: product.price,
      });
    }

    setCart(newCart);
  };

  const addServiceToCart = (serviceId: string) => {
    const service = getServiceById(serviceId);
    if (!service) return;

    const newCart = new Map(cart);
    const key = makeCartKey("service", serviceId);
    const existing = newCart.get(key);

    if (existing) {
      newCart.set(key, {
        ...existing,
        quantity: existing.quantity + 1,
      });
    } else {
      newCart.set(key, {
        type: "service",
        serviceId: service.id,
        name: service.name,
        quantity: 1,
        price: service.price,
      });
    }

    setCart(newCart);
  };

  const updateQuantity = (itemKey: string, delta: number) => {
    const newCart = new Map(cart);
    const existing = newCart.get(itemKey);
    if (!existing) return;

    const newQuantity = existing.quantity + delta;

    if (newQuantity <= 0) {
      newCart.delete(itemKey);
    } else {
      if (existing.type === "product") {
        const productId = existing.productId;
        if (!productId) return;
        const product = getProductById(productId);
        if (!product || newQuantity > product.stock) {
          toast.error("库存不足");
          return;
        }
      }
      newCart.set(itemKey, {
        ...existing,
        quantity: newQuantity,
      });
    }

    setCart(newCart);
  };

  const removeFromCart = (itemKey: string) => {
    const newCart = new Map(cart);
    newCart.delete(itemKey);
    setCart(newCart);
  };

  const calculateTotal = () => {
    let total = 0;
    cart.forEach((item) => {
      total += item.price * item.quantity;
    });
    return total;
  };

  const roundMoney = (value: number) => Math.round(value * 100) / 100;

  const sumByScope = (items: OrderItem[], scope: "all" | "product" | "service") =>
    items.reduce((sum, item) => {
      if (scope === "all") return sum + item.price * item.quantity;
      if (scope === "product" && item.type === "product") {
        return sum + item.price * item.quantity;
      }
      if (scope === "service" && item.type === "service") {
        return sum + item.price * item.quantity;
      }
      return sum;
    }, 0);

  const isActiveByDate = (startAt?: string, endAt?: string) => {
    const now = new Date();
    const start = startAt ? new Date(startAt) : null;
    const end = endAt ? new Date(endAt) : null;
    if (start && Number.isNaN(start.getTime())) return false;
    if (end && Number.isNaN(end.getTime())) return false;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
  const total = calculateTotal();

  const getCouponEligibleAmount = (
    items: OrderItem[],
    coupon: (typeof coupons)[number]
  ) => {
    const eligibleTotal = sumByScope(items, coupon.scope);
    const threshold = coupon.threshold ?? 0;
    if (eligibleTotal < threshold) return 0;
    return roundMoney(Math.min(coupon.amount, eligibleTotal));
  };

  const discountResult = useMemo(() => {
    if (cartItems.length === 0) {
      return {
        discountAmount: 0,
        payableTotal: 0,
        applied: null as
          | null
          | {
              type: "member_rate" | "full_reduction" | "coupon";
              name: string;
              amount: number;
              ruleId?: string;
              rate?: number;
            },
      };
    }

    const candidates: Array<{
      type: "member_rate" | "full_reduction" | "coupon";
      name: string;
      amount: number;
      ruleId?: string;
      rate?: number;
      priority: number;
    }> = [];

    const eligibleTotalAll = sumByScope(cartItems, "all");

    if (customerType === "member" && existingMember) {
      const rate =
        typeof storeSettings.memberDiscountRate === "number"
          ? storeSettings.memberDiscountRate
          : 1;
      const normalizedRate = rate > 0 && rate < 1 ? rate : 1;
      const amount = roundMoney(eligibleTotalAll * (1 - normalizedRate));
      if (amount > 0) {
        candidates.push({
          type: "member_rate",
          name: `会员折扣 ${(normalizedRate * 100).toFixed(0)}%`,
          amount,
          rate: normalizedRate,
          priority: 1,
        });
      }
    }

    const activeRules = discountRules.filter(
      (rule) => rule.enabled && isActiveByDate(rule.startAt, rule.endAt)
    );
    let bestRule = { id: "", name: "", amount: 0 };
    activeRules.forEach((rule) => {
      const eligibleTotal = sumByScope(cartItems, rule.scope);
      if (eligibleTotal < rule.threshold) return;
      const amount = roundMoney(Math.min(rule.amount, eligibleTotal));
      if (amount > bestRule.amount) {
        bestRule = { id: rule.id, name: rule.name, amount };
      }
    });
    if (bestRule.amount > 0) {
      candidates.push({
        type: "full_reduction",
        name: bestRule.name,
        amount: bestRule.amount,
        ruleId: bestRule.id,
        priority: 2,
      });
    }

    const activeCoupons = coupons.filter(
      (coupon) =>
        coupon.enabled &&
        isActiveByDate(coupon.startAt, coupon.endAt) &&
        (typeof coupon.usageLimit !== "number" ||
          coupon.usedCount < coupon.usageLimit)
    );

    let couponCandidate: { id: string; name: string; amount: number } | null = null;
    if (selectedCouponId === "auto") {
      activeCoupons.forEach((coupon) => {
        const amount = getCouponEligibleAmount(cartItems, coupon);
        if (amount <= 0) return;
        if (!couponCandidate || amount > couponCandidate.amount) {
          couponCandidate = { id: coupon.id, name: coupon.name, amount };
        }
      });
    } else if (selectedCouponId !== "none") {
      const chosen = activeCoupons.find((coupon) => coupon.id === selectedCouponId);
      if (chosen) {
        const amount = getCouponEligibleAmount(cartItems, chosen);
        if (amount > 0) {
          couponCandidate = { id: chosen.id, name: chosen.name, amount };
        }
      }
    }

    if (couponCandidate && couponCandidate.amount > 0) {
      candidates.push({
        type: "coupon",
        name: couponCandidate.name,
        amount: couponCandidate.amount,
        ruleId: couponCandidate.id,
        priority: 3,
      });
    }

    if (candidates.length === 0) {
      return {
        discountAmount: 0,
        payableTotal: roundMoney(eligibleTotalAll),
        applied: null,
      };
    }

    candidates.sort((a, b) => {
      if (b.amount !== a.amount) return b.amount - a.amount;
      return b.priority - a.priority;
    });
    const applied = candidates[0];
    const discountAmount = roundMoney(applied.amount);
    const payableTotal = roundMoney(Math.max(0, eligibleTotalAll - discountAmount));
    return {
      discountAmount,
      payableTotal,
      applied,
    };
  }, [
    cartItems,
    customerType,
    existingMember,
    discountRules,
    coupons,
    storeSettings.memberDiscountRate,
    selectedCouponId,
  ]);

  const selectableCoupons = useMemo(
    () =>
      coupons.filter(
        (coupon) =>
          coupon.enabled &&
          isActiveByDate(coupon.startAt, coupon.endAt) &&
          (typeof coupon.usageLimit !== "number" ||
            coupon.usedCount < coupon.usageLimit) &&
          getCouponEligibleAmount(cartItems, coupon) > 0
      ),
    [coupons, cartItems]
  );

  useEffect(() => {
    if (cartItems.length === 0) {
      setPaymentAmount("");
      setPaymentAmountTouched(false);
      return;
    }
    if (!paymentAmountTouched) {
      setPaymentAmount(discountResult.payableTotal.toFixed(2));
    }
  }, [cartItems.length, discountResult.payableTotal, paymentAmountTouched]);

  useEffect(() => {
    if (selectedCouponId === "auto" || selectedCouponId === "none") return;
    if (!coupons.some((coupon) => coupon.id === selectedCouponId)) {
      setSelectedCouponId("auto");
    }
  }, [coupons, selectedCouponId]);

  useEffect(() => {
    if (!storeSettings.paymentMethods.length) return;
    if (!storeSettings.paymentMethods.includes(paymentMethod)) {
      setPaymentMethod(storeSettings.paymentMethods[0]);
    }
  }, [storeSettings.paymentMethods, paymentMethod]);

  const handleCheckout = () => {
    if (cart.size === 0) {
      toast.error("购物车为空");
      return;
    }

    const payableTotal = discountResult.payableTotal;
    const amountValue =
      paymentAmount.trim().length > 0 ? parseFloat(paymentAmount) : payableTotal;
    if (Number.isNaN(amountValue)) {
      toast.error("收款金额无效");
      return;
    }
    if (Math.abs(amountValue - payableTotal) > 0.01) {
      toast.error("收款金额必须等于优惠后应收金额");
      return;
    }

    if (customerType === "member" && !isMemberPhoneValid) {
      toast.error("请输入正确的会员手机号");
      return;
    }
    if (customerType === "member" && !existingMember) {
      toast.error("该手机号未注册会员，请先创建会员");
      return;
    }
    if (paymentMethod === "余额") {
      if (!existingMember) {
        toast.error("余额支付需要选择已存在会员");
        return;
      }
      if (existingMember.balance < payableTotal) {
        toast.error("会员余额不足");
        return;
      }
    }
    if (paymentMethod === "余额" && customerType !== "member") {
      toast.error("余额支付需要选择会员并填写手机号");
      return;
    }

    const items = Array.from(cart.values());
    const resolvedName =
      customerType === "guest"
        ? customerName.trim() || "散客"
        : customerName.trim() || undefined;
    const resolvedPhone = customerType === "member" ? normalizedPhone : undefined;

    let customerId: string | undefined;
    if (customerType === "member" && resolvedPhone && existingMember) {
      customerId = existingMember.id;
      if (resolvedName && resolvedName !== existingMember.name) {
        updateCustomer(existingMember.id, { name: resolvedName });
      }
    }

    const customer = resolvedName || resolvedPhone
      ? { name: resolvedName, phone: resolvedPhone }
      : { name: "散客" };

    const order = createOrder(
      items,
      customer,
      paymentMethod,
      "paid",
      amountValue,
      customerId,
      {
        discountAmount: discountResult.discountAmount,
        discountType: discountResult.applied?.type,
        discountName: discountResult.applied?.name,
        discountRuleId: discountResult.applied?.ruleId,
        discountRate: discountResult.applied?.rate,
        payableTotal,
      }
    );

    if (!order) {
      toast.error("库存不足，无法创建订单");
      return;
    }

    confirmOrder(order.id, order);
    if (discountResult.applied?.type === "coupon" && discountResult.applied.ruleId) {
      incrementCouponUsage(discountResult.applied.ruleId);
    }
    if (paymentMethod === "余额" && customerId) {
      recordCustomerLedger(
        customerId,
        "consume",
        payableTotal,
        `余额支付 · 订单 ${order.id}`,
        order.id,
      );
    }
    setLastOrderId(order.orderNo || order.id);
    setCart(new Map());
    setCustomerType("guest");
    setCustomerName("散客");
    setCustomerPhone("");
    setPaymentAmount("");
    setPaymentAmountTouched(false);
    setSelectedCouponId("auto");
    setShowSuccess(true);
    toast.success("订单创建成功！");
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const itemCount = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <div className="pb-[220px]">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-semibold">开单</h1>
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
            搜索添加
          </Button>
        </div>

        {/* Cart Items */}
        {cart.size > 0 ? (
          <div className="space-y-3">
            <h2 className="font-medium text-gray-700">
              购物车 ({itemCount} 件)
            </h2>
            {Array.from(cart.entries()).map(([itemKey, item]) => {
              const product =
                item.type === "product" && item.productId
                  ? getProductById(item.productId)
                  : undefined;
              const service =
                item.type === "service" && item.serviceId
                  ? getServiceById(item.serviceId)
                  : undefined;
              const itemName =
                product?.name || service?.name || item.name || "项目";

              return (
                <div
                  key={itemKey}
                  className="bg-white border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {itemName}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        ¥{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(itemKey, -1)}
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
                        onClick={() => updateQuantity(itemKey, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(itemKey)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {item.type === "product" && product && (
                    <div className="text-xs text-gray-500">
                      库存: {product.stock} 件
                    </div>
                  )}
                  {item.type === "service" && (
                    <div className="text-xs text-gray-500">服务项目</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Camera className="h-10 w-10 text-gray-400" />
            </div>
            <p className="text-gray-500">扫码或搜索添加项目</p>
          </div>
        )}

        {/* Payment & Customer Info */}
        {cart.size > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="paymentMethod">支付方式</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storeSettings.paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="paymentAmount">收款金额</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmountTouched(true);
                    setPaymentAmount(e.target.value);
                  }}
                  placeholder={total.toFixed(2)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="couponSelect">优惠券</Label>
                <Select
                  value={selectedCouponId}
                  onValueChange={setSelectedCouponId}
                >
                  <SelectTrigger className="mt-1" id="couponSelect">
                    <SelectValue placeholder="选择优惠券" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">自动选择最优优惠券</SelectItem>
                    <SelectItem value="none">不使用优惠券</SelectItem>
                    {selectableCoupons.map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.name} · 减¥{coupon.amount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-white rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">优惠方式</span>
                  <span className="font-medium">
                    {discountResult.applied
                      ? discountResult.applied.name
                      : "无"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">优惠金额</span>
                  <span className="font-medium text-red-600">
                    -¥{discountResult.discountAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>应收金额</span>
                  <span>¥{discountResult.payableTotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  规则：会员折扣 / 满减 / 优惠券 只取最大
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>客户类型</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={customerType === "guest" ? "default" : "outline"}
                  onClick={() => setCustomerType("guest")}
                  className="flex-1"
                >
                  散客
                </Button>
                <Button
                  type="button"
                  variant={customerType === "member" ? "default" : "outline"}
                  onClick={() => setCustomerType("member")}
                  className="flex-1"
                >
                  会员
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="customerName">
                  客户姓名{customerType === "guest" ? " *" : ""}
                </Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={customerType === "guest" ? "默认：散客" : "选填"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">
                  客户手机{customerType === "member" ? " *" : ""}
                </Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder={
                    customerType === "member" ? "请输入会员手机号" : "选填"
                  }
                  className="mt-1"
                />
                {customerType === "member" && customerPhone.trim() && (
                  <div className="mt-2 text-sm">
                    {!isMemberPhoneValid ? (
                      <span className="text-red-600">手机号格式不正确</span>
                    ) : existingMember ? (
                      <span className="text-green-600">
                        会员已找到 · 余额 ¥{existingMember.balance.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-orange-600">
                        未找到会员，请先创建
                      </span>
                    )}
                  </div>
                )}
              </div>
              {customerType === "member" && !existingMember && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewMemberPhone(normalizedPhone);
                    setShowCreateMember(true);
                  }}
                  className="w-full"
                >
                  创建会员
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {cart.size > 0 && (
        <div
          className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 z-20"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-gray-600">应收金额</div>
              {discountResult.discountAmount > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  已优惠 ¥{discountResult.discountAmount.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              ¥{discountResult.payableTotal.toFixed(2)}
            </div>
          </div>
          <Button onClick={handleCheckout} className="w-full h-12 text-lg">
            确认订单
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
            <DialogTitle>搜索添加</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder={
                searchTab === "products" ? "搜索商品名称或条码" : "搜索服务名称"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="text-lg h-12"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={searchTab === "products" ? "default" : "outline"}
                onClick={() => setSearchTab("products")}
                className="flex-1"
              >
                商品
              </Button>
              <Button
                type="button"
                variant={searchTab === "services" ? "default" : "outline"}
                onClick={() => setSearchTab("services")}
                className="flex-1"
              >
                服务
              </Button>
            </div>

            {searchTab === "products" ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      addProductToCart(product.id);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      ¥{product.price.toFixed(2)} · 库存 {product.stock}
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    未找到相关商品
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => {
                      addServiceToCart(service.id);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                  >
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      ¥{service.price.toFixed(2)}
                      {service.durationMinutes
                        ? ` · ${service.durationMinutes} 分钟`
                        : ""}
                    </div>
                  </div>
                ))}
                {filteredServices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    未找到相关服务
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>订单创建成功</DialogTitle>
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
              <div className="text-lg font-medium mb-2">订单号</div>
              <div className="text-sm text-gray-600">{lastOrderId}</div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  setShowSuccess(false);
                  router.push("/more");
                }}
                className="w-full"
              >
                查看电子凭证
              </Button>
              <Button
                onClick={() => setShowSuccess(false)}
                variant="outline"
                className="w-full"
              >
                继续开单
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={showCreateMember} onOpenChange={setShowCreateMember}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>创建会员</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="newMemberName">会员姓名 *</Label>
              <Input
                id="newMemberName"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="请输入会员姓名"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newMemberPhone">会员手机 *</Label>
              <Input
                id="newMemberPhone"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                placeholder="请输入手机号"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="newMemberBalance">初始余额</Label>
              <Input
                id="newMemberBalance"
                type="number"
                step="0.01"
                value={newMemberBalance}
                onChange={(e) => setNewMemberBalance(e.target.value)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
            <Button onClick={handleCreateMember} className="w-full">
              保存会员
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
