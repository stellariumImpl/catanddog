"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { syncPull, syncPush } from '@/lib/sync-client';

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  price: number;
  cost?: number;
  stock: number;
  lowStockThreshold?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockInItem {
  id?: string;
  productId: string;
  quantity: number;
  cost?: number;
}

export interface StockInRecord {
  id: string;
  items: StockInItem[];
  date: string;
  note?: string;
  supplierId?: string;
  batchNo?: string;
  expiresAt?: string;
  status: 'draft' | 'confirmed';
  totalQuantity: number;
  totalCost?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: string;
  type: 'product' | 'service';
  productId?: string;
  serviceId?: string;
  name?: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNo?: string;
  items: OrderItem[];
  customer?: {
    name?: string;
    phone?: string;
  };
  customerId?: string;
  date: string;
  total: number;
  paymentMethod?: string;
  paymentAmount?: number;
  discountAmount?: number;
  discountType?: "member_rate" | "full_reduction" | "coupon";
  discountName?: string;
  discountRuleId?: string;
  discountRate?: number;
  payableTotal?: number;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  status: 'draft' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt?: string;
  updatedAt?: string;
}

export interface Receipt {
  id: string;
  orderId: string;
  createdAt: string;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: number;
  reason?: string;
  createdAt: string;
}

export type DiscountScope = "all" | "product" | "service";

