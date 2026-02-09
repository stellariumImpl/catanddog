"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Copy, Printer } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { Button } from "../../components/ui/button";

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { orders, refunds, getProductById, getServiceById } = useData();
  const [mounted, setMounted] = useState(false);

  const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const order = useMemo(() => {
    if (!orderId) return undefined;
    return orders.find(
      (item) => item.id === orderId || item.orderNo === orderId,
    );
  }, [orderId, orders]);

  const orderRefunds = useMemo(() => {
    if (!order) return [];
    return refunds.filter((refund) => refund.orderId === order.id);
  }, [order, refunds]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = async () => {
    if (!order) return;
    const link = `${window.location.origin}/receipt/${order.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback: no-op
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen p-6 space-y-4">
          <div className="text-lg font-semibold">未找到该订单</div>
          <div className="text-sm text-gray-500">
            该凭证可能不存在或尚未同步完成。
          </div>
          <Button onClick={() => router.push("/home")}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen p-6 space-y-5">
        <div className="text-center border-b pb-4">
          <div className="text-xl font-bold">
            {user?.storeName || "老友记宠物收银系统"}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            电子凭证 · {order.orderNo || order.id}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">订单编号</span>
            <span>{order.orderNo || order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">订单时间</span>
            <span>{new Date(order.date).toLocaleString("zh-CN")}</span>
          </div>
          {order.customer && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">客户信息</span>
              <span>{order.customer.name || order.customer.phone}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">订单状态</span>
            <span className={order.status === "refunded" ? "text-red-600" : ""}>
              {order.status === "refunded" ? "已退款" : "已完成"}
            </span>
          </div>
          {order.paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">支付方式</span>
              <span>{order.paymentMethod}</span>
            </div>
          )}
          {typeof order.discountAmount === "number" &&
            order.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">优惠金额</span>
                <span>-¥{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
          {typeof order.payableTotal === "number" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">应收金额</span>
              <span>¥{order.payableTotal.toFixed(2)}</span>
            </div>
          )}
          {typeof order.paymentAmount === "number" && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">实收金额</span>
              <span>¥{order.paymentAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="border-y py-4 space-y-3">
          <div className="font-medium">项目明细</div>
          {order.items.map((item, index) => {
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

        <div className="flex justify-between items-center">
          <span className="text-lg font-medium">合计</span>
          <span className="text-2xl font-bold">¥{order.total.toFixed(2)}</span>
        </div>

        {orderRefunds.length > 0 && (
          <div className="border-t pt-3 space-y-2">
            <div className="font-medium text-sm">退款记录</div>
            {orderRefunds.map((refund) => (
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

        <div className="space-y-2 pt-4">
          <Button onClick={handleCopy} variant="outline" className="w-full">
            <Copy className="h-4 w-4 mr-2" />
            复制凭证链接
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
            className="w-full"
          >
            <Printer className="h-4 w-4 mr-2" />
            打印凭证
          </Button>
          <div className="text-center text-xs text-gray-400 pt-2">
            发送功能开发中（短信/微信）
          </div>
        </div>
      </div>
    </div>
  );
}
