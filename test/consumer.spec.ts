import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { InventoryClient } from '../src/consumer/inventoryClient';
import { ReservationService } from '../src/consumer/reservationService';

const provider = new PactV3({
  consumer: 'ReservationConsumer',
  provider: 'InventoryProvider',
  dir: path.resolve(process.cwd(), 'pacts'),
});

describe('Reservation Consumer Pact Tests', () => {
  it('should process reservation successfully when product has available inventory', async () => {
    provider
      .given('the product T-SHIRT has inventory')
      .uponReceiving('a request for available product inventory')
      .withRequest({
        method: 'GET',
        path: '/inventory/T-SHIRT',
        headers: {
          Accept: 'application/json',
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          sku: MatchersV3.string('T-SHIRT'),
          name: MatchersV3.like('Ergonomic T-Shirt'),
          quantity: MatchersV3.integer(15),
          status: MatchersV3.like('AVAILABLE'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new InventoryClient(mockServer.url);
      const service = new ReservationService(client);
      const result = await service.processReservation({
        reservationId: 'res-101',
        sku: 'T-SHIRT',
        requestedQuantity: 2,
      });

      expect(result.accepted).toBe(true);
      expect(result.inventory?.sku).toBe('T-SHIRT');
      expect(result.inventory?.quantity).toBe(15);
      expect(result.inventory?.status).toBe('AVAILABLE');
    });
  });

  it('should reject reservation when product inventory is out of stock', async () => {
    provider
      .given('the product MUG is out of stock')
      .uponReceiving('a request for out of stock product inventory')
      .withRequest({
        method: 'GET',
        path: '/inventory/MUG',
        headers: {
          Accept: 'application/json',
        },
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          sku: MatchersV3.string('MUG'),
          name: MatchersV3.like('Ceramic Mug'),
          quantity: MatchersV3.integer(0),
          status: MatchersV3.like('OUT_OF_STOCK'),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new InventoryClient(mockServer.url);
      const service = new ReservationService(client);
      const result = await service.processReservation({
        reservationId: 'res-102',
        sku: 'MUG',
        requestedQuantity: 1,
      });

      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('Insufficient inventory');
      expect(result.inventory?.quantity).toBe(0);
      expect(result.inventory?.status).toBe('OUT_OF_STOCK');
    });
  });

  it('should reject reservation with error when product SKU does not exist', async () => {
    provider
      .given('the product UNKNOWN-SKU does not exist')
      .uponReceiving('a request for non-existent SKU inventory')
      .withRequest({
        method: 'GET',
        path: '/inventory/UNKNOWN-SKU',
        headers: {
          Accept: 'application/json',
        },
      })
      .willRespondWith({
        status: 404,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: {
          error: MatchersV3.like("SKU 'UNKNOWN-SKU' not found in inventory"),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const client = new InventoryClient(mockServer.url);
      const service = new ReservationService(client);
      const result = await service.processReservation({
        reservationId: 'res-103',
        sku: 'UNKNOWN-SKU',
        requestedQuantity: 1,
      });

      expect(result.accepted).toBe(false);
      expect(result.reason).toContain('Reservation rejected');
    });
  });
});
