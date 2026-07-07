"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "sw" | "en";

export const translations = {
  sw: {
    dashboard: "Dashibodi", pos: "Mauzo / POS", products: "Bidhaa",
    inventory: "Hifadhi", customers: "Wateja", suppliers: "Wasambazaji",
    purchases: "Manunuzi", accounting: "Uhasibu", reports: "Ripoti",
    settings: "Mipangilio", signOut: "Toka", welcome: "Karibu",
    todayRevenue: "Mapato Leo", monthlyRevenue: "Mapato Mwezi",
    totalProducts: "Bidhaa Zote", totalCustomers: "Wateja",
    transactions: "miamala", sales: "mauzo", lowStock: "hifadhi ndogo",
    debt: "Deni", refresh: "Onyesha Upya", recentSales: "Mauzo ya Hivi Karibuni",
    topProducts: "Bidhaa Zinazoongoza", viewAll: "Angalia Zote",
    noData: "Hakuna data bado", receipt: "Risiti", customer: "Mteja",
    cashier: "Mkaguzi", items: "Vitu", total: "Jumla", date: "Tarehe",
    walkin: "Mgeni", portal: "Portal", language: "Lugha",
    weeklyRevenue: "Mapato - Siku 7 Zilizopita",
  },
  en: {
    dashboard: "Dashboard", pos: "Sales / POS", products: "Products",
    inventory: "Inventory", customers: "Customers", suppliers: "Suppliers",
    purchases: "Purchases", accounting: "Accounting", reports: "Reports",
    settings: "Settings", signOut: "Sign Out", welcome: "Welcome",
    todayRevenue: "Today's Revenue", monthlyRevenue: "Monthly Revenue",
    totalProducts: "Total Products", totalCustomers: "Customers",
    transactions: "transactions", sales: "sales", lowStock: "low stock",
    debt: "Debt", refresh: "Refresh", recentSales: "Recent Sales",
    topProducts: "Top Products", viewAll: "View All",
    noData: "No data yet", receipt: "Receipt", customer: "Customer",
    cashier: "Cashier", items: "Items", total: "Total", date: "Date",
    walkin: "Walk-in", portal: "Portal", language: "Language",
    weeklyRevenue: "Revenue - Last 7 Days",
  },
};

interface LangCtx { lang: Lang; t: typeof translations["sw"]; setLang: (l: Lang) => void; }
const LangContext = createContext<LangCtx>({ lang: "sw", t: translations.sw, setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sw");

  useEffect(() => {
    const saved = (typeof window !== "undefined" ? localStorage.getItem("phidpos_lang") : null) as Lang | null;
    if (saved === "en" || saved === "sw") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("phidpos_lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() { return useContext(LangContext); }