export interface DiscountRule {
  id: string;
  name: string;
  scope: DiscountScope;
  threshold: number;
  amount: number;
  startAt?: string;
  endAt?: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Coupon {
  id: string;
  name: string;
  code?: string;
  scope: DiscountScope;
  threshold?: number;
  amount: number;
  startAt?: string;
  endAt?: string;
  enabled: boolean;
  usageLimit?: number;
  usedCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreSetting {
  id: string;
  memberDiscountRate: number; // 0.9 means 10% off
  paymentMethods: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StockLedger {
  id: string;
  productId: string;
  type: 'stock_in' | 'stock_out' | 'adjustment';
  quantity: number; // positive for in, negative for out
  date: string;
  relatedId?: string; // stock_in_id or order_id
  note?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  name?: string;
  phone?: string;
  balance: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerLedger {
  id: string;
  customerId: string;
  type: "recharge" | "consume" | "adjust";
  amount: number;
  balanceAfter: number;
  note?: string;
  relatedId?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  supplierId?: string;
  batchNo?: string;
  quantity: number;
  cost?: number;
  expiresAt?: string;
  receivedAt: string;
  stockInId?: string;
}

interface DataContextType {
  products: Product[];
  services: Service[];
  customers: Customer[];
  customerLedger: CustomerLedger[];
  refunds: Refund[];
  discountRules: DiscountRule[];
  coupons: Coupon[];
  storeSettings: StoreSetting;
  suppliers: Supplier[];
  inventoryBatches: InventoryBatch[];
  orders: Order[];
  stockInRecords: StockInRecord[];
  receipts: Receipt[];
  stockLedger: StockLedger[];
  
  // Product methods
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;

  // Service methods
  addService: (service: Omit<Service, 'id'>) => Service;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  getServiceById: (id: string) => Service | undefined;

  // Customer methods
  addCustomer: (
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "balance"> & {
      balance?: number;
    }
  ) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  getCustomerById: (id: string) => Customer | undefined;
  findCustomerByPhone: (phone: string) => Customer | undefined;
  recordCustomerLedger: (
    customerId: string,
    type: CustomerLedger['type'],
    amount: number,
    note?: string,
    relatedId?: string,
    customerOverride?: Customer
  ) => CustomerLedger | null;
  getCustomerLedger: (customerId: string) => CustomerLedger[];

  // Discount & coupon methods
  addDiscountRule: (rule: Omit<DiscountRule, "id" | "createdAt" | "updatedAt">) => DiscountRule;
  updateDiscountRule: (id: string, updates: Partial<DiscountRule>) => void;
  deleteDiscountRule: (id: string) => void;
  addCoupon: (coupon: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usedCount">) => Coupon;
  updateCoupon: (id: string, updates: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  incrementCouponUsage: (id: string) => void;
  updateStoreSettings: (updates: Partial<StoreSetting>) => void;

  // Supplier methods
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  getSupplierById: (id: string) => Supplier | undefined;
  
  // Stock In methods
  createStockIn: (
    items: StockInItem[],
    note?: string,
    meta?: { supplierId?: string; batchNo?: string; expiresAt?: string }
  ) => StockInRecord;
  confirmStockIn: (id: string, record?: StockInRecord) => void;
  
  // Order methods
  createOrder: (
    items: OrderItem[],
    customer?: Order['customer'],
    paymentMethod?: string,
    paymentStatus?: 'unpaid' | 'paid',
    paymentAmount?: number,
    customerId?: string,
    discountMeta?: {
      discountAmount?: number;
      discountType?: Order["discountType"];
      discountName?: string;
      discountRuleId?: string;
      discountRate?: number;
      payableTotal?: number;
    }
  ) => Order | null;
  confirmOrder: (id: string, order?: Order) => void;
  refundOrder: (id: string, amount: number, reason?: string) => void;
  
  // Receipt methods
  createReceipt: (orderId: string) => Receipt;
  getReceiptByOrderId: (orderId: string) => Receipt | undefined;
  
  // Stock Ledger methods
  getProductLedger: (productId: string) => StockLedger[];
  
  // Stats
  getTodayStats: () => {
    todayOrders: number;
    todaySales: number;
    lowStockCount: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

type Deletions = {
  products: string[];
  services: string[];
  customers: string[];
  suppliers: string[];
  discountRules: string[];
  coupons: string[];
};

type SyncSnapshot = {
  products: Product[];
  services: Service[];
  customers: Customer[];
  customerLedger: CustomerLedger[];
  refunds: Refund[];
  discountRules: DiscountRule[];
  coupons: Coupon[];
  storeSettings: StoreSetting;
  suppliers: Supplier[];
  inventoryBatches: InventoryBatch[];
  stockInRecords: StockInRecord[];
  orders: Order[];
  receipts: Receipt[];
  stockLedger: StockLedger[];
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const nowIso = () => new Date().toISOString();
  const makeId = (prefix?: string) =>
    `${prefix ? `${prefix}-` : ''}${crypto.randomUUID()}`;
  const readStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = readStorage<Product[]>("products", []);
    return loaded.map((item) => {
      const createdAt = item.createdAt || nowIso();
      return {
        ...item,
        createdAt,
        updatedAt: item.updatedAt || createdAt,
      };
    });
  });
  const [services, setServices] = useState<Service[]>(() => {
    const loaded = readStorage<Service[]>("services", []);
    return loaded.map((item) => {
      const createdAt = item.createdAt || nowIso();
      return {
        ...item,
        createdAt,
        updatedAt: item.updatedAt || createdAt,
      };
    });
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const loaded = readStorage<Customer[]>("customers", []);
    return loaded.map((item) => {
      const createdAt = item.createdAt || nowIso();
      return {
        ...item,
        createdAt,
        updatedAt: item.updatedAt || createdAt,
      };
    });
  });
  const [customerLedger, setCustomerLedger] = useState<CustomerLedger[]>(() => {
    const loaded = readStorage<CustomerLedger[]>("customerLedger", []);
    return loaded.map((item) => ({
      ...item,
      createdAt: item.createdAt || nowIso(),
    }));
  });
  const [refunds, setRefunds] = useState<Refund[]>(() => {
    const loaded = readStorage<Refund[]>("refunds", []);
    return loaded.map((item) => ({
      ...item,
      createdAt: item.createdAt || nowIso(),
    }));
  });
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>(() => {
    const loaded = readStorage<DiscountRule[]>("discountRules", []);
    return loaded.map((rule) => {
      const createdAt = rule.createdAt || nowIso();
      return {
        ...rule,
        scope: rule.scope || "all",
        enabled: rule.enabled ?? true,
        createdAt,
        updatedAt: rule.updatedAt || createdAt,
      };
    });
  });
  const [coupons, setCoupons] = useState<Coupon[]>(() => {
    const loaded = readStorage<Coupon[]>("coupons", []);
    return loaded.map((coupon) => {
      const createdAt = coupon.createdAt || nowIso();
      return {
        ...coupon,
        scope: coupon.scope || "all",
        enabled: coupon.enabled ?? true,
        usedCount: coupon.usedCount ?? 0,
        createdAt,
        updatedAt: coupon.updatedAt || createdAt,
      };
    });
  });
  const [storeSettings, setStoreSettings] = useState<StoreSetting>(() => {
    const loaded = readStorage<StoreSetting | null>("storeSettings", null);
    const createdAt = loaded?.createdAt || nowIso();
    const syncUserId =
      typeof window !== "undefined" ? localStorage.getItem("syncUserId") : null;
    const defaultPaymentMethods = ["余额", "现金", "微信", "支付宝", "银行卡"];
    return {
      id: loaded?.id || `SETTINGS-${syncUserId || "local"}`,
      memberDiscountRate:
        typeof loaded?.memberDiscountRate === "number"
          ? loaded.memberDiscountRate
          : 1,
      paymentMethods:
        Array.isArray(loaded?.paymentMethods) && loaded?.paymentMethods.length > 0
          ? loaded.paymentMethods
          : defaultPaymentMethods,
      createdAt,
      updatedAt: loaded?.updatedAt || createdAt,
    };
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const loaded = readStorage<Supplier[]>("suppliers", []);
    return loaded.map((item) => {
      const createdAt = item.createdAt || nowIso();
      return {
        ...item,
        createdAt,
        updatedAt: item.updatedAt || createdAt,
      };
    });
  });
  const [inventoryBatches, setInventoryBatches] = useState<InventoryBatch[]>(() => {
    const loaded = readStorage<InventoryBatch[]>("inventoryBatches", []);
    return loaded.map((item) => ({
      ...item,
      receivedAt: item.receivedAt || nowIso(),
    }));
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const loaded = readStorage<Order[]>("orders", []);
    return loaded.map((order) => {
      const createdAt = order.createdAt || order.date || nowIso();
      const discountAmount = order.discountAmount ?? 0;
      const payableTotal =
        typeof order.payableTotal === "number"
          ? order.payableTotal
          : Math.max(0, order.total - discountAmount);
      return {
        ...order,
        createdAt,
        updatedAt: order.updatedAt || createdAt,
        discountAmount,
        payableTotal,
        items: (order.items || []).map((item: OrderItem, index: number) => ({
          ...item,
          id: item.id || `OI-${order.id || "order"}-${index}`,
          type: item.type || "product",
        })),
      };
    });
  });
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>(() => {
    const loaded = readStorage<StockInRecord[]>("stockInRecords", []);
    return loaded.map((record) => {
      const createdAt = record.createdAt || record.date || nowIso();
      return {
        ...record,
        createdAt,
        updatedAt: record.updatedAt || createdAt,
        items: (record.items || []).map((item: StockInItem, index: number) => ({
          ...item,
          id: item.id || `SIITEM-${record.id || "stockin"}-${index}`,
        })),
      };
    });
  });
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    const loaded = readStorage<Receipt[]>("receipts", []);
    return loaded.map((receipt) => ({
      ...receipt,
      createdAt: receipt.createdAt || nowIso(),
    }));
  });
  const [stockLedger, setStockLedger] = useState<StockLedger[]>(() => {
    const loaded = readStorage<StockLedger[]>("stockLedger", []);
    return loaded.map((entry) => ({
      ...entry,
      date: entry.date || nowIso(),
    }));
  });
  const [deletions, setDeletions] = useState<Deletions>(() => {
    const loaded = readStorage<Partial<Deletions>>("deletions", {});
    return {
      products: loaded.products || [],
      services: loaded.services || [],
      customers: loaded.customers || [],
      suppliers: loaded.suppliers || [],
      discountRules: loaded.discountRules || [],
      coupons: loaded.coupons || [],
    };
  });
  const [syncToken, setSyncToken] = useState<string | null>(null);
  const snapshotRef = useRef<SyncSnapshot | null>(null);
  const syncPullInFlight = useRef(false);
  const syncPushInFlight = useRef(false);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('customerLedger', JSON.stringify(customerLedger));
  }, [customerLedger]);

  useEffect(() => {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('inventoryBatches', JSON.stringify(inventoryBatches));
  }, [inventoryBatches]);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('stockInRecords', JSON.stringify(stockInRecords));
  }, [stockInRecords]);

