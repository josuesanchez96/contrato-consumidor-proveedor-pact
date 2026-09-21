export interface InventoryRecord {
  sku: string;
  name: string;
  quantity: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK';
}

class InventoryDatabase {
  private items: Map<string, InventoryRecord> = new Map();

  constructor() {
    this.reset();
  }

  reset(): void {
    this.items.clear();
  }

  setItem(item: InventoryRecord): void {
    this.items.set(item.sku, item);
  }

  getItem(sku: string): InventoryRecord | undefined {
    return this.items.get(sku);
  }

  deleteItem(sku: string): void {
    this.items.delete(sku);
  }
}

export const inventoryDb = new InventoryDatabase();
