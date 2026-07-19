"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
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
  const sessionData = useSession();
  const session = sessionData?.data;
  const isOnline = useOnlineStatus();

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerManual, setCustomerManual] = useState("");
  const [customerMode, setCustomerMode] = useState<"none" | "search" | "manual">("none");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CREDIT">("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const productSearchRef = useRef<HTMLInputElement>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, parseFloat(amountPaid || "0") - total);
  const debtAmount = paymentMethod === "CREDIT" ? total : Math.max(0, total - parseFloat(amountPaid || "0"));

  useEffect(() => {
    if (!session?.user) return;
    loadProducts();
    loadOfflineCount();
    productSearchRef.current?.focus();
  }, [session]);

  useEffect(() => {
    if (isOnline && offlineCount > 0) syncOfflineSales();
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline) toast("Uko nje ya mtandao. Mauzo yatahifadhiwa ndani.", { icon: "📴" });
  }, [isOnline]);

  async function loadProducts() {
    try {
      if (isOnline) {
        const res = await fetch(`/api/products?limit=500&storeId=${session?.user?.storeId}`);
        const data = await res.json();
        const prods = data.products || [];
        setProducts(prods);
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
        const cached = await getCachedProducts(session?.user?.tenantId || "");
        setProducts(cached.map(p => ({
          id: p.id, name: p.name, barcode: p.barcode, sku: p.sku,
          retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice,
          inventories: [{ quantity: p.stock }],
        })));
      }
    } catch { toast.error("Imeshindwa kupakia bidhaa"); }
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
      const res = await fetch("/api/sales/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sales: unsynced }) });
      const { results } = await res.json();
      let synced = 0;
      for (const r of results) {
        if (r.status === "synced" || r.status === "duplicate") { await markAsSynced(r.offlineId); synced++; }
      }
      toast.success(`Imeunganisha mauzo ${synced}`);
      setOfflineCount(0);
    } catch { toast.error("Sync imeshindwa, itajaribu tena"); }
    setSyncing(false);
  }

  function handleProductSearch(q: string) {
    setProductSearch(q);
    if (!q.trim()) { setFilteredProducts([]); setShowProductDropdown(false); return; }
    const lower = q.toLowerCase();
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.barcode?.includes(q) ||
      p.sku?.toLowerCase().includes(lower)
    ).slice(0, 12);
    setFilteredProducts(matches);
    setShowProductDropdown(true);
  }

  function handleProductKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && productSearch.trim()) {
      const p = products.find(x => x.barcode === productSearch.trim() || x.sku === productSearch.trim());
      if (p) { addToCart(p); setProductSearch(""); setShowProductDropdown(false); }
    }
    if (e.key === "Escape") setShowProductDropdown(false);
  }

  function addToCart(product: Product) {
    const useWholesale = customer?.type === "WHOLESALE" && product.wholesalePrice;
    const price = useWholesale ? product.wholesalePrice! : product.retailPrice;
    const stock = product.inventories?.[0]?.quantity ?? 0;
    if (stock === 0) toast("⚠️ Bidhaa hii haina hifadhi", { icon: "⚠️" });
    setCart(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= stock && stock > 0) { toast.error("Hifadhi haitoshi"); return prev; }
        return prev.map(i => i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice - i.discount }
          : i);
      }
      return [...prev, { productId: product.id, name: product.name, barcode: product.barcode, quantity: 1, unitPrice: price, discount: 0, total: price, stock }];
    });
    setProductSearch("");
    setShowProductDropdown(false);
    productSearchRef.current?.focus();
  }

  function updateQty(productId: string, delta: number) {
    setCart(prev => prev.map(item => {
      if (item.productId !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.stock) { toast.error("Hifadhi haitoshi"); return item; }
      return { ...item, quantity: newQty, total: newQty * item.unitPrice - item.discount };
    }));
  }

  function removeFromCart(productId: string) {
    setCart(prev => prev.filter(i => i.productId !== productId));
  }

  async function searchCustomers(q: string) {
    setCustomerSearch(q);
    setCustomer(null);
    if (!q.trim()) { setShowCustomerDropdown(false); return; }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setShowCustomerDropdown(true);
    } catch {}
  }

  async function completeSale() {
    if (cart.length === 0) { toast.error("Mkoba uko tupu"); return; }
    if (paymentMethod !== "CREDIT" && paymentMethod !== "MOBILE_MONEY" && paymentMethod !== "BANK_TRANSFER") {
      if (parseFloat(amountPaid || "0") < total) { toast.error("Kiasi hakitoshi"); return; }
    }
    setProcessing(true);
    const customerName = customer?.name || (customerMode === "manual" ? customerManual.trim() : undefined);
    try {
      const saleData = {
        storeId: session?.user?.storeId,
        customerId: customer?.id || null,
        customerName: !customer?.id ? customerName : undefined,
        note: note.trim() || undefined,
        items: cart.map(i => ({ productId: i.productId, name: i.name, barcode: i.barcode, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, total: i.total })),
        subtotal, discount, tax: 0, total,
        amountPaid: paymentMethod === "CREDIT" ? 0 : parseFloat(amountPaid || total.toString()),
        change, debtAmount, paymentMethod,
        offlineId: !isOnline ? `offline-${Date.now()}-${Math.random().toString(36).slice(2)}` : undefined,
        createdAt: new Date().toISOString(),
      };

      if (isOnline) {
        const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saleData) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLastReceipt({ ...data.sale, items: cart, customer, customerName, cashier: session?.user?.name });
      } else {
        const offlineId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const offlineSale: OfflineSale = {
          ...saleData, offlineId,
          tenantId: (session?.user as any)?.tenantId as string,
          storeId: (session?.user as any)?.storeId as string,
          userId: session?.user?.id as string,
          customerId: customer?.id,
          receiptNumber: generateReceiptNumber(),
          synced: false,
        };
        await saveOfflineSale(offlineSale);
        setOfflineCount(c => c + 1);
        setLastReceipt({ receiptNumber: offlineSale.receiptNumber, items: cart, customer, customerName, total, cashier: session?.user?.name, offline: true });
        toast("Mauzo yamehifadhiwa nje ya mtandao", { icon: "💾" });
      }

      setShowReceipt(true);
      setCart([]); setCustomer(null); setCustomerSearch(""); setCustomerManual(""); setCustomerMode("none");
      setAmountPaid(""); setDiscount(0); setNote(""); setShowPaymentModal(false);
      productSearchRef.current?.focus();
    } catch (err: any) { toast.error(err.message || "Mauzo yameshindwa"); }
    setProcessing(false);
  }

  const S: Record<string, React.CSSProperties> = {
    wrap:       { display: "flex", height: "calc(100vh - 60px)", background: "#f3f4f6", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" },
    left:       { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflowY: "auto", padding: 20, gap: 16 },
    right:      { width: 380, display: "flex", flexDirection: "column", background: "#fff", borderLeft: "1px solid #e5e7eb", boxShadow: "-2px 0 8px rgba(0,0,0,0.04)" },
    topBar:     { display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "10px 14px" },
    card:       { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" },
    label:      { fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, display: "block" },
    input:      { width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" as const },
    cartHdr:    { padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" },
    cartTitle:  { fontWeight: 800, fontSize: 15, color: "#111", display: "flex", alignItems: "center", gap: 8 },
    cartBadge:  { background: "#2563eb", color: "#fff", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
    cartList:   { flex: 1, overflowY: "auto" as const },
    cartItem:   { padding: "10px 16px", borderBottom: "1px solid #f3f4f6" },
    qtyBtn:     { width: 26, height: 26, borderRadius: "50%", border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 },
    cartFooter: { borderTop: "1px solid #e5e7eb", background: "#f9fafb", padding: 16 },
    totRow:     { display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 },
    totFinal:   { display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#111", paddingTop: 8, borderTop: "1px solid #e5e7eb", marginBottom: 14 },
    overlay:    { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
    modal:      { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" as const },
    modalHdr:   { padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, background: "#fff", zIndex: 1 },
    closeBtn:   { background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af", lineHeight: 1 },
    modalBody:  { padding: 20 },
    pmGrid:     { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 },
    qkGrid:     { display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" as const },
    qkBtn:      { padding: "7px 10px", background: "#f3f4f6", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" },
    modalFtr:   { padding: "14px 20px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 10 },
    cancelBtn:  { flex: 1, padding: "11px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", color: "#374151" },
    receiptMdl: { background: "#fff", borderRadius: 20, width: "100%", maxWidth: 360, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" },
    receiptBody: { padding: 20, fontFamily: "monospace", fontSize: 12 },
    dropdown:   { position: "absolute" as const, left: 0, right: 0, top: "100%", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 20, maxHeight: 280, overflowY: "auto" as const },
    dropRow:    { width: "100%", textAlign: "left" as const, padding: "10px 14px", fontSize: 13, background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid #f3f4f6", display: "block" },
  };

  const dynS = {
    statusBadge: (online: boolean): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, padding: "6px 10px", borderRadius: 8, border: `1px solid ${online ? "#bbf7d0" : "#fecaca"}`, background: online ? "#f0fdf4" : "#fef2f2", color: online ? "#16a34a" : "#dc2626" }),
    chargeBtn:   (empty: boolean): React.CSSProperties => ({ width: "100%", background: empty ? "#d1d5db" : "#2563eb", color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 15, fontWeight: 800, cursor: empty ? "not-allowed" : "pointer" }),
    pmBtn:       (active: boolean): React.CSSProperties => ({ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 4px", borderRadius: 12, border: `2px solid ${active ? "#2563eb" : "#e5e7eb"}`, background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#6b7280", cursor: "pointer", fontSize: 11, fontWeight: 600 }),
    changePill:  (pos: boolean): React.CSSProperties => ({ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: pos ? "#f0fdf4" : "#fef2f2", color: pos ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 13, marginTop: 8 }),
    confirmBtn:  (dis: boolean): React.CSSProperties => ({ flex: 1, padding: "11px 0", borderRadius: 12, border: "none", background: dis ? "#d1d5db" : "#2563eb", color: "#fff", fontSize: 14, fontWeight: 700, cursor: dis ? "not-allowed" : "pointer" }),
    modeBtn:     (active: boolean): React.CSSProperties => ({ padding: "6px 14px", borderRadius: 8, border: `1px solid ${active ? "#2563eb" : "#e5e7eb"}`, background: active ? "#eff6ff" : "#fff", color: active ? "#2563eb" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }),
  };

  return (
    <div style={S.wrap}>
      {/* ── Left: Sale Form ── */}
      <div style={S.left}>

        {/* Top bar: status + sync */}
        <div style={S.topBar}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111", flex: 1 }}>🛒 Rekodi Mauzo Mapya</span>
          <div style={dynS.statusBadge(isOnline)}>{isOnline ? "🟢 Mtandaoni" : "🔴 Nje ya mtandao"}</div>
          {offlineCount > 0 && (
            <button onClick={syncOfflineSales} disabled={!isOnline || syncing}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 8, border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", cursor: "pointer" }}>
              {syncing ? "⏳ Inasync…" : `🔄 Sync (${offlineCount})`}
            </button>
          )}
        </div>

        {/* Product Search Dropdown */}
        <div style={S.card}>
          <label style={S.label}>➕ Ongeza Bidhaa</label>
          <div style={{ position: "relative" }}>
            <input
              ref={productSearchRef}
              type="text"
              value={productSearch}
              onChange={e => handleProductSearch(e.target.value)}
              onKeyDown={handleProductKeyDown}
              onBlur={() => setTimeout(() => setShowProductDropdown(false), 300)}
              placeholder="Tafuta bidhaa kwa jina, barcode au SKU…"
              style={{ ...S.input, paddingLeft: 36 }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>🔍</span>
            {showProductDropdown && filteredProducts.length > 0 && (
              <div style={S.dropdown} onMouseDown={e => e.preventDefault()}>
                {filteredProducts.map(p => {
                  const stock = p.inventories?.[0]?.quantity ?? 0;
                  const price = customer?.type === "WHOLESALE" && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
                  return (
                    <button key={p.id} onMouseDown={e => { e.preventDefault(); addToCart(p); }} style={{ ...S.dropRow, opacity: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.category?.name} {p.barcode ? `· ${p.barcode}` : ""}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, color: "#2563eb", fontSize: 13 }}>{formatCurrency(price, "TZS")}</div>
                          <div style={{ fontSize: 11, color: stock <= 5 ? "#ef4444" : "#9ca3af" }}>Hifadhi: {stock}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {showProductDropdown && filteredProducts.length === 0 && productSearch.trim() && (
              <div style={{ ...S.dropdown, padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Hakuna bidhaa zilizopatikana</div>
            )}
          </div>
        </div>

        {/* Customer Section */}
        <div style={S.card}>
          <label style={S.label}>👤 Mteja (si lazima)</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => { setCustomerMode("none"); setCustomer(null); setCustomerSearch(""); setCustomerManual(""); }} style={dynS.modeBtn(customerMode === "none")}>Bila mteja</button>
            <button onClick={() => { setCustomerMode("search"); setCustomerManual(""); }} style={dynS.modeBtn(customerMode === "search")}>🔍 Tafuta</button>
            <button onClick={() => { setCustomerMode("manual"); setCustomer(null); setCustomerSearch(""); }} style={dynS.modeBtn(customerMode === "manual")}>✏️ Andika jina</button>
          </div>

          {customerMode === "search" && (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={customer ? customer.name : customerSearch}
                onChange={e => { setCustomer(null); searchCustomers(e.target.value); }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 150)}
                placeholder="Tafuta jina, simu…"
                style={{ ...S.input, paddingLeft: 32 }}
              />
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13 }}>👤</span>
              {customer && (
                <button onClick={() => { setCustomer(null); setCustomerSearch(""); }}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#9ca3af" }}>×</button>
              )}
              {showCustomerDropdown && customers.length > 0 && (
                <div style={S.dropdown}>
                  {customers.map(c => (
                    <button key={c.id} onMouseDown={() => { setCustomer(c); setShowCustomerDropdown(false); }} style={S.dropRow}>
                      <div style={{ fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.phone} · {c.type}{c.totalDebt > 0 ? ` · Deni: ${formatCurrency(c.totalDebt, "TZS")}` : ""}</div>
                    </button>
                  ))}
                </div>
              )}
              {customer && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, fontSize: 11 }}>
                  <span style={{ padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#2563eb", fontWeight: 700 }}>{customer.type}</span>
                  <span style={{ color: "#9ca3af" }}>⭐ {customer.loyaltyPoints} pts</span>
                  {customer.totalDebt > 0 && <span style={{ color: "#ef4444" }}>Deni: {formatCurrency(customer.totalDebt, "TZS")}</span>}
                </div>
              )}
            </div>
          )}

          {customerMode === "manual" && (
            <input
              type="text"
              value={customerManual}
              onChange={e => setCustomerManual(e.target.value)}
              placeholder="Ingiza jina la mteja…"
              style={S.input}
            />
          )}
        </div>

        {/* Note */}
        <div style={S.card}>
          <label style={S.label}>📝 Maelezo (hiari)</label>
          <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Kumbuka kitu kuhusu mauzo haya…" style={S.input} />
        </div>

        {/* Discount */}
        <div style={S.card}>
          <label style={S.label}>🏷️ Punguzo (TZS)</label>
          <input type="number" min="0" max={subtotal} value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" style={{ ...S.input, textAlign: "right" }} />
        </div>

      </div>

      {/* ── Right: Cart ── */}
      <div style={S.right}>
        <div style={S.cartHdr}>
          <div style={S.cartTitle}>
            🛒 Mkoba
            {cart.length > 0 && <span style={S.cartBadge}>{cart.length}</span>}
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>🗑 Futa yote</button>
          )}
        </div>

        <div style={S.cartList}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#d1d5db", padding: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🛒</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Mkoba uko tupu</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>Tafuta bidhaa upande wa kushoto kuiongeza</div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} style={S.cartItem}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", flex: 1, paddingRight: 8 }}>{item.name}</div>
                  <button onClick={() => removeFromCart(item.productId)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#ef4444" }}>🗑</button>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => updateQty(item.productId, -1)} style={S.qtyBtn}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 800, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} style={S.qtyBtn}>+</button>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{formatCurrency(item.unitPrice, "TZS")} × {item.quantity}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#2563eb" }}>{formatCurrency(item.total, "TZS")}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={S.cartFooter}>
          <div style={S.totRow}><span>Jumla ndogo</span><span>{formatCurrency(subtotal, "TZS")}</span></div>
          {discount > 0 && <div style={{ ...S.totRow, color: "#16a34a" }}><span>Punguzo</span><span>− {formatCurrency(discount, "TZS")}</span></div>}
          <div style={S.totFinal}><span>JUMLA</span><span>{formatCurrency(total, "TZS")}</span></div>
          <button onClick={() => setShowPaymentModal(true)} disabled={cart.length === 0} style={dynS.chargeBtn(cart.length === 0)}>
            Lipia {formatCurrency(total, "TZS")}
          </button>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {showPaymentModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={S.modalHdr}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#111" }}>💳 Malipo</div>
              <button onClick={() => setShowPaymentModal(false)} style={S.closeBtn}>×</button>
            </div>
            <div style={S.modalBody}>
              <div style={{ background: "#eff6ff", borderRadius: 14, padding: "16px 20px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, marginBottom: 4 }}>Kiasi Kinachohitajika</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#1d4ed8" }}>{formatCurrency(total, "TZS")}</div>
                {(customer || (customerMode === "manual" && customerManual)) && (
                  <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>Mteja: {customer?.name || customerManual}</div>
                )}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Njia ya Malipo</div>
              <div style={S.pmGrid}>
                {(["CASH", "MOBILE_MONEY", "BANK_TRANSFER", "CREDIT"] as const).map(pm => (
                  <button key={pm} onClick={() => setPaymentMethod(pm)} style={dynS.pmBtn(paymentMethod === pm)}>
                    <span style={{ fontSize: 20 }}>{pm === "CASH" ? "💵" : pm === "MOBILE_MONEY" ? "📱" : pm === "BANK_TRANSFER" ? "🏦" : "📋"}</span>
                    <span>{pm === "CASH" ? "Taslimu" : pm === "MOBILE_MONEY" ? "M-Pesa/Tigo" : pm === "BANK_TRANSFER" ? "Benki" : "Mkopo"}</span>
                  </button>
                ))}
              </div>

              {paymentMethod !== "CREDIT" && (
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Kiasi Kilicholipwa</label>
                  <input
                    type="number" value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    placeholder={total.toString()}
                    autoFocus
                    style={{ width: "100%", marginTop: 6, padding: "12px 14px", border: "2px solid #e5e7eb", borderRadius: 12, fontSize: 18, textAlign: "right", fontWeight: 800, outline: "none", boxSizing: "border-box" }}
                  />
                  <div style={S.qkGrid}>
                    {[total, Math.ceil(total / 1000) * 1000, Math.ceil(total / 5000) * 5000, Math.ceil(total / 10000) * 10000]
                      .filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map(amt => (
                        <button key={amt} onClick={() => setAmountPaid(amt.toString())} style={S.qkBtn}>{formatCurrency(amt, "TZS")}</button>
                      ))}
                  </div>
                </div>
              )}

              {paymentMethod !== "CREDIT" && parseFloat(amountPaid || "0") > 0 && (
                <div style={dynS.changePill(change >= 0)}>
                  <span>{change >= 0 ? "Chenji" : "Baki"}</span>
                  <span>{formatCurrency(Math.abs(change), "TZS")}</span>
                </div>
              )}

              {paymentMethod === "CREDIT" && (
                <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 13 }}>
                  ⚠️ {formatCurrency(total, "TZS")} itaongezwa kwa deni la mteja.
                  {!customer && " Tafadhali chagua mteja wa kweli kwa mkopo."}
                </div>
              )}
            </div>
            <div style={S.modalFtr}>
              <button onClick={() => setShowPaymentModal(false)} style={S.cancelBtn}>Ghairi</button>
              <button onClick={completeSale} disabled={processing || (paymentMethod === "CREDIT" && !customer)} style={dynS.confirmBtn(processing || (paymentMethod === "CREDIT" && !customer))}>
                {processing ? "Inashughulikiwa…" : "✓ Kamilisha Mauzo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Modal ── */}
      {showReceipt && lastReceipt && (
        <div style={S.overlay}>
          <div style={S.receiptMdl}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>✓ Mauzo Yamekamilika!</div>
              <button onClick={() => setShowReceipt(false)} style={S.closeBtn}>×</button>
            </div>
            <div style={S.receiptBody}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 900 }}>RISITI</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{lastReceipt.offline ? "⚠ Nje ya Mtandao" : "✓ Mtandaoni"}</div>
                <div style={{ fontWeight: 700, marginTop: 2 }}>{lastReceipt.receiptNumber}</div>
              </div>
              <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 10, marginBottom: 10 }}>
                {lastReceipt.items?.map((item: CartItem) => (
                  <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name} x{item.quantity}</span>
                    <span style={{ marginLeft: 8 }}>{formatCurrency(item.total, "TZS")}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 8 }}>
                {lastReceipt.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>Punguzo</span><span>-{formatCurrency(lastReceipt.discount, "TZS")}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14 }}><span>JUMLA</span><span>{formatCurrency(lastReceipt.total, "TZS")}</span></div>
              </div>
              {(lastReceipt.customer?.name || lastReceipt.customerName) && (
                <div style={{ marginTop: 10, textAlign: "center", color: "#6b7280" }}>Mteja: {lastReceipt.customer?.name || lastReceipt.customerName}</div>
              )}
              <div style={{ textAlign: "center", color: "#9ca3af", marginTop: 10 }}>Asante kwa ununuzi!</div>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
              <button onClick={() => window.print()} style={{ ...S.cancelBtn, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>🖨 Chapa</button>
              <button onClick={() => setShowReceipt(false)} style={{ ...dynS.confirmBtn(false), border: "none" }}>Mauzo Mapya</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
