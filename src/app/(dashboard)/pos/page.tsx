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
  id: string; name: string; barcode?: string; sku?: string;
  retailPrice: number; wholesalePrice?: number;
  category?: { name: string }; unit?: { abbreviation: string };
  inventories?: { quantity: number }[];
}

interface Customer {
  id: string; name: string; phone?: string; type: string;
  loyaltyPoints: number; totalDebt: number;
}

interface SaleRow {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  stock: number;
  barcode?: string;
}

export default function POSPage() {
  const { data: session } = useSession();
  const isOnline = useOnlineStatus();

  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<SaleRow[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [custDropPos, setCustDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const [status, setStatus] = useState<"PAID" | "UNPAID" | "LOAN">("PAID");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MOBILE_MONEY" | "BANK_TRANSFER">("CASH");
  const [amountPaid, setAmountPaid] = useState("");
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [prodSearch, setProdSearch] = useState<Record<string, string>>({});
  const [prodResults, setProdResults] = useState<Product[]>([]);
  const [prodDropPos, setProdDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const prodInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const custInputRef = useRef<HTMLInputElement>(null);

  const subtotal = rows.reduce((s, r) => s + r.total, 0);
  const total = Math.max(0, subtotal - discount);
  const change = Math.max(0, parseFloat(amountPaid || "0") - total);

  useEffect(() => {
    if (!session?.user) return;
    loadProducts();
    loadOfflineCount();
  }, [session]);

  useEffect(() => {
    if (isOnline && offlineCount > 0) syncOfflineSales();
  }, [isOnline]);

  async function loadProducts() {
    try {
      if (isOnline) {
        const res = await fetch(`/api/products?limit=500&storeId=${(session?.user as any)?.storeId}`);
        const data = await res.json();
        const prods = data.products || [];
        setProducts(prods);
        if ((session?.user as any)?.tenantId && (session?.user as any)?.storeId) {
          await cacheProducts(prods.map((p: Product) => ({
            id: p.id, tenantId: (session!.user as any).tenantId, storeId: (session!.user as any).storeId,
            name: p.name, barcode: p.barcode, sku: p.sku,
            retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice,
            stock: p.inventories?.[0]?.quantity ?? 0,
            categoryName: p.category?.name, unitName: p.unit?.abbreviation,
          })));
        }
      } else {
        const cached = await getCachedProducts((session?.user as any)?.tenantId || "");
        setProducts(cached.map(p => ({
          id: p.id, name: p.name, barcode: p.barcode, sku: p.sku,
          retailPrice: p.retailPrice, wholesalePrice: p.wholesalePrice,
          inventories: [{ quantity: p.stock }],
        })));
      }
    } catch { toast.error("Imeshindwa kupakia bidhaa"); }
  }

  async function loadOfflineCount() {
    const u = await getUnsynced((session?.user as any)?.tenantId || "");
    setOfflineCount(u.length);
  }

  async function syncOfflineSales() {
    if (!isOnline || !(session?.user as any)?.tenantId) return;
    setSyncing(true);
    try {
      const unsynced = await getUnsynced((session!.user as any).tenantId);
      if (!unsynced.length) { setSyncing(false); return; }
      const res = await fetch("/api/sales/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sales: unsynced }) });
      const { results } = await res.json();
      let n = 0;
      for (const r of results) { if (r.status === "synced" || r.status === "duplicate") { await markAsSynced(r.offlineId); n++; } }
      toast.success(`Imeunganisha mauzo ${n}`); setOfflineCount(0);
    } catch { toast.error("Sync imeshindwa"); }
    setSyncing(false);
  }

  function addRow() {
    const id = `row-${Date.now()}`;
    setRows(prev => [...prev, { id, productId: "", productName: "", unitPrice: 0, quantity: 1, total: 0, stock: 999 }]);
    setProdSearch(prev => ({ ...prev, [id]: "" }));
  }

  function removeRow(id: string) {
    setRows(prev => prev.filter(r => r.id !== id));
    setProdSearch(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  function searchProducts(id: string, q: string, inputEl: HTMLInputElement) {
    setProdSearch(prev => ({ ...prev, [id]: q }));
    setActiveRowId(id);
    if (!q.trim()) { setProdResults([]); setProdDropPos(null); return; }
    const lower = q.toLowerCase();
    const matches = products.filter(p =>
      p.name.toLowerCase().includes(lower) || p.barcode?.includes(q) || p.sku?.toLowerCase().includes(lower)
    ).slice(0, 10);
    setProdResults(matches);
    const r = inputEl.getBoundingClientRect();
    setProdDropPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
  }

  function selectProduct(rowId: string, p: Product) {
    const stock = p.inventories?.[0]?.quantity ?? 0;
    const price = selectedCustomer?.type === "WHOLESALE" && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
    if (stock === 0) toast("⚠️ Bidhaa hii haina hifadhi", { icon: "⚠️" });
    setRows(prev => prev.map(r => r.id === rowId
      ? { ...r, productId: p.id, productName: p.name, unitPrice: price, quantity: 1, total: price, stock, barcode: p.barcode }
      : r
    ));
    setProdSearch(prev => ({ ...prev, [rowId]: p.name }));
    setProdResults([]); setProdDropPos(null); setActiveRowId(null);
  }

  function updateQty(id: string, qty: number) {
    if (qty < 1) return;
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      if (qty > r.stock && r.stock > 0) { toast.error("Hifadhi haitoshi"); return r; }
      return { ...r, quantity: qty, total: qty * r.unitPrice };
    }));
  }

  async function searchCustomers(q: string, inputEl: HTMLInputElement) {
    setCustomerName(q); setSelectedCustomer(null);
    if (!q.trim()) { setCustomerResults([]); setShowCustDrop(false); return; }
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      setCustomerResults(data.customers || []);
      const r = inputEl.getBoundingClientRect();
      setCustDropPos({ top: r.bottom + window.scrollY, left: r.left + window.scrollX, width: r.width });
      setShowCustDrop(true);
    } catch {}
  }

  async function completeSale() {
    const validRows = rows.filter(r => r.productId);
    if (!validRows.length) { toast.error("Ongeza bidhaa angalau moja"); return; }
    if (status === "LOAN" && !dueDate) { toast.error("Weka tarehe ya malipo kwa mkopo"); return; }
    setProcessing(true);
    try {
      const saleData = {
        storeId: (session?.user as any)?.storeId,
        customerId: selectedCustomer?.id || null,
        customerName: !selectedCustomer?.id && customerName.trim() ? customerName.trim() : undefined,
        note: note.trim() || undefined,
        items: validRows.map(r => ({ productId: r.productId, name: r.productName, barcode: r.barcode, quantity: r.quantity, unitPrice: r.unitPrice, discount: 0, total: r.total })),
        subtotal, discount, tax: 0, total,
        amountPaid: status === "LOAN" ? 0 : status === "UNPAID" ? 0 : parseFloat(amountPaid || total.toString()),
        change: status === "PAID" ? change : 0,
        debtAmount: status === "LOAN" ? total : status === "UNPAID" ? total : 0,
        paymentMethod: (status === "LOAN" || status === "UNPAID" ? "CREDIT" : paymentMethod) as "CASH" | "MOBILE_MONEY" | "BANK_TRANSFER" | "CREDIT",
        dueDate: status === "LOAN" ? dueDate : undefined,
        createdAt: new Date().toISOString(),
      };
      if (isOnline) {
        const res = await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saleData) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setLastReceipt({ ...data.sale, rows: validRows, customerName: selectedCustomer?.name || customerName, cashier: (session?.user as any)?.name });
      } else {
        const offlineId = `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const offlineSale: OfflineSale = {
          ...saleData, offlineId, synced: false,
          tenantId: (session?.user as any)?.tenantId,
          storeId: (session?.user as any)?.storeId,
          userId: (session?.user as any)?.id,
          customerId: selectedCustomer?.id,
          receiptNumber: generateReceiptNumber(),
        };
        await saveOfflineSale(offlineSale);
        setOfflineCount(c => c + 1);
        setLastReceipt({ receiptNumber: offlineSale.receiptNumber, rows: validRows, customerName: selectedCustomer?.name || customerName, total, offline: true });
        toast("Mauzo yamehifadhiwa nje ya mtandao", { icon: "💾" });
      }
      setShowReceipt(true);
      setRows([]); setProdSearch({}); setCustomerName(""); setSelectedCustomer(null);
      setDiscount(0); setNote(""); setAmountPaid(""); setStatus("PAID"); setDueDate("");
    } catch (err: any) { toast.error(err.message || "Mauzo yameshindwa"); }
    setProcessing(false);
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 7, fontSize: 13, outline: "none", boxSizing: "border-box", background: "#fff" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.05em" };
  const fixedDrop: (pos: { top: number; left: number; width: number }) => React.CSSProperties = (pos) => ({
    position: "fixed", top: pos.top + 2, left: pos.left, width: pos.width,
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
    boxShadow: "0 12px 32px rgba(0,0,0,0.15)", zIndex: 9999, maxHeight: 280, overflowY: "auto",
  });

  return (
    <div style={{ padding: "24px 28px", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background: "#f8fafc", minHeight: "calc(100vh - 60px)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", margin: 0 }}>Rekodi Mauzo Mapya</h1>
          <p style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>Jaza fomu hapa chini kurekodi mauzo</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 20, background: isOnline ? "#dcfce7" : "#fee2e2", color: isOnline ? "#16a34a" : "#dc2626" }}>
            {isOnline ? "🟢 Mtandaoni" : "🔴 Nje ya mtandao"}
          </span>
          {offlineCount > 0 && (
            <button onClick={syncOfflineSales} disabled={!isOnline || syncing}
              style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid #fed7aa", background: "#fff7ed", color: "#c2410c", cursor: "pointer" }}>
              {syncing ? "⏳ Sync…" : `🔄 Sync (${offlineCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", overflow: "hidden" }}>

        {/* Section: Customer + Note */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", background: "#fafbfc" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>👤 Jina la Mteja (hiari)</label>
              <div style={{ position: "relative" }}>
                <input
                  ref={custInputRef}
                  type="text"
                  value={selectedCustomer ? selectedCustomer.name : customerName}
                  onChange={e => { setSelectedCustomer(null); if (custInputRef.current) searchCustomers(e.target.value, custInputRef.current); }}
                  placeholder="Andika au tafuta jina la mteja…"
                  style={inputStyle}
                />
                {selectedCustomer && (
                  <button onClick={() => { setSelectedCustomer(null); setCustomerName(""); }}
                    style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>×</button>
                )}
                {showCustDrop && customerResults.length > 0 && custDropPos && (
                  <div style={fixedDrop(custDropPos)}>
                    {customerResults.map(c => (
                      <button key={c.id} onMouseDown={e => { e.preventDefault(); setSelectedCustomer(c); setCustomerName(c.name); setShowCustDrop(false); }}
                        style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.phone} · {c.type}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer && (
                <div style={{ marginTop: 5, display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#eff6ff", color: "#2563eb", fontWeight: 700 }}>{selectedCustomer.type}</span>
                  {selectedCustomer.totalDebt > 0 && <span style={{ fontSize: 11, color: "#ef4444" }}>Deni: {formatCurrency(selectedCustomer.totalDebt, "TZS")}</span>}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>📝 Maelezo (hiari)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="Kumbuka kuhusu mauzo haya…" style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Section: Products Table */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <label style={{ ...labelStyle, margin: 0 }}>📦 Bidhaa Zilizouzwa</label>
            <button onClick={addRow}
              style={{ fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer" }}>
              + Ongeza Mstari
            </button>
          </div>

          {/* Table Header */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 110px 36px", gap: 8, padding: "8px 10px", background: "#f1f5f9", borderRadius: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Bidhaa</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "center" }}>Idadi</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Bei (TZS)</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right" }}>Jumla</div>
            <div></div>
          </div>

          {/* Rows */}
          {rows.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af", fontSize: 13 }}>
              Bofya "+ Ongeza Mstari" kuanza kuongeza bidhaa
            </div>
          )}
          {rows.map((row, idx) => (
            <div key={row.id} style={{ display: "grid", gridTemplateColumns: "2fr 90px 110px 110px 36px", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
              {/* Product search */}
              <div style={{ position: "relative" }}>
                <input
                  ref={el => { prodInputRefs.current[row.id] = el; }}
                  type="text"
                  value={prodSearch[row.id] ?? ""}
                  onChange={e => { if (prodInputRefs.current[row.id]) searchProducts(row.id, e.target.value, prodInputRefs.current[row.id]!); }}
                  placeholder={`Bidhaa ${idx + 1}…`}
                  style={{ ...inputStyle, background: row.productId ? "#f0fdf4" : "#fff" }}
                />
                {activeRowId === row.id && prodResults.length > 0 && prodDropPos && (
                  <div style={fixedDrop(prodDropPos)}>
                    {prodResults.map(p => {
                      const stock = p.inventories?.[0]?.quantity ?? 0;
                      const price = selectedCustomer?.type === "WHOLESALE" && p.wholesalePrice ? p.wholesalePrice : p.retailPrice;
                      return (
                        <button key={p.id} onMouseDown={e => { e.preventDefault(); e.stopPropagation(); selectProduct(row.id, p); }}
                          style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: "none", border: "none", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "#111" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.category?.name}{p.barcode ? ` · ${p.barcode}` : ""}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "#2563eb", fontSize: 13 }}>{formatCurrency(price, "TZS")}</div>
                            <div style={{ fontSize: 11, color: stock <= 5 ? "#ef4444" : "#9ca3af" }}>Hifadhi: {stock}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {/* Quantity */}
              <input type="number" min="1" value={row.quantity}
                onChange={e => updateQty(row.id, parseInt(e.target.value) || 1)}
                style={{ ...inputStyle, textAlign: "center" }} />
              {/* Unit Price */}
              <input type="number" min="0" value={row.unitPrice || ""}
                onChange={e => {
                  const p = parseFloat(e.target.value) || 0;
                  setRows(prev => prev.map(r => r.id === row.id ? { ...r, unitPrice: p, total: p * r.quantity } : r));
                }}
                style={{ ...inputStyle, textAlign: "right" }} />
              {/* Total */}
              <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, color: "#2563eb", padding: "0 4px" }}>
                {formatCurrency(row.total, "TZS")}
              </div>
              {/* Remove */}
              <button onClick={() => removeRow(row.id)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ))}
        </div>

        {/* Section: Status + Payment */}
        <div style={{ padding: "20px 24px", borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Status */}
            <div>
              <label style={labelStyle}>💳 Hali ya Malipo</label>
              <div style={{ display: "flex", gap: 6 }}>
                {(["PAID", "UNPAID", "LOAN"] as const).map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `2px solid ${status === s ? (s === "PAID" ? "#16a34a" : s === "LOAN" ? "#d97706" : "#dc2626") : "#e5e7eb"}`, background: status === s ? (s === "PAID" ? "#f0fdf4" : s === "LOAN" ? "#fffbeb" : "#fef2f2") : "#fff", color: status === s ? (s === "PAID" ? "#16a34a" : s === "LOAN" ? "#d97706" : "#dc2626") : "#6b7280", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    {s === "PAID" ? "✓ Imelipwa" : s === "UNPAID" ? "✗ Haijalipiwa" : "⏳ Mkopo"}
                  </button>
                ))}
              </div>
            </div>
            {/* Payment Method (only if PAID) */}
            {status === "PAID" && (
              <div>
                <label style={labelStyle}>💵 Njia ya Malipo</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}
                  style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="CASH">💵 Taslimu (Cash)</option>
                  <option value="MOBILE_MONEY">📱 M-Pesa / Tigo Pesa</option>
                  <option value="BANK_TRANSFER">🏦 Benki</option>
                </select>
              </div>
            )}
            {/* Due Date (only if LOAN) */}
            {status === "LOAN" && (
              <div>
                <label style={labelStyle}>📅 Tarehe ya Kulipa Mkopo</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  style={inputStyle} />
              </div>
            )}
            {/* Discount */}
            <div>
              <label style={labelStyle}>🏷️ Punguzo (TZS)</label>
              <input type="number" min="0" value={discount || ""} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" style={{ ...inputStyle, textAlign: "right" }} />
            </div>
          </div>

          {/* Amount paid row (PAID only) */}
          {status === "PAID" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>💰 Kiasi Kilicholipwa</label>
                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder={total.toString()}
                  style={{ ...inputStyle, textAlign: "right", fontSize: 15, fontWeight: 700 }} />
              </div>
              {parseFloat(amountPaid || "0") > 0 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: change >= 0 ? "#f0fdf4" : "#fef2f2", color: change >= 0 ? "#16a34a" : "#dc2626", fontWeight: 700, fontSize: 13 }}>
                    {change >= 0 ? "Chenji" : "Baki"}: {formatCurrency(Math.abs(change), "TZS")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totals + Submit */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              <div style={{ marginBottom: 4 }}>Jumla ndogo: <strong>{formatCurrency(subtotal, "TZS")}</strong></div>
              {discount > 0 && <div style={{ marginBottom: 4, color: "#16a34a" }}>Punguzo: − <strong>{formatCurrency(discount, "TZS")}</strong></div>}
              {status === "LOAN" && <div style={{ color: "#d97706" }}>Mkopo{dueDate ? ` · Malipo: ${dueDate}` : ""}</div>}
              {status === "UNPAID" && <div style={{ color: "#dc2626" }}>Haijalipiwa — itaingia kama deni</div>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>JUMLA YA KULIPA</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#1d4ed8" }}>{formatCurrency(total, "TZS")}</div>
              </div>
              <button onClick={completeSale} disabled={processing || rows.filter(r => r.productId).length === 0}
                style={{ padding: "13px 32px", borderRadius: 12, border: "none", background: (processing || rows.filter(r => r.productId).length === 0) ? "#d1d5db" : "#2563eb", color: "#fff", fontSize: 15, fontWeight: 800, cursor: (processing || rows.filter(r => r.productId).length === 0) ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {processing ? "⏳ Inashughulikiwa…" : "✓ Kamilisha Mauzo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastReceipt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>✓ Mauzo Yamekamilika!</div>
              <button onClick={() => setShowReceipt(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>
            <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 900, fontSize: 15 }}>RISITI</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>{lastReceipt.offline ? "⚠ Nje ya Mtandao" : "✓ Mtandaoni"} · {lastReceipt.receiptNumber}</div>
                {(lastReceipt.customerName) && <div style={{ marginTop: 4, color: "#374151" }}>Mteja: {lastReceipt.customerName}</div>}
              </div>
              <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 10, marginBottom: 10 }}>
                {lastReceipt.rows?.map((r: SaleRow, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{r.productName} × {r.quantity}</span>
                    <span>{formatCurrency(r.total, "TZS")}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px dashed #d1d5db", paddingTop: 8 }}>
                {lastReceipt.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Punguzo</span><span>−{formatCurrency(lastReceipt.discount, "TZS")}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 14, marginTop: 4 }}><span>JUMLA</span><span>{formatCurrency(lastReceipt.total, "TZS")}</span></div>
              </div>
              <div style={{ textAlign: "center", color: "#9ca3af", marginTop: 14 }}>Asante kwa ununuzi!</div>
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
              <button onClick={() => window.print()} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>🖨 Chapa</button>
              <button onClick={() => setShowReceipt(false)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Mauzo Mapya</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