  useEffect(() => {
    localStorage.setItem('receipts', JSON.stringify(receipts));
  }, [receipts]);

  useEffect(() => {
    localStorage.setItem('refunds', JSON.stringify(refunds));
  }, [refunds]);

  useEffect(() => {
    localStorage.setItem('discountRules', JSON.stringify(discountRules));
  }, [discountRules]);

  useEffect(() => {
    localStorage.setItem('coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('storeSettings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  useEffect(() => {
    localStorage.setItem('stockLedger', JSON.stringify(stockLedger));
  }, [stockLedger]);

  useEffect(() => {
    localStorage.setItem('deletions', JSON.stringify(deletions));
  }, [deletions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const storedToken = localStorage.getItem('syncToken');
      setSyncToken((prev) => (prev === storedToken ? prev : storedToken));
      const storedUserId = localStorage.getItem("syncUserId");
      if (storedUserId && !storeSettings.id.includes(storedUserId)) {
        updateStoreSettings({ id: `SETTINGS-${storedUserId}` });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [storeSettings.id]);

  useEffect(() => {
    snapshotRef.current = {
      products,
      services,
      customers,
      customerLedger,
      refunds,
      discountRules,
      coupons,
      storeSettings,
      suppliers,
      inventoryBatches,
      stockInRecords,
      orders,
      receipts,
      stockLedger,
    };
  }, [
    products,
    services,
    customers,
    customerLedger,
    refunds,
    discountRules,
    coupons,
    storeSettings,
    suppliers,
    inventoryBatches,
    stockInRecords,
    orders,
    receipts,
    stockLedger,
  ]);

  const toTime = (value?: string) => {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const mergeById = <T extends { id: string }>(
    localList: T[],
    remoteList: T[],
    getUpdatedAt: (item: T) => string | undefined,
    deletedIds: Set<string>
  ) => {
    const map = new Map<string, T>();
    localList.forEach((item) => {
      if (!deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    });
    remoteList.forEach((item) => {
      if (deletedIds.has(item.id)) return;
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
        return;
      }
      if (toTime(getUpdatedAt(item)) > toTime(getUpdatedAt(existing))) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  useEffect(() => {
    if (!syncToken) return;
    const pullRemote = async () => {
      if (syncPullInFlight.current) return;
      syncPullInFlight.current = true;
      try {
        const response = await syncPull(syncToken);
        if (!response?.data) return;

      const remote = response.data;
      const deletionList = (remote.deletions || []) as Array<{
        collection: string;
        recordId: string;
      }>;

      const remoteDeletions: Deletions = {
        products: [],
        services: [],
        customers: [],
        suppliers: [],
        discountRules: [],
        coupons: [],
      };

      deletionList.forEach((item) => {
        if (item.collection in remoteDeletions) {
          remoteDeletions[item.collection as keyof Deletions].push(item.recordId);
        }
      });

      const mergedDeletions: Deletions = {
        products: Array.from(
          new Set([...deletions.products, ...remoteDeletions.products])
        ),
        services: Array.from(
          new Set([...deletions.services, ...remoteDeletions.services])
        ),
        customers: Array.from(
          new Set([...deletions.customers, ...remoteDeletions.customers])
        ),
        suppliers: Array.from(
          new Set([...deletions.suppliers, ...remoteDeletions.suppliers])
        ),
        discountRules: Array.from(
          new Set([...deletions.discountRules, ...remoteDeletions.discountRules])
        ),
        coupons: Array.from(
          new Set([...deletions.coupons, ...remoteDeletions.coupons])
        ),
      };

      const productDeleted = new Set(mergedDeletions.products);
      const serviceDeleted = new Set(mergedDeletions.services);
      const customerDeleted = new Set(mergedDeletions.customers);
      const supplierDeleted = new Set(mergedDeletions.suppliers);
      const discountRuleDeleted = new Set(mergedDeletions.discountRules);
      const couponDeleted = new Set(mergedDeletions.coupons);

      setProducts((prev) =>
        mergeById(
          prev,
          remote.products || [],
          (item) => item.updatedAt || item.createdAt,
          productDeleted
        )
      );
      setServices((prev) =>
        mergeById(
          prev,
          remote.services || [],
          (item) => item.updatedAt || item.createdAt,
          serviceDeleted
        )
      );
      setCustomers((prev) =>
        mergeById(
          prev,
          remote.customers || [],
          (item) => item.updatedAt || item.createdAt,
          customerDeleted
        )
      );
      setSuppliers((prev) =>
        mergeById(
          prev,
          remote.suppliers || [],
          (item) => item.updatedAt || item.createdAt,
          supplierDeleted
        )
      );
      setInventoryBatches((prev) =>
        mergeById(
          prev,
          remote.inventoryBatches || [],
          (item) => item.receivedAt,
          new Set()
        )
      );
      setStockInRecords((prev) =>
        mergeById(
          prev,
          remote.stockInRecords || [],
          (item) => item.updatedAt || item.date,
          new Set()
        )
      );
      setOrders((prev) =>
        mergeById(
          prev,
          remote.orders || [],
          (item) => item.updatedAt || item.date,
          new Set()
        )
      );
      setReceipts((prev) =>
        mergeById(prev, remote.receipts || [], (item) => item.createdAt, new Set())
      );
      setStockLedger((prev) =>
        mergeById(prev, remote.stockLedger || [], (item) => item.date, new Set())
      );
      setCustomerLedger((prev) =>
        mergeById(
          prev,
          remote.customerLedger || [],
          (item) => item.createdAt,
          new Set()
        )
      );
      setDiscountRules((prev) =>
        mergeById(
          prev,
          remote.discountRules || [],
          (item) => item.updatedAt || item.createdAt,
          discountRuleDeleted
        )
      );
      setCoupons((prev) =>
        mergeById(
          prev,
          remote.coupons || [],
          (item) => item.updatedAt || item.createdAt,
          couponDeleted
        )
      );
      if (remote.storeSettings) {
        setStoreSettings((prev) => {
          const remoteUpdated = toTime(remote.storeSettings.updatedAt);
          const localUpdated = toTime(prev.updatedAt);
          if (remoteUpdated > localUpdated) {
            return {
              ...prev,
              ...remote.storeSettings,
              paymentMethods:
                Array.isArray(remote.storeSettings.paymentMethods) &&
                remote.storeSettings.paymentMethods.length > 0
                  ? remote.storeSettings.paymentMethods
                  : prev.paymentMethods,
            };
          }
          return prev;
        });
      }
      setRefunds((prev) =>
        mergeById(prev, remote.refunds || [], (item) => item.createdAt, new Set())
      );
        setDeletions(mergedDeletions);
      } catch (error) {
        console.error('Sync pull failed', error);
      } finally {
        syncPullInFlight.current = false;
      }
    };

    pullRemote();
  }, [syncToken]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const token = syncToken || localStorage.getItem('syncToken');
      if (!token || !snapshotRef.current) return;
      if (syncPushInFlight.current) return;
      syncPushInFlight.current = true;
      try {
        await syncPush(token, {
          data: snapshotRef.current,
          deletions,
        });
      } catch (error) {
        console.error('Sync push failed', error);
      } finally {
        syncPushInFlight.current = false;
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [deletions, syncToken]);

  const addProduct = (product: Omit<Product, 'id'>): Product => {
    const timestamp = nowIso();
    const newProduct: Product = {
      ...product,
      id: makeId('PROD'),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...updates, updatedAt: nowIso() } : p
      )
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeletions(prev => ({
      ...prev,
      products: prev.products.includes(id) ? prev.products : [...prev.products, id],
    }));
  };

  const getProductByBarcode = (barcode: string) => {
    return products.find(p => p.barcode === barcode);
  };

  const getProductById = (id: string) => {
    return products.find(p => p.id === id);
  };

  const addService = (service: Omit<Service, 'id'>): Service => {
    const timestamp = nowIso();
    const newService: Service = {
      ...service,
      id: makeId('SERV'),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setServices(prev => [...prev, newService]);
    return newService;
  };

  const updateService = (id: string, updates: Partial<Service>) => {
    setServices(prev =>
      prev.map(service =>
        service.id === id
          ? { ...service, ...updates, updatedAt: nowIso() }
          : service
      )
    );
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(service => service.id !== id));
    setDeletions(prev => ({
      ...prev,
      services: prev.services.includes(id) ? prev.services : [...prev.services, id],
    }));
  };

  const getServiceById = (id: string) => {
    return services.find(service => service.id === id);
  };

  const addCustomer = (
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt" | "balance"> & {
      balance?: number;
    }
  ): Customer => {
    const timestamp = nowIso();
    const newCustomer: Customer = {
      ...customer,
      id: makeId('CUST'),
      balance: customer.balance ?? 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev =>
      prev.map(customer =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: nowIso() }
          : customer
      )
    );
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const findCustomerByPhone = (phone: string) => {
    return customers.find(customer => customer.phone === phone);
  };

  const recordCustomerLedger = (
    customerId: string,
    type: CustomerLedger["type"],
    amount: number,
    note?: string,
    relatedId?: string,
    customerOverride?: Customer
  ): CustomerLedger | null => {
    const target =
      customerOverride || customers.find((customer) => customer.id === customerId);
    if (!target) return null;

    const normalizedAmount =
      type === "consume"
        ? -Math.abs(amount)
        : type === "recharge"
          ? Math.abs(amount)
          : amount;
    const balanceAfter = target.balance + normalizedAmount;
    const entry: CustomerLedger = {
      id: makeId("CLEDGER"),
      customerId,
      type,
      amount: normalizedAmount,
      balanceAfter,
      note,
      relatedId,
      createdAt: nowIso(),
    };

    setCustomers((prev) => {
      const exists = prev.some((customer) => customer.id === customerId);
      if (!exists) {
        return [
          ...prev,
          {
            ...target,
            balance: balanceAfter,
            updatedAt: nowIso(),
          },
        ];
      }
      return prev.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              balance: balanceAfter,
              updatedAt: nowIso(),
            }
          : customer
      );
    });
    setCustomerLedger((prev) => [entry, ...prev]);
    return entry;
  };

  const getCustomerLedger = (customerId: string) => {
    return customerLedger
      .filter((item) => item.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const addDiscountRule = (
    rule: Omit<DiscountRule, "id" | "createdAt" | "updatedAt">
  ): DiscountRule => {
    const timestamp = nowIso();
    const newRule: DiscountRule = {
      ...rule,
      id: makeId("DR"),
      enabled: rule.enabled ?? true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setDiscountRules((prev) => [...prev, newRule]);
    return newRule;
  };

  const updateDiscountRule = (id: string, updates: Partial<DiscountRule>) => {
    setDiscountRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, ...updates, updatedAt: nowIso() } : rule
      )
    );
  };

  const deleteDiscountRule = (id: string) => {
    setDiscountRules((prev) => prev.filter((rule) => rule.id !== id));
    setDeletions((prev) => ({
      ...prev,
      discountRules: prev.discountRules.includes(id)
        ? prev.discountRules
        : [...prev.discountRules, id],
    }));
  };

  const addCoupon = (
    coupon: Omit<Coupon, "id" | "createdAt" | "updatedAt" | "usedCount">
  ): Coupon => {
    const timestamp = nowIso();
    const newCoupon: Coupon = {
      ...coupon,
      id: makeId("CPN"),
      enabled: coupon.enabled ?? true,
      usedCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setCoupons((prev) => [...prev, newCoupon]);
    return newCoupon;
  };

  const updateCoupon = (id: string, updates: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === id ? { ...coupon, ...updates, updatedAt: nowIso() } : coupon
      )
    );
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== id));
    setDeletions((prev) => ({
      ...prev,
      coupons: prev.coupons.includes(id) ? prev.coupons : [...prev.coupons, id],
    }));
  };

  const incrementCouponUsage = (id: string) => {
    setCoupons((prev) =>
      prev.map((coupon) =>
        coupon.id === id
          ? {
              ...coupon,
              usedCount: (coupon.usedCount || 0) + 1,
              updatedAt: nowIso(),
            }
          : coupon
      )
    );
  };

  const updateStoreSettings = (updates: Partial<StoreSetting>) => {
    setStoreSettings((prev) => ({
      ...prev,
      ...updates,
      paymentMethods:
        updates.paymentMethods && updates.paymentMethods.length > 0
          ? updates.paymentMethods
          : prev.paymentMethods,
      updatedAt: nowIso(),
    }));
  };

  const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
    const timestamp = nowIso();
    const newSupplier: Supplier = {
      ...supplier,
      id: makeId('SUP'),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev =>
      prev.map(supplier =>
        supplier.id === id
          ? { ...supplier, ...updates, updatedAt: nowIso() }
          : supplier
      )
    );
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
    setDeletions(prev => ({
      ...prev,
      suppliers: prev.suppliers.includes(id) ? prev.suppliers : [...prev.suppliers, id],
    }));
  };

  const getSupplierById = (id: string) => {
    return suppliers.find(supplier => supplier.id === id);
  };

  const createStockIn = (
    items: StockInItem[],
    note?: string,
    meta?: { supplierId?: string; batchNo?: string; expiresAt?: string }
  ): StockInRecord => {
    const timestamp = nowIso();
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
    const normalizedItems = items.map((item) => ({
      ...item,
      id: item.id || makeId('SIITEM'),
    }));

    const newRecord: StockInRecord = {
      id: makeId('SI'),
      items: normalizedItems,
      date: timestamp,
      note,
      supplierId: meta?.supplierId,
      batchNo: meta?.batchNo,
      expiresAt: meta?.expiresAt,
      status: 'draft',
      totalQuantity,
      totalCost: totalCost > 0 ? totalCost : undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setStockInRecords(prev => [...prev, newRecord]);
    return newRecord;
  };

  const confirmStockIn = (id: string, recordOverride?: StockInRecord) => {
    const record = recordOverride || stockInRecords.find(r => r.id === id);
    if (!record) return;

    // Update stock
    const updatedProducts = [...products];
    record.items.forEach(item => {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock += item.quantity;
        updatedProducts[productIndex].updatedAt = nowIso();
      }
    });
    setProducts(updatedProducts);

    // Add to ledger
    const newLedgerEntries: StockLedger[] = record.items.map(item => ({
      id: makeId('LEDGER'),
      productId: item.productId,
      type: 'stock_in',
      quantity: item.quantity,
      date: nowIso(),
      relatedId: id,
    }));
    setStockLedger(prev => [...prev, ...newLedgerEntries]);

    const newBatches: InventoryBatch[] = record.items.map((item) => ({
      id: makeId('BATCH'),
      productId: item.productId,
      supplierId: record.supplierId,
      batchNo: record.batchNo,
      quantity: item.quantity,
      cost: item.cost,
      expiresAt: record.expiresAt,
      receivedAt: nowIso(),
      stockInId: id,
    }));
    setInventoryBatches(prev => [...prev, ...newBatches]);

    // Update record status
    setStockInRecords(prev => {
      const hasRecord = prev.some(r => r.id === id);
      const base = hasRecord || !recordOverride ? prev : [...prev, recordOverride];
      return base.map(r =>
        r.id === id
          ? { ...r, status: 'confirmed' as const, updatedAt: nowIso() }
          : r
      );
    });
  };

  const createOrder = (
    items: OrderItem[],
    customer?: Order['customer'],
    paymentMethod?: string,
    paymentStatus: 'unpaid' | 'paid' = 'paid',
    paymentAmount?: number,
    customerId?: string,
    discountMeta?: {
      discountAmount?: number;
      discountType?: Order["discountType"];
      discountName?: string;
      discountRuleId?: string;
      discountRate?: number;
      payableTotal?: number;
    }
  ): Order | null => {
    const timestamp = nowIso();
    const now = new Date();
    const uniq = crypto.randomUUID().split("-")[0].toUpperCase();
    const orderNo = `SO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate()
    ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
      now.getMinutes()
    ).padStart(2, "0")}${uniq}`;
    // Check stock availability
    for (const item of items) {
      if (item.type !== 'product') {
        continue;
      }
      const productId = item.productId;
      if (!productId) {
        return null;
      }
      const product = getProductById(productId);
      if (!product || product.stock < item.quantity) {
        return null;
      }
    }

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = Math.max(0, discountMeta?.discountAmount ?? 0);
    const payableTotal =
      typeof discountMeta?.payableTotal === "number"
        ? discountMeta.payableTotal
        : Math.max(0, total - discountAmount);
    const normalizedItems = items.map((item, index) => ({
      ...item,
      id: item.id || `OI-${makeId()}-${index}`,
    }));

    const newOrder: Order = {
      id: `ORD-${makeId()}`,
      orderNo,
      items: normalizedItems,
      customer,
      customerId,
      date: timestamp,
      total,
      paymentMethod,
      paymentAmount,
      discountAmount,
      discountType: discountMeta?.discountType,
      discountName: discountMeta?.discountName,
      discountRuleId: discountMeta?.discountRuleId,
      discountRate: discountMeta?.discountRate,
      payableTotal,
      paymentStatus,
      status: 'draft',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const confirmOrder = (id: string, orderOverride?: Order) => {
    const order = orderOverride || orders.find(o => o.id === id);
    if (!order) return;
    if (order.status === 'confirmed' || order.status === 'refunded') return;

    // Deduct stock
    const updatedProducts = [...products];
    order.items.forEach(item => {
      if (item.type !== 'product') return;
      const productId = item.productId;
      if (!productId) return;
      const productIndex = updatedProducts.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock -= item.quantity;
        updatedProducts[productIndex].updatedAt = nowIso();
      }
    });
    setProducts(updatedProducts);

    // Add to ledger
    const newLedgerEntries: StockLedger[] = order.items
      .filter(item => item.type === 'product' && item.productId)
      .map((item) => ({
        id: makeId('LEDGER'),
        productId: item.productId as string,
        type: 'stock_out',
        quantity: -item.quantity,
        date: nowIso(),
        relatedId: id,
      }));
    setStockLedger(prev => [...prev, ...newLedgerEntries]);

    // Update order status (ensure order exists in state)
    setOrders(prev => {
      const exists = prev.some(o => o.id === id);
      const base = exists || !orderOverride ? prev : [...prev, orderOverride];
      return base.map(o =>
        o.id === id
          ? { ...o, status: 'confirmed' as const, updatedAt: nowIso() }
          : o
      );
    });

    // Create receipt
    createReceipt(id);
  };

  const refundOrder = (id: string, amount: number, reason?: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    if (order.status === 'refunded' || order.paymentStatus === 'refunded') return;

    const maxAmount =
      typeof order.paymentAmount === 'number'
        ? order.paymentAmount
        : typeof order.payableTotal === 'number'
          ? order.payableTotal
          : order.total;
    const normalizedAmount = Math.min(Math.max(amount, 0), maxAmount);
    if (normalizedAmount <= 0) return;

    const timestamp = nowIso();
    const refund: Refund = {
      id: makeId('REF'),
      orderId: order.id,
      amount: normalizedAmount,
      reason,
      createdAt: timestamp,
    };

    setRefunds((prev) => [refund, ...prev]);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: 'refunded' as const,
              paymentStatus: 'refunded' as const,
              updatedAt: timestamp,
            }
          : o
      )
    );

    const updatedProducts = [...products];
    const restockEntries: StockLedger[] = [];
    order.items.forEach((item) => {
      if (item.type !== 'product' || !item.productId) return;
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex].stock += item.quantity;
        updatedProducts[productIndex].updatedAt = nowIso();
        restockEntries.push({
          id: makeId('LEDGER'),
          productId: item.productId,
          type: 'adjustment',
          quantity: item.quantity,
          date: timestamp,
          relatedId: id,
          note: '订单退款回库',
        });
      }
    });
    if (restockEntries.length > 0) {
      setProducts(updatedProducts);
      setStockLedger((prev) => [...prev, ...restockEntries]);
    }

    if (order.paymentMethod === '余额' && order.customerId) {
      recordCustomerLedger(
        order.customerId,
        'adjust',
        normalizedAmount,
        reason ? `订单退款：${reason}` : `订单退款 · ${order.orderNo || order.id}`,
        order.id
      );
    }
  };

  const createReceipt = (orderId: string): Receipt => {
    const newReceipt: Receipt = {
      id: `RCP-${makeId()}`,
      orderId,
      createdAt: nowIso(),
    };
    setReceipts(prev => [...prev, newReceipt]);
    return newReceipt;
  };

  const getReceiptByOrderId = (orderId: string) => {
    return receipts.find(r => r.orderId === orderId);
  };

  const getProductLedger = (productId: string) => {
    return stockLedger
      .filter(l => l.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(
      o => new Date(o.date).toDateString() === today && o.status === 'confirmed'
    );
    const todaySales = todayOrders.reduce((sum, o) => {
      const paid =
        typeof o.paymentAmount === "number"
          ? o.paymentAmount
          : typeof o.payableTotal === "number"
            ? o.payableTotal
            : o.total;
      return sum + paid;
    }, 0);
    const lowStockCount = products.filter(
      p => p.lowStockThreshold && p.stock <= p.lowStockThreshold
    ).length;

    return {
      todayOrders: todayOrders.length,
      todaySales,
      lowStockCount,
    };
  };

  return (
    <DataContext.Provider
      value={{
        products,
        services,
        customers,
        customerLedger,
        refunds,
        discountRules,
        coupons,
        storeSettings,
        suppliers,
        inventoryBatches,
        orders,
        stockInRecords,
        receipts,
        stockLedger,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductByBarcode,
        getProductById,
        addService,
        updateService,
        deleteService,
        getServiceById,
        addCustomer,
        updateCustomer,
        getCustomerById,
        findCustomerByPhone,
        recordCustomerLedger,
        getCustomerLedger,
        addDiscountRule,
        updateDiscountRule,
        deleteDiscountRule,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        incrementCouponUsage,
        updateStoreSettings,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getSupplierById,
        createStockIn,
        confirmStockIn,
        createOrder,
        confirmOrder,
        refundOrder,
        createReceipt,
        getReceiptByOrderId,
        getProductLedger,
        getTodayStats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
