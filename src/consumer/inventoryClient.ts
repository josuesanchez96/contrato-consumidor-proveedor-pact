export interface InventoryItem {
  sku: string;
  name: string;
  quantity: number;
  status: 'AVAILABLE' | 'OUT_OF_STOCK';
}

export interface InventoryError {
  error: string;
}

export class InventoryClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getInventory(sku: string): Promise<InventoryItem> {
    const response = await fetch(`${this.baseUrl}/inventory/${encodeURIComponent(sku)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      const errorData = (await response.json()) as InventoryError;
      throw new Error(errorData.error || `SKU ${sku} not found`);
    }

    if (!response.ok) {
      throw new Error(`Unexpected status code ${response.status} from inventory service`);
    }

    return (await response.json()) as InventoryItem;
  }
}
