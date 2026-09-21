import { InventoryClient, InventoryItem } from './inventoryClient';

export interface ReservationRequest {
  reservationId: string;
  sku: string;
  requestedQuantity: number;
}

export interface ReservationResult {
  reservationId: string;
  sku: string;
  accepted: boolean;
  reason: string;
  inventory?: InventoryItem;
}

export class ReservationService {
  private inventoryClient: InventoryClient;

  constructor(inventoryClient: InventoryClient) {
    this.inventoryClient = inventoryClient;
  }

  async processReservation(request: ReservationRequest): Promise<ReservationResult> {
    try {
      const inventory = await this.inventoryClient.getInventory(request.sku);

      if (inventory.status === 'OUT_OF_STOCK' || inventory.quantity < request.requestedQuantity) {
        return {
          reservationId: request.reservationId,
          sku: request.sku,
          accepted: false,
          reason: `Insufficient inventory for SKU ${request.sku}. Available: ${inventory.quantity}`,
          inventory,
        };
      }

      return {
        reservationId: request.reservationId,
        sku: request.sku,
        accepted: true,
        reason: 'Reservation accepted and stock available',
        inventory,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        reservationId: request.reservationId,
        sku: request.sku,
        accepted: false,
        reason: `Reservation rejected: ${errorMessage}`,
      };
    }
  }
}
