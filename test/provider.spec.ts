import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import { Server } from 'http';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { createInventoryApp } from '../src/provider/inventoryApp';
import { inventoryDb } from '../src/provider/inventoryDb';

describe('Inventory Provider Pact Verification', () => {
  let server: Server;
  let providerUrl: string;

  beforeAll(async () => {
    const app = createInventoryApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          providerUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }
  });

  it('verifies the Pact contract from ReservationConsumer', async () => {
    const pactFilePath = path.resolve(
      process.cwd(),
      'pacts/ReservationConsumer-InventoryProvider.json'
    );

    const verifier = new Verifier({
      provider: 'InventoryProvider',
      providerBaseUrl: providerUrl,
      pactUrls: [pactFilePath],
      stateHandlers: {
        'the product T-SHIRT has inventory': async () => {
          inventoryDb.reset();
          inventoryDb.setItem({
            sku: 'T-SHIRT',
            name: 'Ergonomic T-Shirt',
            quantity: 15,
            status: 'AVAILABLE',
          });
        },
        'the product MUG is out of stock': async () => {
          inventoryDb.reset();
          inventoryDb.setItem({
            sku: 'MUG',
            name: 'Ceramic Mug',
            quantity: 0,
            status: 'OUT_OF_STOCK',
          });
        },
        'the product UNKNOWN-SKU does not exist': async () => {
          inventoryDb.reset();
          inventoryDb.deleteItem('UNKNOWN-SKU');
        },
      },
    });

    const output = await verifier.verifyProvider();
    expect(output).toBeDefined();
  });
});
