"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, Barcode, Trash2, Plus, Minus, ShoppingCart, User, CreditCard, Banknote, Smartphone, Wifi, WifiOff, RefreshCw, Printer, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { formatCurrency, generateReceiptNumber } from "@/lib/utils";
import { CartItem, OfflineSale } from "@/lib/types";
import { saveOfflineSale, getUnsynced, markAsSynced, cacheProducts, getCachedProducts } from "@/lib/offline-db";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  retailPrice: number;
  wholesalePrice?: number;
  category?: { name: string };
  unit?: { abbreviation: string };
  inventories?: { quantity: number }[];
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: string;
  loyaltyPoints: number;
  totalDebt: number;
}

export default function POSPage() {
  const sessionData = useSession(); const session = sessionData?.data;
  const isOnline = useOnlineStatus();

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, parseFloat(amountPaid || "0") - total);
  const debtAmount = paymentMethod === "CREDIT" ? total : Math.max(0, total - parseFloat(amountPaid || "0"));

  // Load products
  useEffect(() => {
    loadProducts();
    if (session?.user?.tenantId) {
      loadOfflineCount();
    }
    searchRef.current?.focus();
  }, [session]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && offlineCount > 0) {
      syncOfflineSales();
    }
  }, [isOnline]);

  // Offline warning
  useEffect(() => {
    if (!isOnline) {
      toast("You are offline. Sales will be saved locally.", { icon: "📴" });
    }
  }, [isOnline]);

  async function loadProducts() {
    try {
      if (isOnline) {
        const res = await fetch(`/api/products?limit=500&storeId=${session?.user?.storeId}`);
        const data = await res.json();
        const prods = data.products || [];
        setProducts(prods);
        setFilteredProducts(prods);
        // Cache for offline
        if (session?.user?.tenantId && session?.user?.storeId) {
          await cacheProducts(prods.map((p: Product) => ({
            id: p.id,
            tenantId: session.user.tenantId!,
            storeId: session.user.storeId!,
            name: p.name,
            barcode: p.barcode,
            sku: p.sku,
            retailPrice: p.retailPrice,
            wholesalePrice: p.wholesalePrice,
            stock: p.inventories?.[0]?.quantity ?? 0,
            categoryName: p.category?.name,
            unitName: p.unit?.abbreviation,
          })));
        }
      } else {
        // Load from IndexedDB
        const cached = await getCachedProducts(session?.user?.tenantId || "");
        const prods = cached.map(p => ({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          sku: p.sku,
          retailPrice: p.retailPrice,
          wholesalePrice: p.wholesalePrice,
          inventories: [{ quantity: p.stock }],
        }));
        setProducts(prods);
        setFilteredProducts(prods);
      }
    } catch (err) {
      toast.error("Failed to load products");
    }
  }

  async function loadOfflineCount() {
    const unsynced = await getUnsynced(session?.user?.tenantId || "");
    setOfflineCount(unsynced.length);
  }

  async function syncOfflineSales() {
    if (!isOnline || !session?.user?.tenantId) return;
    setSyncing(true);
    try {
      const unsynced = await getUnsynced(session.user.tenantId);
      if (unsynced.length === 0) { setSyncing(false); return; }
      const res = await fetch("/api/sales/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: unsynced }),
      });
      const { results } = await res.json();
      let synced = 0;
      for (const result of results) {
        if (result.status === "synced" || result.status === "duplicate") {
          await markAsSynced(result.offlineId);
          synced++;
        }
      }
      toast.success(`Synced ${synced} offline sale(s)`);
      setOfflineCount(0);
    } catch {
      toast.error("Sync failed, will retry when online");
    }
    setSyncing(false);
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setFilteredProducts(products); return; }
    const lower = q.toLowerCase();
    setFilteredProducts(products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.barcode?.includes(q) ||
      p.sku?.toLowerCase().includes(lower)
    ));
  }

  function handleBarcodeSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && searchQuery.trim()) {
      const product = products.find(p => p.barcode === searchQuery.trim() || p.sku === searchQuery.trim());
      if (product) {
        addToCart(product);
        setSearchQuery("");
        setFilteredProducts(products);
      }
    }
  }

  function addToCart(product: Product) {
    const useWholesale = customer?.type === "WHOLESALE" && product.wholesalePrice;
    const price = useWholesale ? product.wholesalePrice! : product.retailPrice;
    const stock = product.inventories?.[0]?.quantity ?? 999;
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= stock) { toast.error("Not enough stock"); return prev; }
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice - i.discount }
          : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        total: price,
        stock,
      }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.stock) { toast.error("Not enough stock"); return item; }
      return { ...item, quantity: newQty, total: newQty * item.unitPrice - item.discount };
    }));
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  async function searchCustomers(q: string) {
    setCustomerSearch(q);
    if (!q.trim()) { setShowCustomerDropdown(false); return; }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setShowCustomerDropdown(true);
    } catch {}
  }

  async function completeSale() {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (paymentMethod !== "CREDIT" && parseFloat(amountPaid || "0") < total && paymentMethod !== "MOBILE_MONEY" && paymentMethod !== "BANK_TRANSFER") {
      toast.error("Insufficient payment amount"); return;
    }
    setProcessing(true);
    try {
      const saleData = {
        storeId: session?.user?.storeId,
        customerId: customer?.id || null,
        items: cart.map(i => ({
          productId: i.productId,
          name: i.name,
          barcode: i.barcode,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          total: i.total,
        })),
        subtotal,
        discount,
        tax: 0,
        total,
        amountPaid: paymentMethod === "CREDIT" ? 0 : parseFloat(amountPaid || total.toString()),
        change,
        debtAmount,
        paymentMethod,
        offlineId: !isOnline ? `offline-${Date.now()}-${Math.random().toString(36).slice(2)}` : undefined,
        createdAt: new Date().toISOString(),
      };

      if (isOnline) {
        const res = await fetch("/api/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLastReceipt({ ...data.sale, items: cart, customer, cashier: session?.user?.name });
      } else {
        // Save offline
        const generatedOfflineId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const offlineSale: OfflineSale = {
          ...saleData,
          offlineId: generatedOfflineId,
          tenantId: (session?.user as any)?.tenantId as string,
          storeId: (session?.user as any)?.storeId as string,
          userId: session?.user?.id as string,
          customerId: customer?.id,
          receiptNumber: generateReceiptNumber(),
          synced: false,
        };
        await saveOfflineSale(offlineSale);
        setOfflineCount(c => c + 1);
        setLastReceipt({ receiptNumber: offlineSale.receiptNumber, items: cart, customer, total, cashier: session?.user?.name, offline: true });
        toast("Sale saved offline", { icon: "💾" });
      }

      setShowReceipt(true);
      setCart([]);
      setCustomer(null);
      setCustomerSearch("");
      setAmountPaid("");
      setDiscount(0);
      setShowPaymentModal(false);
      searchRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message || "Sale failed");
    }
    setProcessing(false);
  }

  const paymentMethods = [
    { value: "CASH", label: "Cash", icon: Banknote },
    { value: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
    { value: "BANK_TRANSFER", label: "Bank", icon: CreditCard },
    { value: "CREDIT", label: "Credit", icon: User },
  ];

  return (
    <div className="flex h-[calc(100vh-56px)] bg-gray-50">
      {/* Left: Products Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={handleBarcodeSearch}
                placeholder="Search by name, barcode or SKU… (press Enter for barcode)"
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium border ${isOnline ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? "Online" : "Offline"}
            </div>
            {offlineCount > 0 && (
              <button onClick={syncOfflineSales} disabled={!isOnline || syncing}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing…" : `Sync (${offlineCount})`}
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => {
              const stock = product.inventories?.[0]?.quantity ?? 0;
              const useWholesale = customer?.type === "WHOLESALE" && product.wholesalePrice;
              const price = useWholesale ? product.wholesalePrice! : product.retailPrice;
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={stock <= 0}
                  className={`bg-white border rounded-xl p-3 text-left hover:border-blue-400 hover:shadow-md transition-all active:scale-95 ${stock <= 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div className="w-full h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg mb-2 flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{product.name}</p>
                  <p className="text-sm font-bold text-blue-600 mt-1">{formatCurrency(price, "TZS")}</p>
                  <p className={`text-xs mt-0.5 ${stock <= 5 ? "text-red-500" : "text-gray-400"}`}>Stock: {stock}</p>
                </button>
              );
            })}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart Panel */}
      <div className="w-96 flex flex-col bg-white border-l shadow-lg">
        {/* Cart Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Cart
            {cart.length > 0 && <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>}
          </h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Customer Select */}
        <div className="px-4 py-2 border-b relative">
          <div className="relative">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={customer ? customer.name : customerSearch}
              onChange={e => { setCustomer(null); searchCustomers(e.target.value); }}
              placeholder="Search customer (optional)"
              className="w-full pl-8 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {customer && (
              <button onClick={() => { setCustomer(null); setCustomerSearch(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {customer && (
            <div className="mt-1 text-xs text-gray-500 flex gap-2">
              <span className={`px-2 py-0.5 rounded-full font-medium ${customer.type === "WHOLESALE" ? "bg-purple-100 text-purple-700" : customer.type === "VIP" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{customer.type}</span>
              <span>⭐ {customer.loyaltyPoints} pts</span>
              {customer.totalDebt > 0 && <span className="text-red-500">Debt: {formatCurrency(customer.totalDebt, "TZS")}</span>}
            </div>
          )}
          {showCustomerDropdown && customers.length > 0 && (
            <div className="absolute left-4 right-4 top-12 bg-white border rounded-lg shadow-xl z-10 overflow-hidden">
              {customers.map(c => (
                <button key={c.id} onClick={() => { setCustomer(c); setShowCustomerDropdown(false); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm border-b last:border-0"
                >
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.phone} · {c.type}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300">
              <ShoppingCart className="w-16 h-16 mb-3" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">Click products or scan barcode</p>
            </div>
          ) : (
            <div className="divide-y">
              {cart.map(item => (
                <div key={item.productId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-800 flex-1 leading-tight">{item.name}</p>
                    <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-100">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatCurrency(item.unitPrice, "TZS")} × {item.quantity}</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(item.total, "TZS")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div className="border-t bg-gray-50 p-4 space-y-3">
          {/* Discount */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 w-20 flex-shrink-0">Discount</label>
            <input
              type="number" min="0" max={subtotal} value={discount || ""}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="flex-1 px-3 py-1.5 border rounded-lg text-sm text-right focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal, "TZS")}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- {formatCurrency(discount, "TZS")}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-gray-900 pt-1 border-t">
              <span>Total</span>
              <span>{formatCurrency(total, "TZS")}</span>
            </div>
          </div>

          <button
            onClick={() => setShowPaymentModal(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors text-base"
          >
            Charge {formatCurrency(total, "TZS")}
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Complete Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Amount Due */}
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">Amount Due</p>
                <p className="text-3xl font-bold text-blue-700">{formatCurrency(total, "TZS")}</p>
                {customer && <p className="text-sm text-blue-500 mt-1">Customer: {customer.name}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                <div className="grid grid-cols-4 gap-2">
                  {paymentMethods.map(pm => {
                    const Icon = pm.icon;
                    return (
                      <button key={pm.value} onClick={() => setPaymentMethod(pm.value as any)}
                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-medium transition-all ${paymentMethod === pm.value ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                      >
                        <Icon className="w-5 h-5" />
                        {pm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Paid */}
              {paymentMethod !== "CREDIT" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Amount Paid</label>
                  <input
                    type="number" value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder={total.toString()}
                    className="w-full mt-1 px-4 py-3 border-2 rounded-xl text-lg text-right font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  {/* Quick amounts */}
                  <div className="flex gap-2 mt-2">
                    {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
                      .filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 4).map(amt => (
                        <button key={amt} onClick={() => setAmountPaid(amt.toString())}
                          className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium"
                        >
                          {formatCurrency(amt, "TZS")}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Change */}
              {paymentMethod !== "CREDIT" && parseFloat(amountPaid || "0") > 0 && (
                <div className={`flex justify-between px-4 py-3 rounded-xl text-sm font-bold ${change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  <span>{change >= 0 ? "Change" : "Balance Due"}</span>
                  <span>{formatCurrency(Math.abs(change), "TZS")}</span>
                </div>
              )}

              {paymentMethod === "CREDIT" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  ⚠️ Full amount of {formatCurrency(total, "TZS")} will be added to customer debt.
                  {!customer && " Please select a customer."}
                </div>
              )}
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 rounded-xl border font-medium text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={completeSale}
                disabled={processing || (paymentMethod === "CREDIT" && !customer)}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold transition-colors"
              >
                {processing ? "Processing…" : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-bold text-green-600">✓ Sale Complete!</h3>
              <button onClick={() => setShowReceipt(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id="receipt-content" className="p-5 font-mono text-xs">
              <p className="text-center font-bold text-base mb-1">RECEIPT</p>
              <p className="text-center text-gray-500 mb-1">{lastReceipt.offline ? "⚠ Offline Sale" : "✓ Online Sale"}</p>
              <p className="text-center mb-3">{lastReceipt.receiptNumber}</p>
              <div className="border-t border-dashed pt-2 mb-2">
                {lastReceipt.items?.map((item: CartItem) => (
                  <div key={item.productId} className="flex justify-between mb-1">
                    <span className="flex-1 truncate">{item.name} x{item.quantity}</span>
                    <span className="ml-2">{formatCurrency(item.total, "TZS")}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed pt-2 space-y-0.5">
                {lastReceipt.discount > 0 && (
                  <div className="flex justify-between"><span>Discount</span><span>-{formatCurrency(lastReceipt.discount, "TZS")}</span></div>
                )}
                <div className="flex justify-between font-bold"><span>TOTAL</span><span>{formatCurrency(lastReceipt.total, "TZS")}</span></div>
              </div>
              {lastReceipt.customer && (
                <p className="mt-2 text-center text-gray-500">Customer: {lastReceipt.customer.name}</p>
              )}
              <p className="text-center text-gray-400 mt-3">Thank you for shopping!</p>
            </div>
            <div className="p-4 flex gap-2 border-t">
              <button onClick={() => { window.print(); }} className="flex-1 py-2.5 rounded-xl border font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-50">
                <Printer className="w-4 h-4" /> Print
              </button>
              <button onClick={() => setShowReceipt(false)} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700">
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
