import { openDB, DBSchema, IDBPDatabase } from "idb";
import { OfflineSale } from "./types";

interface OfflineProduct {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  barcode?: string;
  sku?: string;
  retailPrice: number;
  wholesalePrice?: number;
  stock: number;
  categoryName?: string;
  unitName?: string;
}

interface SyncQueueItem {
  id: string;
  type: "SALE" | "PAYMENT";
  data: unknown;
  attempts: number;
  createdAt: string;
}

interface PhidPOSDB extends DBSchema {
  offlineSales: {
    key: string;
    value: OfflineSale;
    indexes: { "by-synced": string; "by-tenant": string };
  };
  offlineProducts: {
    key: string;
    value: OfflineProduct;
    indexes: { "by-barcode": string; "by-tenant": string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
  };
}

let db: IDBPDatabase<PhidPOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PhidPOSDB>> {
  if (db) return db;

  db = await openDB<PhidPOSDB>("phidpos-offline", 1, {
    upgrade(database) {
      const salesStore = database.createObjectStore("offlineSales", {
        keyPath: "offlineId",
      });
      salesStore.createIndex("by-synced", "synced");
      salesStore.createIndex("by-tenant", "tenantId");

      const productsStore = database.createObjectStore("offlineProducts", {
        keyPath: "id",
      });
      productsStore.createIndex("by-barcode", "barcode");
      productsStore.createIndex("by-tenant", "tenantId");

      database.createObjectStore("syncQueue", { keyPath: "id" });
    },
  });

  return db;
}

export async function saveOfflineSale(sale: OfflineSale): Promise<void> {
  const database = await getDB();
  await database.put("offlineSales", sale);
}

export async function getUnsynced(tenantId: string): Promise<OfflineSale[]> {
  const database = await getDB();
  const all = await database.getAllFromIndex("offlineSales", "by-tenant", tenantId);
  return all.filter((s) => !s.synced);
}

export async function markAsSynced(offlineId: string): Promise<void> {
  const database = await getDB();
  const sale = await database.get("offlineSales", offlineId);
  if (sale) {
    sale.synced = true;
    await database.put("offlineSales", sale);
  }
}

export async function cacheProducts(
  products: PhidPOSDB["offlineProducts"]["value"][]
): Promise<void> {
  const database = await getDB();
  const tx = database.transaction("offlineProducts", "readwrite");
  for (const product of products) {
    await tx.store.put(product);
  }
  await tx.done;
}

export async function getCachedProducts(
  tenantId: string
): Promise<PhidPOSDB["offlineProducts"]["value"][]> {
  const database = await getDB();
  return database.getAllFromIndex("offlineProducts", "by-tenant", tenantId);
}

export async function searchCachedProducts(
  tenantId: string,
  query: string
): Promise<PhidPOSDB["offlineProducts"]["value"][]> {
  const products = await getCachedProducts(tenantId);
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.barcode?.includes(q) ||
      p.sku?.toLowerCase().includes(q)
  );
}

export async function getOfflineSaleCount(tenantId: string): Promise<number> {
  const unsynced = await getUnsynced(tenantId);
  return unsynced.length;
}
