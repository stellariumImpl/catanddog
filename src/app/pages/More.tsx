"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData, Order, Customer } from "../contexts/DataContext";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Receipt,
  FileText,
  Users,
  Wallet,
  PlusCircle,
  Settings,
  LogOut,
  Copy,
  ChevronRight,
  Tag,
  Trash2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export function More() {
  const { user, logout } = useAuth();
  const {
    orders,
    receipts,
    refunds,
    customers,
    discountRules,
    coupons,
    storeSettings,
    getCustomerLedger,
    recordCustomerLedger,
    getProductById,
    getServiceById,
    refundOrder,
    addDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    updateStoreSettings,
  } = useData();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundTarget, setRefundTarget] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [memberDiscountInput, setMemberDiscountInput] = useState(
    (storeSettings.memberDiscountRate * 100).toFixed(0),
  );
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleThreshold, setNewRuleThreshold] = useState("");
  const [newRuleAmount, setNewRuleAmount] = useState("");
  const [newRuleScope, setNewRuleScope] = useState<
    "all" | "product" | "service"
  >("all");
  const [newRuleStart, setNewRuleStart] = useState("");
  const [newRuleEnd, setNewRuleEnd] = useState("");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editRuleName, setEditRuleName] = useState("");
  const [editRuleThreshold, setEditRuleThreshold] = useState("");
  const [editRuleAmount, setEditRuleAmount] = useState("");
  const [editRuleScope, setEditRuleScope] = useState<
    "all" | "product" | "service"
  >("all");
  const [editRuleStart, setEditRuleStart] = useState("");
  const [editRuleEnd, setEditRuleEnd] = useState("");
  const [newCouponName, setNewCouponName] = useState("");
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponThreshold, setNewCouponThreshold] = useState("");
  const [newCouponAmount, setNewCouponAmount] = useState("");
  const [newCouponScope, setNewCouponScope] = useState<
    "all" | "product" | "service"
  >("all");
  const [newCouponUsageLimit, setNewCouponUsageLimit] = useState("");
  const [newCouponStart, setNewCouponStart] = useState("");
  const [newCouponEnd, setNewCouponEnd] = useState("");
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [editCouponName, setEditCouponName] = useState("");
  const [editCouponCode, setEditCouponCode] = useState("");
  const [editCouponThreshold, setEditCouponThreshold] = useState("");
  const [editCouponAmount, setEditCouponAmount] = useState("");
  const [editCouponScope, setEditCouponScope] = useState<
    "all" | "product" | "service"
  >("all");
  const [editCouponUsageLimit, setEditCouponUsageLimit] = useState("");
  const [editCouponStart, setEditCouponStart] = useState("");
  const [editCouponEnd, setEditCouponEnd] = useState("");

  const confirmedOrders = orders
    .filter((o) => o.status === "confirmed" || o.status === "refunded")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredMembers = customers.filter((member) => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return true;
    return (
      member.name?.toLowerCase().includes(keyword) ||
      member.phone?.toLowerCase().includes(keyword)
    );
  });

  const memberOrders = selectedMember
    ? orders
        .filter((order) => order.customerId === selectedMember.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const getOrderRefunds = (orderId: string) =>
    refunds
      .filter((refund) => refund.orderId === orderId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

  const handleRecharge = () => {
    if (!selectedMember) return;
    const amount = parseFloat(rechargeAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("充值金额无效");
      return;
    }
    recordCustomerLedger(
      selectedMember.id,
      "recharge",
      amount,
      adjustNote || "会员充值",
    );
    setRechargeAmount("");
    setAdjustNote("");
    toast.success("充值成功");
  };

  const handleAdjust = () => {
    if (!selectedMember) return;
    const amount = parseFloat(adjustAmount);
    if (Number.isNaN(amount) || amount === 0) {
      toast.error("调账金额无效");
      return;
    }
    recordCustomerLedger(
      selectedMember.id,
      "adjust",
      amount,
      adjustNote || "余额调整",
    );
    setAdjustAmount("");
    setAdjustNote("");
    toast.success("余额已调整");
  };

  const handleCopyReceiptLink = (orderId: string) => {
    const link = `${window.location.origin}/receipt/${orderId}`;
    navigator.clipboard.writeText(link);
    toast.success("凭证链接已复制");
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const handleLogout = () => {
    logout();
    toast.success("已退出登录");
  };

  const toDateInput = (value?: string | null) => {
    if (!value) return "";
    if (value.includes("T")) return value.slice(0, 10);
    return value;
  };

  const openEditRule = (rule: (typeof discountRules)[number]) => {
    setEditingRuleId(rule.id);
    setEditRuleName(rule.name);
    setEditRuleThreshold(String(rule.threshold));
    setEditRuleAmount(String(rule.amount));
    setEditRuleScope(rule.scope);
    setEditRuleStart(toDateInput(rule.startAt));
    setEditRuleEnd(toDateInput(rule.endAt));
  };

  const saveEditRule = () => {
    if (!editingRuleId) return;
    const name = editRuleName.trim();
    if (!name) {
      toast.error("请输入满减活动名称");
      return;
    }
    const threshold = parseFloat(editRuleThreshold);
    const amount = parseFloat(editRuleAmount);
    if (Number.isNaN(threshold) || threshold <= 0) {
      toast.error("满减门槛无效");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("减免金额无效");
      return;
    }
    if (
      editRuleStart &&
      editRuleEnd &&
      new Date(editRuleStart) > new Date(editRuleEnd)
    ) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    updateDiscountRule(editingRuleId, {
      name,
      threshold,
      amount,
      scope: editRuleScope,
      startAt: editRuleStart || undefined,
      endAt: editRuleEnd || undefined,
    });
    setEditingRuleId(null);
    toast.success("满减活动已更新");
  };

  const openEditCoupon = (coupon: (typeof coupons)[number]) => {
    setEditingCouponId(coupon.id);
    setEditCouponName(coupon.name);
    setEditCouponCode(coupon.code || "");
    setEditCouponThreshold(coupon.threshold ? String(coupon.threshold) : "");
    setEditCouponAmount(String(coupon.amount));
    setEditCouponScope(coupon.scope);
    setEditCouponUsageLimit(
      typeof coupon.usageLimit === "number" ? String(coupon.usageLimit) : "",
    );
    setEditCouponStart(toDateInput(coupon.startAt));
    setEditCouponEnd(toDateInput(coupon.endAt));
  };

  const saveEditCoupon = () => {
    if (!editingCouponId) return;
    const name = editCouponName.trim();
    if (!name) {
      toast.error("请输入优惠券名称");
      return;
    }
    const amount = parseFloat(editCouponAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("优惠券金额无效");
      return;
    }
    const threshold = editCouponThreshold.trim()
      ? parseFloat(editCouponThreshold)
      : undefined;
    if (
      editCouponThreshold.trim() &&
      (Number.isNaN(threshold) || threshold! <= 0)
    ) {
      toast.error("优惠券门槛无效");
      return;
    }
    const usageLimit = editCouponUsageLimit.trim()
      ? parseInt(editCouponUsageLimit, 10)
      : undefined;
    if (
      editCouponUsageLimit.trim() &&
      (Number.isNaN(usageLimit) || usageLimit! <= 0)
    ) {
      toast.error("使用次数限制无效");
      return;
    }
    if (
      editCouponStart &&
      editCouponEnd &&
      new Date(editCouponStart) > new Date(editCouponEnd)
    ) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    updateCoupon(editingCouponId, {
      name,
      code: editCouponCode.trim() || undefined,
      threshold,
      amount,
      scope: editCouponScope,
      usageLimit,
      startAt: editCouponStart || undefined,
      endAt: editCouponEnd || undefined,
    });
    setEditingCouponId(null);
    toast.success("优惠券已更新");
  };
  useEffect(() => {
    setMemberDiscountInput((storeSettings.memberDiscountRate * 100).toFixed(0));
  }, [storeSettings.memberDiscountRate]);

  const handleSaveMemberDiscount = () => {
    const percent = parseFloat(memberDiscountInput);
    if (Number.isNaN(percent) || percent <= 0 || percent > 100) {
      toast.error("会员折扣率需在 1-100 之间");
      return;
    }
    updateStoreSettings({ memberDiscountRate: percent / 100 });
    toast.success("会员折扣已更新");
  };

  const handleAddRule = () => {
    const name = newRuleName.trim();
    if (!name) {
      toast.error("请输入满减活动名称");
      return;
    }
    const threshold = parseFloat(newRuleThreshold);
    const amount = parseFloat(newRuleAmount);
    if (Number.isNaN(threshold) || threshold <= 0) {
      toast.error("满减门槛无效");
      return;
    }
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("减免金额无效");
      return;
    }
    if (
      newRuleStart &&
      newRuleEnd &&
      new Date(newRuleStart) > new Date(newRuleEnd)
    ) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    addDiscountRule({
      name,
      scope: newRuleScope,
      threshold,
      amount,
      startAt: newRuleStart || undefined,
      endAt: newRuleEnd || undefined,
      enabled: true,
    });
    setNewRuleName("");
    setNewRuleThreshold("");
    setNewRuleAmount("");
    setNewRuleScope("all");
    setNewRuleStart("");
    setNewRuleEnd("");
    toast.success("满减活动已添加");
  };

  const handleAddCoupon = () => {
    const name = newCouponName.trim();
    if (!name) {
      toast.error("请输入优惠券名称");
      return;
    }
    const amount = parseFloat(newCouponAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("优惠券金额无效");
      return;
    }
    const threshold = newCouponThreshold.trim()
      ? parseFloat(newCouponThreshold)
      : undefined;
    if (
      newCouponThreshold.trim() &&
      (Number.isNaN(threshold) || threshold! <= 0)
    ) {
      toast.error("优惠券门槛无效");
      return;
    }
    const usageLimit = newCouponUsageLimit.trim()
      ? parseInt(newCouponUsageLimit, 10)
      : undefined;
    if (
      newCouponUsageLimit.trim() &&
      (Number.isNaN(usageLimit) || usageLimit! <= 0)
    ) {
      toast.error("使用次数限制无效");
      return;
    }
    if (
      newCouponStart &&
      newCouponEnd &&
      new Date(newCouponStart) > new Date(newCouponEnd)
    ) {
      toast.error("开始日期不能晚于结束日期");
      return;
    }
    addCoupon({
      name,
      code: newCouponCode.trim() || undefined,
      scope: newCouponScope,
      threshold,
      amount,
      usageLimit,
      startAt: newCouponStart || undefined,
      endAt: newCouponEnd || undefined,
      enabled: true,
    });
    setNewCouponName("");
    setNewCouponCode("");
    setNewCouponThreshold("");
    setNewCouponAmount("");
    setNewCouponScope("all");
    setNewCouponUsageLimit("");
    setNewCouponStart("");
    setNewCouponEnd("");
    toast.success("优惠券已添加");
  };

  const getMaxRefundAmount = (order: Order) =>
    typeof order.paymentAmount === "number" ? order.paymentAmount : order.total;

  const handleOpenRefund = (order: Order) => {
    setRefundTarget(order);
    setRefundAmount(getMaxRefundAmount(order).toFixed(2));
    setRefundReason("");
    setShowRefundDialog(true);
  };

  const handleConfirmRefund = () => {
    if (!refundTarget) return;
    if (
      refundTarget.status === "refunded" ||
      refundTarget.paymentStatus === "refunded"
    ) {
      toast.error("该订单已退款");
      return;
    }
    if (refundTarget.paymentStatus !== "paid") {
      toast.error("仅支持已支付订单退款");
      return;
    }
    const amountValue = parseFloat(refundAmount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      toast.error("退款金额无效");
      return;
    }
    const maxAmount = getMaxRefundAmount(refundTarget);
    if (amountValue > maxAmount) {
      toast.error("退款金额不能大于实收金额");
      return;
    }
    refundOrder(refundTarget.id, amountValue, refundReason.trim() || undefined);
    toast.success("退款已提交");
    setShowRefundDialog(false);
    setRefundTarget(null);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-xl font-semibold">{user?.username}</div>
            {user?.storeName && (
              <div className="text-blue-100 text-sm mt-1">{user.storeName}</div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Orders & Receipts */}
        <div>
          <h2 className="text-lg font-semibold mb-3">订单与凭证</h2>
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">
                <FileText className="h-4 w-4 mr-2" />
                订单列表
              </TabsTrigger>
              <TabsTrigger value="receipts">
                <Receipt className="h-4 w-4 mr-2" />
                电子凭证
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-3">
              {confirmedOrders.length > 0 ? (
                confirmedOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => handleViewReceipt(order)}
                    className="bg-white border rounded-lg p-4 cursor-pointer active:bg-gray-50"
                  >
                    {(() => {
                      const orderPaid =
                        typeof order.paymentAmount === "number"
                          ? order.paymentAmount
                          : typeof order.payableTotal === "number"
                            ? order.payableTotal
                            : order.total;
                      return (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">
                                {order.orderNo || order.id}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                订单ID：{order.id}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {new Date(order.date).toLocaleString("zh-CN")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                ¥{orderPaid.toFixed(2)}
                              </div>
                              <Badge
                                variant={
                                  order.status === "refunded"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="mt-1"
                              >
                                {order.status === "refunded"
                                  ? "已退款"
                                  : "已完成"}
                              </Badge>
                            </div>
                          </div>

                          {order.customer && (
                            <div className="text-sm text-gray-600 mt-2">
                              客户:{" "}
                              {order.customer.name || order.customer.phone}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                            <span>
                              支付方式：{order.paymentMethod || "未记录"}
                            </span>
                            <span>实收：¥{orderPaid.toFixed(2)}</span>
                          </div>
                          {order.status !== "refunded" && (
                            <div className="flex justify-end mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenRefund(order);
                                }}
                              >
                                退款
                              </Button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无订单</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="receipts" className="space-y-3">
              {receipts.length > 0 ? (
                receipts.map((receipt) => {
                  const order = orders.find((o) => o.id === receipt.orderId);
                  if (!order) return null;
                  const orderPaid =
                    typeof order.paymentAmount === "number"
                      ? order.paymentAmount
                      : typeof order.payableTotal === "number"
                        ? order.payableTotal
                        : order.total;

                  return (
                    <div
                      key={receipt.id}
                      className="bg-white border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-gray-900">
                            {order.orderNo || order.id}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            凭证号：{receipt.id}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {new Date(receipt.createdAt).toLocaleString(
                              "zh-CN",
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          ¥{orderPaid.toFixed(2)}
                        </div>
                      </div>

                      {order.status === "refunded" && (
                        <div className="text-xs text-red-600 mb-2">
                          该订单已退款
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReceipt(order)}
                          className="flex-1"
                        >
                          查看凭证
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyReceiptLink(order.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Receipt className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">暂无凭证</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Member Management */}
        <div>
          <h2 className="text-lg font-semibold mb-3">会员管理</h2>
          <button
            onClick={() => setShowMembers(true)}
            className="w-full bg-white border rounded-lg p-4 flex items-center justify-between active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-600" />
              <span className="font-medium">会员列表与余额管理</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Discount Management */}
        <div>
          <h2 className="text-lg font-semibold mb-3">营销与折扣</h2>
          <button
            onClick={() => setShowDiscounts(true)}
            className="w-full bg-white border rounded-lg p-4 flex items-center justify-between active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-gray-600" />
              <span className="font-medium">折扣与优惠管理</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-3">设置</h2>
          <div className="space-y-2">
            <button className="w-full bg-white border rounded-lg p-4 flex items-center justify-between active:bg-gray-50">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <span className="font-medium">门店设置</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full bg-white border rounded-lg p-4 flex items-center justify-between active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-600">退出登录</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>电子凭证</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Store Info */}
              <div className="text-center border-b pb-4">
                <div className="text-xl font-bold">
                  {user?.storeName || "老友记宠物收银系统"}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  电子凭证 · {selectedOrder.orderNo || selectedOrder.id}
                </div>
              </div>

              {/* Order Details */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">订单编号</span>
                  <span>{selectedOrder.orderNo || selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">订单时间</span>
                  <span>
                    {new Date(selectedOrder.date).toLocaleString("zh-CN")}
                  </span>
                </div>
                {selectedOrder.customer && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">客户信息</span>
                    <span>
                      {selectedOrder.customer.name ||
                        selectedOrder.customer.phone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">订单状态</span>
                  <span
                    className={
                      selectedOrder.status === "refunded" ? "text-red-600" : ""
                    }
                  >
                    {selectedOrder.status === "refunded" ? "已退款" : "已完成"}
                  </span>
                </div>
                {selectedOrder.paymentMethod && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">支付方式</span>
                    <span>{selectedOrder.paymentMethod}</span>
                  </div>
                )}
                {typeof selectedOrder.discountAmount === "number" &&
                  selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">优惠金额</span>
                      <span>-¥{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                {typeof selectedOrder.payableTotal === "number" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">应收金额</span>
                    <span>¥{selectedOrder.payableTotal.toFixed(2)}</span>
                  </div>
                )}
                {typeof selectedOrder.paymentAmount === "number" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">实收金额</span>
                    <span>¥{selectedOrder.paymentAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-y py-4 space-y-3">
                <div className="font-medium">项目明细</div>
                {selectedOrder.items.map((item, index) => {
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
                    <div key={index} className="flex justify-between text-sm">
                      <div className="flex-1">
                        <div>
                          {itemName}
                          {item.type === "service" ? "（服务）" : ""}
                        </div>
                        <div className="text-gray-500">
                          ¥{item.price.toFixed(2)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-medium">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">合计</span>
                <span className="text-2xl font-bold">
                  ¥{selectedOrder.total.toFixed(2)}
                </span>
              </div>

              {getOrderRefunds(selectedOrder.id).length > 0 && (
                <div className="border-t pt-3 space-y-2">
                  <div className="font-medium text-sm">退款记录</div>
                  {getOrderRefunds(selectedOrder.id).map((refund) => (
                    <div
                      key={refund.id}
                      className="flex items-start justify-between text-sm"
                    >
                      <div>
                        <div className="text-gray-700">
                          退款 ¥{refund.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(refund.createdAt).toLocaleString("zh-CN")}
                        </div>
                        {refund.reason && (
                          <div className="text-xs text-gray-500 mt-1">
                            原因：{refund.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => handleCopyReceiptLink(selectedOrder.id)}
                  variant="outline"
                  className="w-full"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  复制凭证链接
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="w-full"
                >
                  打印凭证
                </Button>
                <div className="text-center text-xs text-gray-400 pt-2">
                  发送功能开发中（短信/微信）
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>订单退款</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-medium text-gray-900">
                  {refundTarget.orderNo || refundTarget.id}
                </div>
                <div className="text-gray-500 mt-1">
                  实收金额：¥{getMaxRefundAmount(refundTarget).toFixed(2)}
                </div>
                <div className="text-gray-500 mt-1">
                  支付方式：{refundTarget.paymentMethod || "未记录"}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="refundAmount">退款金额</Label>
                  <Input
                    id="refundAmount"
                    type="number"
                    step="0.01"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="refundReason">退款原因</Label>
                  <Input
                    id="refundReason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="可选，例如：退货"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRefundDialog(false)}
                >
                  取消
                </Button>
                <Button className="flex-1" onClick={handleConfirmRefund}>
                  确认退款
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Logout Confirm Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认退出登录？</AlertDialogTitle>
            <AlertDialogDescription>
              退出后需要重新登录才能使用系统
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              确认退出
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Member Management Dialog */}
      <Dialog open={showMembers} onOpenChange={setShowMembers}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>会员管理</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="搜索会员姓名或手机号"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
            />

            <div className="space-y-2">
              {filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`w-full border rounded-lg p-3 text-left transition ${
                      selectedMember?.id === member.id
                        ? "border-blue-500 bg-blue-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.name || "未命名会员"}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {member.phone || "未绑定手机号"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">余额</div>
                        <div className="text-lg font-semibold text-gray-900">
                          ¥{member.balance.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">暂无会员</div>
              )}
            </div>

            {selectedMember && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">选中会员</div>
                    <div className="text-lg font-semibold">
                      {selectedMember.name || "未命名会员"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selectedMember.phone || "未绑定手机号"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">当前余额</div>
                    <div className="text-xl font-bold">
                      ¥{selectedMember.balance.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="rechargeAmount">充值金额</Label>
                    <Input
                      id="rechargeAmount"
                      type="number"
                      step="0.01"
                      value={rechargeAmount}
                      onChange={(e) => setRechargeAmount(e.target.value)}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adjustNote">备注</Label>
                    <Input
                      id="adjustNote"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                      placeholder="例如：线下充值"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleRecharge} className="w-full">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    确认充值
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="adjustAmount">余额调整</Label>
                    <Input
                      id="adjustAmount"
                      type="number"
                      step="0.01"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                      placeholder="可输入正数或负数"
                      className="mt-1"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleAdjust}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    提交调整
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">余额流水</div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {getCustomerLedger(selectedMember.id).length > 0 ? (
                      getCustomerLedger(selectedMember.id)
                        .slice(0, 10)
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                          >
                            <div>
                              <div className="font-medium">
                                {entry.note?.includes("订单退款")
                                  ? "退款"
                                  : entry.type === "recharge"
                                    ? "充值"
                                    : entry.type === "consume"
                                      ? "消费"
                                      : "调整"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(entry.createdAt).toLocaleString(
                                  "zh-CN",
                                )}
                              </div>
                              {entry.note && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {entry.note}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div
                                className={`font-semibold ${
                                  entry.amount >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {entry.amount >= 0 ? "+" : ""}
                                {entry.amount.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-500">
                                余额 ¥{entry.balanceAfter.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        暂无流水记录
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">消费记录</div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {memberOrders.length > 0 ? (
                      memberOrders.slice(0, 10).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                        >
                          <div>
                            <div className="font-medium">
                              {order.orderNo || order.id}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.date).toLocaleString("zh-CN")}
                            </div>
                          </div>
                          <div className="font-semibold">
                            ¥{order.total.toFixed(2)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-4">
                        暂无消费记录
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Management Dialog */}
      <Dialog open={showDiscounts} onOpenChange={setShowDiscounts}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>折扣与优惠</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="font-medium">会员折扣</div>
              <div className="text-sm text-gray-500">
                折扣率按百分比填写，例如 95 表示 95 折
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={memberDiscountInput}
                  onChange={(e) => setMemberDiscountInput(e.target.value)}
                  placeholder="100"
                />
                <Button onClick={handleSaveMemberDiscount}>保存</Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-medium">满减活动</div>
              {discountRules.length > 0 ? (
                <div className="space-y-2">
                  {discountRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        {editingRuleId === rule.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editRuleName}
                              onChange={(e) => setEditRuleName(e.target.value)}
                              placeholder="活动名称"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                value={editRuleThreshold}
                                onChange={(e) =>
                                  setEditRuleThreshold(e.target.value)
                                }
                                placeholder="门槛金额"
                              />
                              <Input
                                type="number"
                                value={editRuleAmount}
                                onChange={(e) =>
                                  setEditRuleAmount(e.target.value)
                                }
                                placeholder="减免金额"
                              />
                            </div>
                            <Select
                              value={editRuleScope}
                              onValueChange={(value) =>
                                setEditRuleScope(
                                  value as "all" | "product" | "service",
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="适用范围" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">商品+服务</SelectItem>
                                <SelectItem value="product">仅商品</SelectItem>
                                <SelectItem value="service">仅服务</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={editRuleStart}
                                  onChange={(e) =>
                                    setEditRuleStart(e.target.value)
                                  }
                                  className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              </div>
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={editRuleEnd}
                                  onChange={(e) =>
                                    setEditRuleEnd(e.target.value)
                                  }
                                  className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditRule}>
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingRuleId(null)}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              范围：
                              {rule.scope === "all"
                                ? "商品+服务"
                                : rule.scope === "product"
                                  ? "商品"
                                  : "服务"}
                              · 满¥{rule.threshold.toFixed(2)} 减¥
                              {rule.amount.toFixed(2)}
                            </div>
                            {(rule.startAt || rule.endAt) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {rule.startAt ? `开始 ${rule.startAt}` : ""}
                                {rule.endAt ? ` 结束 ${rule.endAt}` : ""}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) =>
                            updateDiscountRule(rule.id, { enabled: checked })
                          }
                        />
                        <button
                          className="text-red-500 text-sm"
                          onClick={() => deleteDiscountRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          className="text-xs text-gray-500"
                          onClick={() => openEditRule(rule)}
                        >
                          修改
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">暂无满减活动</div>
              )}

              <div className="border rounded-lg p-3 space-y-3">
                <div className="font-medium text-sm">新增满减</div>
                <Input
                  placeholder="活动名称"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="门槛金额"
                    type="number"
                    value={newRuleThreshold}
                    onChange={(e) => setNewRuleThreshold(e.target.value)}
                  />
                  <Input
                    placeholder="减免金额"
                    type="number"
                    value={newRuleAmount}
                    onChange={(e) => setNewRuleAmount(e.target.value)}
                  />
                </div>
                <Select
                  value={newRuleScope}
                  onValueChange={(value) =>
                    setNewRuleScope(value as "all" | "product" | "service")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="适用范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">商品+服务</SelectItem>
                    <SelectItem value="product">仅商品</SelectItem>
                    <SelectItem value="service">仅服务</SelectItem>
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      type="date"
                      value={newRuleStart}
                      onChange={(e) => setNewRuleStart(e.target.value)}
                      className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="relative">
                    <Input
                      type="date"
                      value={newRuleEnd}
                      onChange={(e) => setNewRuleEnd(e.target.value)}
                      className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <Button onClick={handleAddRule} className="w-full">
                  添加满减活动
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-medium">优惠券</div>
              {coupons.length > 0 ? (
                <div className="space-y-2">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="border rounded-lg p-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        {editingCouponId === coupon.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editCouponName}
                              onChange={(e) =>
                                setEditCouponName(e.target.value)
                              }
                              placeholder="优惠券名称"
                            />
                            <Input
                              value={editCouponCode}
                              onChange={(e) =>
                                setEditCouponCode(e.target.value)
                              }
                              placeholder="券码（可选）"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                value={editCouponThreshold}
                                onChange={(e) =>
                                  setEditCouponThreshold(e.target.value)
                                }
                                placeholder="门槛金额"
                              />
                              <Input
                                type="number"
                                value={editCouponAmount}
                                onChange={(e) =>
                                  setEditCouponAmount(e.target.value)
                                }
                                placeholder="减免金额"
                              />
                            </div>
                            <Select
                              value={editCouponScope}
                              onValueChange={(value) =>
                                setEditCouponScope(
                                  value as "all" | "product" | "service",
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="适用范围" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">商品+服务</SelectItem>
                                <SelectItem value="product">仅商品</SelectItem>
                                <SelectItem value="service">仅服务</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={editCouponUsageLimit}
                              onChange={(e) =>
                                setEditCouponUsageLimit(e.target.value)
                              }
                              placeholder="使用次数限制（可选）"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={editCouponStart}
                                  onChange={(e) =>
                                    setEditCouponStart(e.target.value)
                                  }
                                  className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              </div>
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={editCouponEnd}
                                  onChange={(e) =>
                                    setEditCouponEnd(e.target.value)
                                  }
                                  className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                                />
                                <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEditCoupon}>
                                保存
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCouponId(null)}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-medium">{coupon.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              范围：
                              {coupon.scope === "all"
                                ? "商品+服务"
                                : coupon.scope === "product"
                                  ? "商品"
                                  : "服务"}
                              {coupon.threshold
                                ? ` · 满¥${coupon.threshold.toFixed(2)}`
                                : ""}
                              · 减¥{coupon.amount.toFixed(2)}
                            </div>
                            {(coupon.startAt || coupon.endAt) && (
                              <div className="text-xs text-gray-500 mt-1">
                                {coupon.startAt ? `开始 ${coupon.startAt}` : ""}
                                {coupon.endAt ? ` 结束 ${coupon.endAt}` : ""}
                              </div>
                            )}
                            {typeof coupon.usageLimit === "number" && (
                              <div className="text-xs text-gray-500 mt-1">
                                使用次数：{coupon.usedCount}/{coupon.usageLimit}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Switch
                          checked={coupon.enabled}
                          onCheckedChange={(checked) =>
                            updateCoupon(coupon.id, { enabled: checked })
                          }
                        />
                        <button
                          className="text-red-500 text-sm"
                          onClick={() => deleteCoupon(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          className="text-xs text-gray-500"
                          onClick={() => openEditCoupon(coupon)}
                        >
                          修改
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">暂无优惠券</div>
              )}

              <div className="border rounded-lg p-3 space-y-3">
                <div className="font-medium text-sm">新增优惠券</div>
                <Input
                  placeholder="优惠券名称"
                  value={newCouponName}
                  onChange={(e) => setNewCouponName(e.target.value)}
                />
                <Input
                  placeholder="券码（可选）"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="门槛金额"
                    type="number"
                    value={newCouponThreshold}
                    onChange={(e) => setNewCouponThreshold(e.target.value)}
                  />
                  <Input
                    placeholder="减免金额"
                    type="number"
                    value={newCouponAmount}
                    onChange={(e) => setNewCouponAmount(e.target.value)}
                  />
                </div>
                <Select
                  value={newCouponScope}
                  onValueChange={(value) =>
                    setNewCouponScope(value as "all" | "product" | "service")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="适用范围" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">商品+服务</SelectItem>
                    <SelectItem value="product">仅商品</SelectItem>
                    <SelectItem value="service">仅服务</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="使用次数限制（可选）"
                  type="number"
                  value={newCouponUsageLimit}
                  onChange={(e) => setNewCouponUsageLimit(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      type="date"
                      value={newCouponStart}
                      onChange={(e) => setNewCouponStart(e.target.value)}
                      className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="relative">
                    <Input
                      type="date"
                      value={newCouponEnd}
                      onChange={(e) => setNewCouponEnd(e.target.value)}
                      className="pr-10 appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0"
                    />
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
                <Button onClick={handleAddCoupon} className="w-full">
                  添加优惠券
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
